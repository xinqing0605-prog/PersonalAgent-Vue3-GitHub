"""Windows process leases for account ownership and isolated WebView profiles.

Named handles, rather than PID files or timeouts, let Windows release a lease
even after a process crashes. Account keys include the authentication database,
so an isolated QA database cannot block a real account with the same numeric ID.
"""
from __future__ import annotations

import ctypes
from ctypes import wintypes
import hashlib
import os
from pathlib import Path
import socket
import threading


ACCOUNT_IN_USE = "该账户已在另一个窗口中运行，请使用已打开的窗口，或登录其他账户。"
ACCOUNT_SWITCH_REQUIRED = "此窗口已登录其他账户，请先退出登录。"


def _name(scope: str | Path, key: str) -> str:
    canonical = os.path.normcase(str(Path(scope).resolve()))
    digest = hashlib.sha256(f"{canonical}\0{key}".encode()).hexdigest()
    return "Local\\PersonalAgent-" + digest


class WindowsLease:
    """Keep a named kernel object alive without relying on thread ownership."""

    def __init__(self, scope: str | Path, key: str):
        if os.name != "nt":
            raise RuntimeError("桌面账户防多开需要 Windows。")
        self.name = _name(scope, key)
        self.handle = None
        self.event = None
        self.kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        signatures = {
            "CreateMutexW": ([ctypes.c_void_p, wintypes.BOOL, wintypes.LPCWSTR], wintypes.HANDLE),
            "CreateEventW": ([ctypes.c_void_p, wintypes.BOOL, wintypes.BOOL, wintypes.LPCWSTR], wintypes.HANDLE),
            "OpenEventW": ([wintypes.DWORD, wintypes.BOOL, wintypes.LPCWSTR], wintypes.HANDLE),
            "SetEvent": ([wintypes.HANDLE], wintypes.BOOL),
            "WaitForSingleObject": ([wintypes.HANDLE, wintypes.DWORD], wintypes.DWORD),
            "CloseHandle": ([wintypes.HANDLE], wintypes.BOOL),
        }
        for function, (args, result) in signatures.items():
            getattr(self.kernel, function).argtypes = args
            getattr(self.kernel, function).restype = result

    def acquire(self) -> bool:
        if self.handle:
            return True
        ctypes.set_last_error(0)
        handle = self.kernel.CreateMutexW(None, False, self.name)
        error = ctypes.get_last_error()
        if not handle:
            raise ctypes.WinError(error)
        if error == 183:  # ERROR_ALREADY_EXISTS
            self.kernel.CloseHandle(handle)
            return False
        self.handle = handle
        self.event = self.kernel.CreateEventW(None, False, False, self.name + "-activate")
        if not self.event:
            error = ctypes.get_last_error()
            self.close()
            raise ctypes.WinError(error)
        return True

    def activate_owner(self) -> None:
        event = self.kernel.OpenEventW(0x0002, False, self.name + "-activate")
        if event:
            try:
                self.kernel.SetEvent(event)
            finally:
                self.kernel.CloseHandle(event)

    def activation_requested(self) -> bool:
        return bool(self.event and self.kernel.WaitForSingleObject(self.event, 0) == 0)

    def close(self) -> None:
        # Drop the event before the lease so the next owner gets a fresh event.
        if self.event:
            self.kernel.CloseHandle(self.event)
            self.event = None
        if self.handle:
            self.kernel.CloseHandle(self.handle)
            self.handle = None


class AccountInUse(RuntimeError):
    pass


class DesktopAccounts:
    def __init__(self, database: Path):
        self.database = database
        self.user_id = None
        self.lease = None
        self.on_activate = None
        self.on_account_changed = None
        self._lock = threading.RLock()
        self._stopped = threading.Event()
        self._listener = threading.Thread(target=self._listen, name="account-activation", daemon=True)
        self._listener.start()

    def _claim(self, user: dict) -> bool:
        user_id = int(user["id"])
        if self.user_id == user_id:
            return False
        if self.user_id is not None:
            raise AccountInUse(ACCOUNT_SWITCH_REQUIRED)
        lease = WindowsLease(self.database, f"account:{user_id}")
        if not lease.acquire():
            lease.activate_owner()
            raise AccountInUse(ACCOUNT_IN_USE)
        self.lease = lease
        self.user_id = user_id
        if self.on_account_changed:
            try:
                self.on_account_changed(str(user.get("username", user_id)))
            except Exception:
                pass  # Native title refresh must not undo an account claim.
        return True

    def claim(self, user: dict) -> None:
        with self._lock:
            self._claim(user)

    def create_session(self, user: dict, factory):
        with self._lock:
            newly_claimed = self._claim(user)
            try:
                return factory(int(user["id"]))
            except Exception:
                if newly_claimed:
                    self.release(int(user["id"]))
                raise

    def release(self, user_id: int) -> None:
        with self._lock:
            if self.user_id != int(user_id):
                return
            if self.lease:
                self.lease.close()
            self.lease = None
            self.user_id = None
            if self.on_account_changed:
                try:
                    self.on_account_changed("")
                except Exception:
                    pass

    def _listen(self):
        while not self._stopped.wait(0.15):
            with self._lock:
                activate = self.lease and self.lease.activation_requested()
            if activate and self.on_activate:
                try:
                    self.on_activate()
                except Exception:
                    pass  # Window may already be closing; lease safety is unaffected.

    def close(self):
        self._stopped.set()
        self._listener.join(timeout=1)
        with self._lock:
            if self.lease:
                self.lease.close()
            self.lease = None
            self.user_id = None


class DesktopProfile:
    """Reserve a stable port and cookie store for each simultaneously open window."""

    def __init__(self, root: Path, host: str, preferred_port: int):
        self.lease = None
        self.socket = None
        for index in range(20):
            lease = WindowsLease(root, f"profile:{index}")
            if not lease.acquire():
                continue
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            try:
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
                sock.bind((host, preferred_port + index))
                sock.listen(128)
            except OSError:
                sock.close()
                lease.close()
                continue
            self.lease = lease
            self.socket = sock
            self.port = preferred_port + index
            # Preserve the original profile for the first window, including its
            # cookies and local conversation history. Never copy a live profile.
            self.storage_path = root / "data" / ("webview" if index == 0 else f"webview-profiles/{index}")
            return
        raise RuntimeError("没有可用的桌面窗口位置，请关闭暂时不用的窗口后重试。")

    def close(self):
        if self.socket:
            self.socket.close()
            self.socket = None
        if self.lease:
            self.lease.close()
            self.lease = None
