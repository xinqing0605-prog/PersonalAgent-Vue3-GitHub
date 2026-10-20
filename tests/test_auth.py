import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

import backend.app.auth as auth
from backend.app.main import app


class AuthApiTests(unittest.TestCase):
    def test_password_policy_rejects_weak_credentials(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            with patch.object(auth, "AUTH_DB_PATH", Path(temporary) / "auth.db"):
                with self.assertRaisesRegex(ValueError, "密码需同时包含"):
                    auth.register_user("demo", "Pass1234")
                with self.assertRaisesRegex(ValueError, "用户名需为"):
                    auth.register_user("中文名", "Pass1234!")
                with self.assertRaisesRegex(ValueError, "用户名需为"):
                    auth.register_user("a-", "Pass1234!")
                with self.assertRaisesRegex(ValueError, "密码长度需为"):
                    auth.register_user("demo", "Pass1234!" + "a" * 12)

    def test_password_policy_requires_all_character_classes(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            with patch.object(auth, "AUTH_DB_PATH", Path(temporary) / "auth.db"):
                for password in ("pass1234!", "PASS1234!", "PassWord!", "Pass1234"):
                    with self.assertRaisesRegex(ValueError, "密码需同时包含"):
                        auth.register_user("demo", password)

    def test_register_protects_api_and_logout_revokes_session(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            with patch.object(auth, "AUTH_DB_PATH", Path(temporary) / "auth.db"):
                client = TestClient(app)
                self.assertEqual(client.get("/api/brief").status_code, 401)
                registered = client.post("/api/auth/register", json={"username": "demo", "password": "Pass1234!"})
                self.assertEqual(registered.status_code, 200)
                self.assertEqual(client.get("/api/auth/me").status_code, 200)
                self.assertEqual(client.get("/api/brief").status_code, 200)
                self.assertEqual(client.post("/api/auth/logout").status_code, 200)
                self.assertEqual(client.get("/api/brief").status_code, 401)

    def test_multiple_password_accounts_are_supported_and_duplicates_are_blocked(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            db_path = Path(temporary) / "auth.db"
            with patch.object(auth, "AUTH_DB_PATH", db_path):
                first = auth.register_user("demo", "Pass1234!")
                second = auth.register_user("second", "Other1234!")
                self.assertEqual(first["username"], "demo")
                self.assertEqual(second["username"], "second")
                self.assertEqual(auth.user_count(), 2)
                self.assertEqual(auth.authenticate_user("DEMO", "Pass1234!")["id"], first["id"])
                connection = sqlite3.connect(db_path)
                try:
                    password_hash, password_salt = connection.execute(
                        "SELECT password_hash, password_salt FROM users WHERE username = ?", ("demo",)
                    ).fetchone()
                finally:
                    connection.close()
                self.assertNotEqual(password_hash, "pass1234")
                self.assertNotEqual(password_hash, password_salt)
                with self.assertRaisesRegex(ValueError, "用户名已注册"):
                    auth.register_user("DEMO", "Another1234!")

    def test_second_account_can_register_and_log_in_through_api(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            with patch.object(auth, "AUTH_DB_PATH", Path(temporary) / "auth.db"):
                client = TestClient(app)
                first = client.post("/api/auth/register", json={"username": "first", "password": "Safe1234!"})
                self.assertEqual(first.status_code, 200)
                self.assertEqual(client.post("/api/auth/logout").status_code, 200)
                second = client.post("/api/auth/register", json={"username": "second", "password": "Other1234!"})
                self.assertEqual(second.status_code, 200)
                self.assertEqual(client.post("/api/auth/logout").status_code, 200)
                login = client.post("/api/auth/login", json={"username": "first", "password": "Safe1234!"})
                self.assertEqual(login.status_code, 200)
                self.assertEqual(login.json()["user"]["username"], "first")
                status = client.get("/api/auth/status").json()
                self.assertEqual(status["account_count"], 2)
                self.assertTrue(status["registration_allowed"])

    def test_phone_code_registration_and_login(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            with patch.object(auth, "AUTH_DB_PATH", Path(temporary) / "auth.db"):
                auth.register_user("demo", "Pass1234!")
                code_response = auth.issue_sms_code("+86 138-0013-8000", "register")
                self.assertEqual(code_response["phone"], "13800138000")
                self.assertEqual(code_response["resend_in"], 60)
                phone_user = auth.verify_phone_and_get_user("13800138000", "register", code_response["dev_code"])
                self.assertTrue(phone_user)
                self.assertEqual(auth.user_count(), 2)
                self.assertTrue(auth.USERNAME_PATTERN.fullmatch(phone_user["username"]))
                with self.assertRaisesRegex(ValueError, "手机号已注册"):
                    auth.issue_sms_code("13800138000", "register")
                login_code = auth.issue_sms_code("13800138000", "login")
                user = auth.verify_phone_and_get_user("13800138000", "login", login_code["dev_code"])
                self.assertEqual(user["phone"], "13800138000")
                session_user = auth.get_user_by_session(auth.create_session(int(user["id"])))
                self.assertEqual(session_user["phone"], "13800138000")

    def test_retired_social_login_preserves_existing_password_account(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            db_path = Path(temporary) / "auth.db"
            with patch.object(auth, "AUTH_DB_PATH", db_path):
                user = auth.register_user("existing", "Pass1234!")
                token = auth.create_session(int(user["id"]))
                # Simulate an older database. Retired tables/columns are ignored,
                # not dropped or used to change existing accounts.
                with closing(sqlite3.connect(db_path)) as connection, connection:
                    connection.execute("ALTER TABLE users ADD COLUMN alternative_login_enabled INTEGER NOT NULL DEFAULT 1")
                    connection.execute("CREATE TABLE oauth_accounts (provider TEXT, subject TEXT, user_id INTEGER)")
                    connection.execute("INSERT INTO oauth_accounts VALUES ('wechat', 'old-subject', ?)", (user["id"],))
                self.assertEqual(auth.get_user_by_session(token)["id"], user["id"])
                with TestClient(app) as client:
                    login = client.post("/api/auth/login", json={"username": "existing", "password": "Pass1234!"})
                    self.assertEqual(login.status_code, 200)
                    self.assertNotIn("wechat_bound", login.json()["user"])
                    updated = client.patch("/api/auth/profile", json={"nickname": "保留资料", "avatar": ""})
                    self.assertEqual(updated.status_code, 200)
                    self.assertEqual(client.get("/api/auth/me").json()["user"]["nickname"], "保留资料")
                    for method, endpoint in (("GET", "config"), ("GET", "start"), ("GET", "callback"), ("GET", "binding"), ("POST", "unbind")):
                        self.assertEqual(client.request(method, f"/api/auth/wechat/{endpoint}").status_code, 404)
                with closing(sqlite3.connect(db_path)) as connection, connection:
                    self.assertEqual(connection.execute("SELECT COUNT(*) FROM oauth_accounts").fetchone()[0], 1)
                    self.assertEqual(connection.execute("SELECT COUNT(*) FROM users").fetchone()[0], 1)

    def test_phone_validation_rejects_invalid_number_and_code(self) -> None:
        with self.assertRaises(ValueError):
            auth.normalize_phone("123")
        with self.assertRaises(ValueError):
            auth.validate_sms_code("12345")


if __name__ == "__main__":
    unittest.main()
