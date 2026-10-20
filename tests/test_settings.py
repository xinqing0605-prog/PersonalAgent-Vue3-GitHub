import tempfile
import unittest
from pathlib import Path

from backend.app.settings import build_settings


class SettingsTests(unittest.TestCase):
    def test_local_profile_preserves_existing_data_layout(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary).resolve()
            settings = build_settings({"APP_ENV": "local"}, default_root_dir=root)
            self.assertEqual(settings.environment, "local")
            self.assertEqual(settings.auth_db_path, root / "data" / "auth.db")
            self.assertEqual(settings.users_root, root / "data" / "users")
            self.assertFalse(settings.cookie_secure)
            self.assertFalse(settings.allow_shared_model_credentials)
            self.assertEqual(settings.errors(), [])

    def test_shared_model_credentials_require_explicit_opt_in(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            settings = build_settings(
                {"APP_ENV": "local", "ALLOW_SHARED_MODEL_CREDENTIALS": "true"},
                default_root_dir=Path(temporary),
            )
            self.assertTrue(settings.allow_shared_model_credentials)
            self.assertTrue(settings.safe_summary()["allow_shared_model_credentials"])

    def test_test_profile_is_isolated_from_local_data(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary).resolve()
            settings = build_settings({"APP_ENV": "test"}, default_root_dir=root)
            self.assertEqual(settings.auth_db_path, root / ".runtime" / "test" / "auth.db")
            self.assertEqual(settings.users_root, root / ".runtime" / "test" / "users")
            self.assertEqual(settings.legacy_user_id, 0)
            self.assertEqual(settings.port, 8001)
            self.assertIn("_test", settings.session_cookie_name)

    def test_production_profile_rejects_development_shortcuts(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            settings = build_settings(
                {
                    "APP_ENV": "production",
                    "APP_DEBUG": "true",
                    "ALLOW_KEY_REVEAL": "true",
                    "SESSION_COOKIE_SECURE": "false",
                    "SMS_PROVIDER": "console",
                    "SMS_DEV_MODE": "true",
                    "ALLOWED_HOSTS": "*",
                },
                default_root_dir=Path(temporary),
            )
            errors = " ".join(settings.errors())
            self.assertIn("生产环境禁止开启 APP_DEBUG", errors)
            self.assertIn("生产环境必须开启 SESSION_COOKIE_SECURE", errors)
            self.assertIn("不能使用 console", errors)
            self.assertIn("不能使用通配符", errors)

    def test_safe_production_profile_can_start_with_sms_disabled(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            settings = build_settings(
                {
                    "APP_ENV": "production",
                    "APP_DEBUG": "false",
                    "ALLOW_KEY_REVEAL": "false",
                    "SESSION_COOKIE_SECURE": "true",
                    "SMS_PROVIDER": "disabled",
                    "SMS_DEV_MODE": "false",
                    "ALLOWED_HOSTS": "agent.example.com",
                },
                default_root_dir=Path(temporary),
            )
            self.assertEqual(settings.errors(), [])
            self.assertTrue(any("SQLite" in item for item in settings.warnings()))



if __name__ == "__main__":
    unittest.main()
