from __future__ import annotations

import argparse
import os
import shutil
import socket
import sys
import threading
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen


def _runtime_project_root() -> Path:
    """Return a writable application root in both source and packaged modes."""
    if not getattr(sys, "frozen", False):
        return Path(__file__).resolve().parents[1]

    bundle_root = Path(getattr(sys, "_MEIPASS", Path(sys.executable).resolve().parent))
    local_app_data = Path(os.getenv("LOCALAPPDATA", str(Path.home() / "AppData" / "Local")))
    # The QA build can use an isolated profile without overwriting running assets.
    override_root = os.getenv("AGENT_DESKTOP_DATA_DIR", "").strip()
    root = Path(override_root).resolve() if override_root else local_app_data / "PersonalAgent"
    root.mkdir(parents=True, exist_ok=True)
    bundled_frontend = bundle_root / "frontend"
    frontend = root / "frontend"
    if bundled_frontend.is_dir():
        # Front-end files are application assets, not user data, so refresh them
        # on each packaged launch while leaving data and knowledge untouched.
        shutil.copytree(bundled_frontend, frontend, dirs_exist_ok=True)
    for name in ("data", "knowledge", "notes", "workspace"):
        (root / name).mkdir(parents=True, exist_ok=True)
    return root


PROJECT_ROOT = _runtime_project_root()
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765


class DesktopApi:
    """Small trusted bridge for native file dialogs used by the desktop shell."""

    def copy_image(self, data_url: str) -> dict[str, object]:
        from desktop.image_clipboard import copy_bitmap, decode_image
        try:
            data, _ = decode_image(data_url)
            copy_bitmap(data)
            return {"success": True}
        except Exception:
            return {"success": False, "message": "复制图片失败，剪贴板可能正在被其他程序占用，请重试。"}

    def save_image(self, data_url: str) -> dict[str, object]:
        from desktop.image_clipboard import decode_image
        from tkinter import Tk, filedialog
        try:
            data, suffix = decode_image(data_url)
            root = Tk()
            root.withdraw()
            root.attributes("-topmost", True)
            try:
                selected = filedialog.asksaveasfilename(
                    parent=root, title="保存生成图片", initialfile=f"生成图片{suffix}",
                    defaultextension=suffix, filetypes=(("图片", f"*{suffix}"),),
                )
            finally:
                root.destroy()
            if not selected:
                return {"success": False, "cancelled": True}
            Path(selected).write_bytes(data)
            return {"success": True}
        except Exception:
            return {"success": False, "message": "保存图片失败，请检查所选目录是否可写。"}

    def save_backup_json(self, filename: str, content: str) -> dict[str, object]:
        from tkinter import Tk, filedialog

        root = Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        try:
            selected = filedialog.asksaveasfilename(
                parent=root,
                title="导出本机对话数据",
                initialfile=Path(filename).name or "personal-agent-backup.json",
                defaultextension=".json",
                filetypes=(("JSON 备份", "*.json"), ("所有文件", "*.*")),
            )
        finally:
            root.destroy()
        if not selected:
            return {"success": False, "cancelled": True}
        try:
            destination = Path(selected)
            destination.write_text(str(content), encoding="utf-8")
        except OSError as exc:
            return {"success": False, "cancelled": False, "message": f"备份保存失败：{exc}"}
        return {"success": True, "cancelled": False, "path": str(destination)}


class DesktopLifecycle:
    """Coordinate window close, tray restore, and the local API lifetime."""

    def __init__(self, window, server) -> None:
        self.window = window
        self.server = server
        self.tray_icon = None
        self.exit_requested = threading.Event()

    def attach_tray(self, tray_icon) -> None:
        self.tray_icon = tray_icon

    def on_closing(self) -> bool:
        if self.exit_requested.is_set():
            return True
        self.window.hide()
        return False

    def show_window(self, *_args) -> None:
        self.window.show()
        try:
            self.window.restore()
        except Exception:
            # Some pywebview backends show an already-normal window without a
            # separate restore operation.
            pass

    def exit_app(self, *_args) -> None:
        self.exit_requested.set()
        if self.tray_icon is not None:
            self.tray_icon.stop()
        self.window.destroy()

    def on_closed(self) -> None:
        self.server.should_exit = True
        if self.tray_icon is not None:
            self.tray_icon.stop()

    def shutdown(self) -> None:
        if self.tray_icon is not None:
            self.tray_icon.stop()


def _create_tray_icon(lifecycle: DesktopLifecycle):
    try:
        import pystray
        from PIL import Image, ImageDraw
    except ImportError as exc:
        raise RuntimeError("未安装系统托盘组件。请执行：.venv\\Scripts\\python.exe -m pip install -r desktop\\requirements.txt") from exc

    image = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.ellipse((4, 4, 60, 60), fill=(19, 123, 109, 255))
    draw.ellipse((18, 18, 46, 46), fill=(201, 241, 231, 255))
    draw.ellipse((25, 25, 39, 39), fill=(7, 95, 82, 255))
    menu = pystray.Menu(
        pystray.MenuItem("打开主界面", lifecycle.show_window, default=True),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("退出", lifecycle.exit_app),
    )
    return pystray.Icon("PersonalAgent", image, "个人知识库与事务助手", menu)


def _start_webview(webview, storage_path: Path | None = None) -> None:
    storage_path = storage_path or (PROJECT_ROOT / "data" / "webview")
    storage_path.mkdir(parents=True, exist_ok=True)
    webview.start(debug=False, private_mode=False, storage_path=str(storage_path))


def _port_available(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.2)
        return sock.connect_ex((host, port)) != 0


def _find_port(host: str, preferred: int) -> int:
    if _port_available(host, preferred):
        return preferred
    for port in range(preferred + 1, preferred + 20):
        if _port_available(host, port):
            return port
    raise RuntimeError("没有找到可用的本地端口")


def _wait_for_server(url: str, timeout: float = 15.0) -> None:
    deadline = time.time() + timeout
    last_error: Exception | None = None
    while time.time() < deadline:
        try:
            with urlopen(f"{url}/api/health", timeout=0.5) as response:
                if response.status == 200:
                    return
        except (OSError, URLError) as exc:
            last_error = exc
        time.sleep(0.15)
    raise RuntimeError(f"本地服务启动超时: {last_error}")


def _start_server(host: str, port: int, *, desktop_accounts=None, listener=None):
    os.environ["AGENT_ROOT_DIR"] = str(PROJECT_ROOT)
    sys.path.insert(0, str(PROJECT_ROOT))
    import uvicorn

    from backend.app.main import app

    app.state.desktop_accounts = desktop_accounts

    # PyInstaller 的 --windowed 模式没有标准控制台输出。禁用 Uvicorn 的
    # 默认 dictConfig，避免它为不存在的 stderr 配置默认 formatter 而启动失败。
    server = uvicorn.Server(
        uvicorn.Config(
            app,
            host=host,
            port=port,
            log_level="warning",
            access_log=False,
            log_config=None,
        )
    )
    kwargs = {"sockets": [listener]} if listener is not None else {}
    thread = threading.Thread(target=server.run, kwargs=kwargs, name="agent-api", daemon=True)
    thread.start()
    return server, thread


def _show_startup_error(message: str) -> None:
    """Report startup failures in a normal dialog when launched with pythonw."""
    try:
        from tkinter import Tk, messagebox

        root = Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        messagebox.showerror("个人知识库与事务助手", message, parent=root)
        root.destroy()
    except Exception:
        # The frozen build is windowed; there is intentionally no console fallback.
        pass


def run_desktop(host: str = DEFAULT_HOST, port: int = DEFAULT_PORT) -> int:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from desktop.instance_guard import DesktopAccounts, DesktopProfile

    os.environ["AGENT_ROOT_DIR"] = str(PROJECT_ROOT)
    from backend.app.settings import SETTINGS

    profile = DesktopProfile(PROJECT_ROOT, host, port)
    accounts = DesktopAccounts(SETTINGS.auth_db_path)
    server = thread = None
    url = f"http://{host}:{profile.port}"
    lifecycle = None
    try:
        server, thread = _start_server(host, profile.port, desktop_accounts=accounts, listener=profile.socket)
        _wait_for_server(url)
        try:
            import webview
        except ImportError as exc:
            raise RuntimeError("未安装桌面窗口组件。请执行：.venv\\Scripts\\python.exe -m pip install -r desktop\\requirements.txt") from exc
        else:
            window = webview.create_window(
                "个人知识库与事务助手",
                url,
                js_api=DesktopApi(),
                width=1360,
                height=900,
                min_size=(1000, 680),
                background_color="#f6f8fb",
            )
            lifecycle = DesktopLifecycle(window, server)
            accounts.on_activate = lifecycle.show_window
            window.events.closing += lifecycle.on_closing
            window.events.closed += lifecycle.on_closed
            tray_icon = _create_tray_icon(lifecycle)
            lifecycle.attach_tray(tray_icon)
            def update_account_title(username):
                title = "个人知识库与事务助手" + (f" — {username}" if username else " — 登录其他账户")
                window.set_title(title)
                tray_icon.title = title
            accounts.on_account_changed = update_account_title
            tray_icon.run_detached()
            _start_webview(webview, profile.storage_path)
    finally:
        if lifecycle is not None:
            lifecycle.shutdown()
        if server is not None:
            server.should_exit = True
        if thread is not None:
            thread.join(timeout=3)
        accounts.close()
        profile.close()
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Personal Agent desktop launcher")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=int(os.getenv("AGENT_DESKTOP_PORT", DEFAULT_PORT)))
    parser.add_argument("--check", action="store_true", help="只检查导入和项目路径，不启动窗口")
    parser.add_argument("--server-check", action="store_true", help="启动并健康检查本地服务，不显示窗口")
    args = parser.parse_args()
    if args.check:
        os.environ["AGENT_ROOT_DIR"] = str(PROJECT_ROOT)
        sys.path.insert(0, str(PROJECT_ROOT))
        from backend.app.main import app

        print(f"desktop launcher ok: {PROJECT_ROOT}")
        print(f"routes: {len(app.routes)}")
        return 0
    if args.server_check:
        server, thread = _start_server(args.host, args.port)
        try:
            _wait_for_server(f"http://{args.host}:{args.port}")
            print("desktop server check ok")
            return 0
        finally:
            server.should_exit = True
            thread.join(timeout=3)
    try:
        return run_desktop(args.host, args.port)
    except Exception as exc:
        _show_startup_error(str(exc))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
