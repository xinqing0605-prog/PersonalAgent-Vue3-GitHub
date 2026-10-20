"""Image persistence, ownership and untrusted remote URL regressions."""
import base64
import io
import socket
import tempfile
import unittest
from contextlib import ExitStack
from pathlib import Path
from unittest.mock import MagicMock, patch
from types import SimpleNamespace

from fastapi.testclient import TestClient
from PIL import Image

import backend.app.auth as auth
import backend.app.image_assets as assets
import backend.app.main as main
import backend.app.user_storage as storage
from desktop.image_clipboard import decode_image, copy_bitmap


def png_bytes():
    output = io.BytesIO()
    Image.new('RGB', (32, 24), 'teal').save(output, format='PNG')
    return output.getvalue()


class ImageAssetsTests(unittest.TestCase):
    def setUp(self):
        self.stack = ExitStack()
        self.addCleanup(self.stack.close)
        self.root = Path(self.stack.enter_context(tempfile.TemporaryDirectory()))
        for target, name, value in [
            (auth, 'AUTH_DB_PATH', self.root / 'auth.db'),
            (storage, 'ROOT_DIR', self.root),
            (storage, 'USERS_ROOT', self.root / 'users'),
            (storage, 'LEGACY_USER_ID', 0),
        ]:
            self.stack.enter_context(patch.object(target, name, value))
        self.client = TestClient(main.app)
        result = self.client.post('/api/auth/register', json={'username': 'imageowner', 'password': 'Safe1234!'})
        self.assertEqual(result.status_code, 200, result.text)
        self.uid = result.json()['user']['id']
        self.data = png_bytes()
        self.source = 'data:image/png;base64,' + base64.b64encode(self.data).decode()

    def upload_chat_image(self, name='pasted.png', content=None):
        return self.client.post('/api/conversations/paste-test/files', json={'files': [
            {'filename': name, 'data_base64': base64.b64encode(content or self.data).decode()}]})

    def test_chat_image_and_text_reach_model_as_multimodal_content(self):
        self.assertEqual(self.upload_chat_image().status_code, 200)
        connection = {'id': 'vision', 'provider': 'Test', 'model': 'vision-model', 'api_key': 'test', 'base_url': 'https://example.test/v1'}
        client = MagicMock()
        client.chat.completions.create.return_value = SimpleNamespace(choices=[SimpleNamespace(
            message=SimpleNamespace(content='看到了图片', tool_calls=[]), finish_reason='stop')])
        with patch.object(main, 'retrieve', return_value=[]), patch.object(main, 'resolve_chat_model', return_value=connection), patch('openai.OpenAI', return_value=client):
            response = self.client.post('/api/ask', json={'question': '描述图片颜色', 'conversation_id': 'paste-test', 'attachment_filenames': ['pasted.png']})
        self.assertEqual(response.status_code, 200, response.text)
        content = client.chat.completions.create.call_args.kwargs['messages'][-1]['content']
        self.assertIn('描述图片颜色', content[0]['text'])
        self.assertEqual(content[1], {'type': 'image_url', 'image_url': {'url': self.source}})
        self.assertEqual(response.json()['answer_origin'], 'model')

    def test_chat_image_only_and_no_silent_fallback(self):
        self.assertEqual(self.upload_chat_image().status_code, 200)
        connection = {'id': 'vision', 'provider': 'Test', 'model': 'vision-model', 'api_key': 'test', 'base_url': 'https://example.test/v1'}
        payload = {'question': '', 'conversation_id': 'paste-test', 'attachment_filenames': ['pasted.png']}
        with patch.object(main, 'retrieve', return_value=[]), patch.object(main, 'resolve_chat_model', return_value=connection), patch.object(main, 'generate_agent_answer', return_value=('图片说明', [], [])) as generate:
            response = self.client.post('/api/ask', json=payload)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertIn('附件', generate.call_args.args[0])
        self.assertEqual(generate.call_args.args[4], [self.source])
        with patch.object(main, 'retrieve', return_value=[]), patch.object(main, 'resolve_chat_model', return_value=connection), patch.object(main, 'generate_agent_answer', side_effect=RuntimeError('unsupported')), patch.object(main, 'build_answer') as fallback:
            response = self.client.post('/api/ask', json=payload)
        self.assertEqual(response.status_code, 502)
        self.assertIn('图片理解', response.json()['detail'])
        fallback.assert_not_called()
        connection['model'] = 'z-image-turbo'
        with patch.object(main, 'retrieve', return_value=[]), patch.object(main, 'resolve_chat_model', return_value=connection), patch.object(main, 'generate_image_answer') as generate_image:
            response = self.client.post('/api/ask', json={**payload, 'question': '生成类似的图片'})
        self.assertEqual(response.status_code, 400)
        generate_image.assert_not_called()

    def test_large_chat_image_allowed_but_document_limit_unchanged(self):
        output = io.BytesIO()
        Image.new('RGB', (1000, 1000), 'teal').save(output, format='PNG', compress_level=0)
        self.assertGreater(len(output.getvalue()), 2_000_000)
        self.assertEqual(self.upload_chat_image(content=output.getvalue()).status_code, 200)
        self.assertEqual(self.upload_chat_image('large.txt', b'a' * 2_000_001).status_code, 413)

    def test_invalid_image_batch_and_excess_images_are_rejected(self):
        response = self.client.post('/api/conversations/paste-test/files', json={'files': [
            {'filename': 'ok.txt', 'data_base64': 'b2s='}, {'filename': 'fake.png', 'data_base64': 'b2s='}]})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.client.get('/api/conversations/paste-test/files').json()['files'], [])
        for index in range(5):
            self.assertEqual(self.upload_chat_image(f'{index}.png').status_code, 200)
        with self.assertRaises(main.HTTPException) as error:
            main.message_attachment_context('paste-test', [f'{i}.png' for i in range(5)], user_id=self.uid)
        self.assertEqual(error.exception.status_code, 400)
        with self.assertRaises(main.HTTPException):
            main.message_attachment_context('paste-test', ['missing.png'], user_id=self.uid)

    def test_saved_note_retains_image_after_remote_expires_and_edit(self):
        with patch.object(assets, 'download_image', return_value=self.data):
            response = self.client.post('/api/images/import', json={'source': 'https://example.org/generated.png?token=old'})
        self.assertEqual(response.status_code, 200, response.text)
        url = response.json()['url']
        content = f'生成的图片\n\n![图片]({url})'
        note = self.client.post('/api/notes', json={'title': '图片笔记', 'content': content})
        self.assertEqual(note.status_code, 200, note.text)
        with patch.object(assets, 'download_image', side_effect=OSError('expired')):
            response = self.client.get(url)
            self.assertEqual(response.content, self.data)
            self.assertEqual(response.headers['content-type'], 'image/png')
            self.assertIn('no-store', response.headers['cache-control'])
            self.assertEqual(self.client.post('/api/images/import', json={'source': url}).json()['url'], url)
            notes = self.client.get('/api/notes').json()
            self.assertIn(url, str(notes))
            note_id = notes['notes'][0]['id']
            edit = self.client.put(f'/api/notes/{note_id}', json={'title': '更新', 'content': content + '\n追加说明'})
            self.assertEqual(edit.status_code, 200, edit.text)
            self.assertEqual(self.client.get(url).content, self.data)
        duplicate = self.client.post('/api/images/import', json={'source': self.source}).json()['url']
        self.assertEqual(duplicate, url)
        self.assertEqual(len(list((storage.user_root(self.uid) / 'images').iterdir())), 1)

    def test_another_account_and_anonymous_cannot_read_or_import_owned_image(self):
        url = self.client.post('/api/images/import', json={'source': self.source}).json()['url']
        anonymous = TestClient(main.app)
        self.assertEqual(anonymous.get(url).status_code, 401)
        self.assertEqual(anonymous.post('/api/images/import', json={'source': self.source}).status_code, 401)
        other = TestClient(main.app)
        self.assertEqual(other.post('/api/auth/register', json={'username': 'imageother', 'password': 'Safe1234!'}).status_code, 200)
        self.assertEqual(other.get(url).status_code, 404)
        self.assertEqual(other.post('/api/images/import', json={'source': url}).status_code, 404)

    def test_invalid_data_and_missing_image_are_rejected(self):
        for source in ['data:image/svg+xml;base64,PHN2Zz4=', 'data:image/png;base64,broken',
                       'data:image/png;base64,bm90LWltYWdl', 'file:///C:/secret.png']:
            with self.subTest(source=source):
                self.assertEqual(self.client.post('/api/images/import', json={'source': source}).status_code, 400)
        self.assertEqual(self.client.get('/api/images/not-an-image').status_code, 404)
        with patch.object(assets, 'MAX_IMAGE_BYTES', 5):
            self.assertEqual(self.client.post('/api/images/import', json={'source': self.source}).status_code, 400)

    def test_remote_import_failure_is_reported(self):
        with patch.object(assets, 'download_image', side_effect=OSError('unreachable')):
            response = self.client.post('/api/images/import', json={'source': 'https://example.org/a.png'})
        self.assertEqual(response.status_code, 502)

    def test_private_addresses_and_redirects_are_rejected_before_connecting(self):
        private = [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('127.0.0.1', 443))]
        public = [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('93.184.216.34', 443))]
        with patch.object(assets.socket, 'getaddrinfo', return_value=private), patch.object(assets, '_PinnedHTTPSConnection') as connection:
            self.assertEqual(self.client.post('/api/images/import', json={'source': 'https://localhost/a.png'}).status_code, 400)
            connection.assert_not_called()
        with patch.object(assets.socket, 'getaddrinfo', side_effect=[public, private]), patch.object(assets, '_PinnedHTTPSConnection') as connection:
            response = connection.return_value.getresponse.return_value
            response.status = 302
            response.getheader.return_value = 'https://localhost/private.png'
            with self.assertRaises(ValueError):
                assets.download_image('https://example.org/a.png')
            self.assertEqual(connection.call_count, 1)
            connection.return_value.close.assert_called_once()

    def test_native_clipboard_decodes_images_and_transfers_memory_ownership(self):
        data, suffix = decode_image(self.source)
        self.assertEqual((data, suffix), (self.data, '.png'))
        with self.assertRaises(Exception):
            decode_image('data:image/png;base64,bm90LWltYWdl')
        # Fake WinAPI only: do not overwrite the user's real clipboard in unit tests.
        user, kernel = MagicMock(), MagicMock()
        kernel.GlobalAlloc.return_value = 123
        kernel.GlobalLock.return_value = 456
        user.CreateWindowExW.return_value = 789
        user.OpenClipboard.return_value = 1
        user.EmptyClipboard.return_value = 1
        user.SetClipboardData.return_value = 123
        with patch('desktop.image_clipboard.os.name', 'nt'), patch('desktop.image_clipboard.ctypes.WinDLL', side_effect=[user, kernel], create=True), patch('desktop.image_clipboard.ctypes.memmove'):
            copy_bitmap(data)
        user.SetClipboardData.assert_called_once_with(8, 123)
        user.OpenClipboard.assert_called_once_with(789)
        user.DestroyWindow.assert_called_once_with(789)
        user.CloseClipboard.assert_called_once()
        kernel.GlobalFree.assert_not_called()
        user.SetClipboardData.return_value = 0
        with patch('desktop.image_clipboard.os.name', 'nt'), patch('desktop.image_clipboard.ctypes.WinDLL', side_effect=[user, kernel], create=True), patch('desktop.image_clipboard.ctypes.memmove'):
            with self.assertRaises(OSError):
                copy_bitmap(data)
        kernel.GlobalFree.assert_called_once_with(123)


if __name__ == '__main__':
    unittest.main()
