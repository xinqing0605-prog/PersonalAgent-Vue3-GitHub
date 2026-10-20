"""Windows bitmap clipboard support for WebView without browser permissions."""
import base64
import ctypes
import io
import os
import time
from ctypes import wintypes

from PIL import Image


def decode_image(value: str) -> tuple[bytes, str]:
    if len(value) > 22_000_000:
        raise ValueError("图片不能超过 16 MB。")
    header, _, encoded = value.partition(",")
    if header not in {"data:image/png;base64", "data:image/jpeg;base64", "data:image/webp;base64"}:
        raise ValueError("图片格式不受支持。")
    data = base64.b64decode(encoded, validate=True)
    with Image.open(io.BytesIO(data)) as image:
        suffix = {"PNG": ".png", "JPEG": ".jpg", "WEBP": ".webp"}.get(image.format)
        if not suffix or image.width * image.height > 25_000_000:
            raise ValueError("图片格式或大小不受支持。")
        image.verify()
    return data, suffix


def copy_bitmap(data: bytes) -> None:
    if os.name != "nt":
        raise ValueError("桌面图片复制仅支持 Windows。")
    with Image.open(io.BytesIO(data)) as image:
        output = io.BytesIO()
        image.convert("RGB").save(output, format="BMP")
        bitmap = output.getvalue()[14:]
    user32, kernel32 = ctypes.WinDLL("user32", use_last_error=True), ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.GlobalAlloc.argtypes = [wintypes.UINT, ctypes.c_size_t]
    kernel32.GlobalAlloc.restype = wintypes.HGLOBAL
    kernel32.GlobalLock.argtypes = [wintypes.HGLOBAL]
    kernel32.GlobalLock.restype = ctypes.c_void_p
    kernel32.GlobalUnlock.argtypes = [wintypes.HGLOBAL]
    kernel32.GlobalFree.argtypes = [wintypes.HGLOBAL]
    kernel32.GlobalFree.restype = wintypes.HGLOBAL
    user32.CreateWindowExW.argtypes = [wintypes.DWORD, wintypes.LPCWSTR, wintypes.LPCWSTR,
                                     wintypes.DWORD, ctypes.c_int, ctypes.c_int, ctypes.c_int,
                                     ctypes.c_int, wintypes.HWND, wintypes.HMENU,
                                     wintypes.HINSTANCE, ctypes.c_void_p]
    user32.CreateWindowExW.restype = wintypes.HWND
    user32.DestroyWindow.argtypes = [wintypes.HWND]
    user32.OpenClipboard.argtypes = [wintypes.HWND]
    user32.SetClipboardData.argtypes = [wintypes.UINT, wintypes.HANDLE]
    user32.SetClipboardData.restype = wintypes.HANDLE
    handle = kernel32.GlobalAlloc(0x0002, len(bitmap))
    if not handle:
        raise OSError("无法分配图片剪贴板内存。")
    opened = False
    owner = None
    try:
        # A non-null owner is required by EmptyClipboard / SetClipboardData.
        # STATIC is a built-in class; HWND_MESSAGE creates no visible window.
        owner = user32.CreateWindowExW(0, "STATIC", "PersonalAgentClipboard", 0,
                                      0, 0, 0, 0, -3, None, None, None)
        if not owner:
            raise OSError("无法创建图片剪贴板窗口。")
        pointer = kernel32.GlobalLock(handle)
        if not pointer:
            raise OSError("无法准备图片剪贴板。")
        try:
            ctypes.memmove(pointer, bitmap, len(bitmap))
        finally:
            kernel32.GlobalUnlock(handle)
        for _ in range(10):
            if user32.OpenClipboard(owner):
                opened = True
                break
            time.sleep(.05)
        if not opened:
            raise OSError("剪贴板正在被占用，请稍后重试。")
        if not user32.EmptyClipboard() or not user32.SetClipboardData(8, handle):
            raise OSError("写入图片剪贴板失败。")
        handle = None  # Ownership transfers to Windows after SetClipboardData.
    finally:
        if opened:
            user32.CloseClipboard()
        if handle:
            kernel32.GlobalFree(handle)
        if owner:
            user32.DestroyWindow(owner)
