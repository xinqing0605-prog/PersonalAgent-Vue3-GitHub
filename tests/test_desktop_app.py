import tempfile
import unittest
from pathlib import Path

from desktop.desktop_app import DesktopLifecycle, _start_webview


class FakeWindow:
    def __init__(self) -> None:
        self.hidden = False
        self.shown = False
        self.restored = False
        self.destroyed = False

    def hide(self) -> None:
        self.hidden = True

    def show(self) -> None:
        self.shown = True

    def restore(self) -> None:
        self.restored = True

    def destroy(self) -> None:
        self.destroyed = True


class FakeServer:
    should_exit = False


class FakeTray:
    def __init__(self) -> None:
        self.stopped = False

    def stop(self) -> None:
        self.stopped = True


class FakeWebview:
    def __init__(self) -> None:
        self.options = None

    def start(self, **options) -> None:
        self.options = options


class DesktopLifecycleTests(unittest.TestCase):
    def test_window_close_hides_to_tray_until_explicit_exit(self) -> None:
        window = FakeWindow()
        server = FakeServer()
        lifecycle = DesktopLifecycle(window, server)
        tray = FakeTray()
        lifecycle.attach_tray(tray)

        self.assertFalse(lifecycle.on_closing())
        self.assertTrue(window.hidden)
        self.assertFalse(server.should_exit)

        lifecycle.show_window()
        self.assertTrue(window.shown)
        self.assertTrue(window.restored)

        lifecycle.exit_app()
        self.assertTrue(window.destroyed)
        self.assertTrue(tray.stopped)
        self.assertTrue(lifecycle.on_closing())

    def test_webview_uses_persistent_profile(self) -> None:
        webview = FakeWebview()
        with tempfile.TemporaryDirectory() as temporary_directory:
            storage_path = Path(temporary_directory) / "webview"
            _start_webview(webview, storage_path)
            self.assertTrue(storage_path.is_dir())
            self.assertEqual(webview.options["private_mode"], False)
            self.assertEqual(webview.options["storage_path"], str(storage_path))


if __name__ == "__main__":
    unittest.main()
