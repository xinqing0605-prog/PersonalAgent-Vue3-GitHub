import os
import socket
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch

import httpx

from desktop.instance_guard import AccountInUse, DesktopAccounts, DesktopProfile, WindowsLease


@unittest.skipUnless(os.name == 'nt', 'Windows desktop process leases')
class DesktopAccountTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.guards = []

    def guard(self, database='auth.db'):
        guard = DesktopAccounts(self.root / database)
        self.guards.append(guard)
        return guard

    def tearDown(self):
        for guard in self.guards:
            guard.close()
        self.temp.cleanup()

    def test_same_account_denied_and_different_account_allowed(self):
        first, second = self.guard(), self.guard()
        first.claim({'id': 1})
        first.claim({'id': 1})  # Refresh/repeated requests must remain valid.
        with self.assertRaisesRegex(AccountInUse, '另一个窗口'):
            second.claim({'id': 1})
        second.claim({'id': 2})
        self.assertEqual((first.user_id, second.user_id), (1, 2))

    def test_cannot_switch_account_without_logout(self):
        guard = self.guard()
        guard.claim({'id': 1})
        with self.assertRaisesRegex(AccountInUse, '先退出'):
            guard.claim({'id': 2})
        guard.release(2)  # A different account cannot release this window.
        self.assertEqual(guard.user_id, 1)
        guard.release(1)
        guard.claim({'id': 2})

    def test_logout_and_shutdown_release_account(self):
        first, second = self.guard(), self.guard()
        first.claim({'id': 1})
        first.release(1)
        second.claim({'id': 1})
        second.close()
        first.claim({'id': 1})

    def test_independent_databases_do_not_conflict(self):
        first, second = self.guard(), self.guard('isolated.db')
        first.claim({'id': 1})
        second.claim({'id': 1})

    def test_failed_session_creation_rolls_back_new_claim(self):
        first, second = self.guard(), self.guard()
        def fail(_uid):
            raise OSError('disk unavailable')
        with self.assertRaises(OSError):
            first.create_session({'id': 1}, fail)
        second.claim({'id': 1})

    def test_duplicate_login_activates_owner(self):
        first, second = self.guard(), self.guard()
        activated = threading.Event()
        first.on_activate = activated.set
        first.claim({'id': 1})
        with self.assertRaises(AccountInUse):
            second.claim({'id': 1})
        self.assertTrue(activated.wait(3))

    def test_simultaneous_claim_has_one_winner(self):
        guards = [self.guard() for _ in range(6)]
        barrier = threading.Barrier(len(guards))
        def claim(guard):
            barrier.wait()
            try:
                guard.claim({'id': 1})
                return True
            except AccountInUse:
                return False
        with ThreadPoolExecutor(max_workers=6) as pool:
            self.assertEqual(sum(pool.map(claim, guards)), 1)

    def test_profiles_reserve_different_ports_and_cookie_stores(self):
        with socket.socket() as probe:
            probe.bind(('127.0.0.1', 0))
            port = probe.getsockname()[1]
        first = DesktopProfile(self.root, '127.0.0.1', port)
        second = DesktopProfile(self.root, '127.0.0.1', port)
        try:
            self.assertNotEqual(first.port, second.port)
            self.assertEqual(first.storage_path, self.root / 'data/webview')
            self.assertNotEqual(first.storage_path, second.storage_path)
            path, used_port = first.storage_path, first.port
            first.close()
            reopened = DesktopProfile(self.root, '127.0.0.1', port)
            try:
                self.assertEqual((reopened.storage_path, reopened.port), (path, used_port))
            finally:
                reopened.close()
        finally:
            first.close()
            second.close()


SERVER_CODE = '''
import os, sys
from pathlib import Path
from desktop.desktop_app import _start_server
from desktop.instance_guard import DesktopAccounts, DesktopProfile
profile = DesktopProfile(Path(os.environ['AGENT_RUNTIME_DIR']) / sys.argv[1], '127.0.0.1', int(sys.argv[1]))
guard = DesktopAccounts(Path(os.environ['AUTH_DB_PATH']))
server, thread = _start_server('127.0.0.1', profile.port, desktop_accounts=guard, listener=profile.socket)
try:
    thread.join()
finally:
    guard.close()
    profile.close()
'''


@unittest.skipUnless(os.name == 'nt', 'Real Windows multi-process regression')
class DesktopProcessTests(unittest.TestCase):
    def test_two_backend_processes_login_restore_concurrency_and_crash(self):
        root = Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory() as temporary:
            env = dict(os.environ, APP_ENV='test', AUTH_DB_PATH=str(Path(temporary)/'auth.db'),
                       AGENT_RUNTIME_DIR=temporary, AGENT_USER_DATA_ROOT=str(Path(temporary)/'users'),
                       AGENT_LEGACY_USER_ID='0', ALLOW_SHARED_MODEL_CREDENTIALS='false',
                       PYTHONDONTWRITEBYTECODE='1', PYTHONPATH=os.pathsep.join(sys.path))
            # Windows venv python.exe redirects to another process. Start the
            # real interpreter with our import paths so kill/terminate reaches
            # the server itself and releases its leases and log handles.
            interpreter = getattr(sys, '_base_executable', sys.executable)
            processes, clients = [], []
            log = open(Path(temporary)/'processes.log', 'w+', encoding='utf-8')
            try:
                for _ in range(2):
                    with socket.socket() as probe:
                        probe.bind(('127.0.0.1', 0))
                        port = probe.getsockname()[1]
                    process = subprocess.Popen([interpreter, '-B', '-c', SERVER_CODE, str(port)],
                                               cwd=root, env=env, stdout=log, stderr=log,
                                               creationflags=subprocess.CREATE_NO_WINDOW)
                    processes.append(process)
                    client = httpx.Client(base_url=f'http://127.0.0.1:{port}', timeout=10, trust_env=False)
                    clients.append(client)
                    for attempt in range(100):
                        if process.poll() is not None:
                            log.flush(); log.seek(0)
                            self.fail(log.read())
                        try:
                            if client.get('/api/health').status_code == 200:
                                break
                        except httpx.RequestError:
                            pass
                        time.sleep(.1)
                    else:
                        self.fail('test server did not start')
                first, second = clients
                a = dict(username='DesktopA', password='Safe1234!')
                b = dict(username='DesktopB', password='Other1234!')
                self.assertEqual(first.post('/api/auth/register', json=a).status_code, 200)
                self.assertEqual(second.post('/api/auth/register', json=b).status_code, 200)
                self.assertEqual(first.get('/api/auth/me').json()['user']['username'], 'DesktopA')
                self.assertEqual(second.get('/api/auth/me').json()['user']['username'], 'DesktopB')
                saved = {'activeId': 'one', 'conversations': [{'id': 'one', 'messages': [{'content': 'A private history'}]}]}
                self.assertEqual(first.put('/api/desktop/conversations', json=saved).status_code, 200)
                self.assertIsNone(second.get('/api/desktop/conversations').json()['state'])
                self.assertEqual(second.post('/api/auth/logout').status_code, 200)
                denied = second.post('/api/auth/login', json=a)
                self.assertEqual(denied.status_code, 409)
                self.assertEqual(denied.json()['code'], 'desktop_account_in_use')
                self.assertNotIn('set-cookie', denied.headers)
                # A copied/restored cookie cannot bypass the guard or log out A.
                second.cookies.update(first.cookies)
                self.assertEqual(second.get('/api/auth/status').status_code, 409)
                self.assertEqual(second.get('/api/auth/me').status_code, 409)
                self.assertEqual(second.get('/api/theme').status_code, 409)
                second.cookies.clear()
                second.post('/api/auth/logout')
                self.assertEqual(first.get('/api/auth/status').status_code, 200)
                first.post('/api/auth/logout')
                self.assertEqual(second.post('/api/auth/login', json=a).status_code, 200)
                self.assertEqual(second.get('/api/desktop/conversations').json()['state'], saved)
                second.post('/api/auth/logout')
                barrier = threading.Barrier(2)
                def login(client):
                    barrier.wait()
                    return client.post('/api/auth/login', json=a).status_code
                with ThreadPoolExecutor(max_workers=2) as pool:
                    statuses = list(pool.map(login, clients))
                self.assertEqual(sorted(statuses), [200, 409])
                winner = statuses.index(200)
                loser = 1 - winner
                processes[winner].kill()  # Simulate a crash, not a graceful release.
                processes[winner].wait(timeout=10)
                clients[loser].cookies.clear()
                self.assertEqual(clients[loser].post('/api/auth/login', json=a).status_code, 200)
            finally:
                for client in clients:
                    client.close()
                for process in processes:
                    if process.poll() is None:
                        process.terminate()
                    process.wait(timeout=10)
                log.close()


class DesktopStateTests(unittest.TestCase):
    def test_failed_atomic_write_preserves_existing_history(self):
        import backend.app.desktop_state as state
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            with patch.object(state, 'conversations_dir', return_value=directory):
                first = {'activeId': 'one', 'conversations': [{'id': 'one'}]}
                state.save_desktop_state(1, first)
                with patch.object(state.os, 'replace', side_effect=OSError('disk full')):
                    with self.assertRaises(OSError):
                        state.save_desktop_state(1, {'activeId': 'two', 'conversations': []})
                self.assertEqual(state.load_desktop_state(1), first)
                self.assertEqual(len(list(directory.iterdir())), 1)

    def test_invalid_state_is_rejected(self):
        from backend.app.desktop_state import save_desktop_state
        with self.assertRaises(ValueError):
            save_desktop_state(1, {'conversations': []})


if __name__ == '__main__':
    unittest.main()
