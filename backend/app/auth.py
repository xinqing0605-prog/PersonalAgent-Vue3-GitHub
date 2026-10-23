"""Local multi-account authentication for the desktop application.

The desktop build intentionally keeps authentication local. Passwords are
stored as PBKDF2-HMAC hashes, while browser cookies contain only a random
session token whose hash is persisted in the local auth database.
"""

from __future__ import annotations

import base64
import binascii
from contextlib import contextmanager
import hashlib
import hmac
import re
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from phonenumbers import PhoneMetadata

from .settings import SETTINGS


ROOT_DIR = SETTINGS.root_dir
AUTH_DB_PATH = SETTINGS.auth_db_path
SESSION_COOKIE = SETTINGS.session_cookie_name
SESSION_TTL_DAYS = SETTINGS.session_ttl_days
PBKDF2_ITERATIONS = 310_000
USERNAME_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9_]{1,15}$")
PHONE_PATTERN = re.compile(r"^1[3-9][0-9]{9}$")
PHONE_MOBILE_PATTERN = PhoneMetadata.metadata_for_region("CN").mobile.national_number_pattern
SMS_CODE_PATTERN = re.compile(r"^[0-9]{6}$")
PASSWORD_SPECIAL_PATTERN = re.compile(r"[!@#$%^&*()_+\-=\[\]{};:'\",.<>/?\\|`~]")
SMS_CODE_TTL_SECONDS = 300
SMS_RESEND_INTERVAL_SECONDS = 60
SMS_MAX_ATTEMPTS = 5
SMS_MAX_PER_HOUR = 10
SMS_PROVIDER = SETTINGS.sms_provider
SMS_DEV_MODE = SETTINGS.sms_dev_mode
SMS_CODE_SECRET = SETTINGS.sms_code_secret
NICKNAME_MAX_LENGTH = 20
AVATAR_MAX_BYTES = 1_000_000


@contextmanager
def _connect():
    connection = sqlite3.connect(AUTH_DB_PATH)
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 5000")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_auth_db() -> None:
    AUTH_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                phone TEXT,
                phone_verified_at TEXT,
                nickname TEXT NOT NULL DEFAULT '',
                avatar TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        user_columns = {str(row[1]) for row in connection.execute("PRAGMA table_info(users)").fetchall()}
        if "phone" not in user_columns:
            connection.execute("ALTER TABLE users ADD COLUMN phone TEXT")
        if "phone_verified_at" not in user_columns:
            connection.execute("ALTER TABLE users ADD COLUMN phone_verified_at TEXT")
        if "nickname" not in user_columns:
            connection.execute("ALTER TABLE users ADD COLUMN nickname TEXT NOT NULL DEFAULT ''")
        if "avatar" not in user_columns:
            connection.execute("ALTER TABLE users ADD COLUMN avatar TEXT NOT NULL DEFAULT ''")
        connection.execute("CREATE INDEX IF NOT EXISTS idx_users_username_nocase ON users(username COLLATE NOCASE)")
        connection.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL")
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS verification_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone TEXT NOT NULL,
                purpose TEXT NOT NULL,
                code_hash TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                attempts INTEGER NOT NULL DEFAULT 0,
                consumed_at TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.execute("CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone, purpose, created_at)")
        connection.execute("CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii")


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value.encode("ascii"))


def hash_password(password: str, salt: bytes | None = None) -> tuple[str, str]:
    salt = salt or secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return _encode(derived), _encode(salt)


def verify_password(password: str, encoded_hash: str, encoded_salt: str) -> bool:
    try:
        derived, _ = hash_password(password, _decode(encoded_salt))
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(derived, encoded_hash)


def validate_credentials(username: str, password: str) -> str | None:
    if not USERNAME_PATTERN.fullmatch(username.strip()):
        return "用户名需为 2-16 位，以英文字母开头，仅可包含英文字母、数字和下划线。"
    if len(password) < 8 or len(password) > 20:
        return "密码长度需为 8-20 位。"
    if (
        not re.search(r"[A-Z]", password)
        or not re.search(r"[a-z]", password)
        or not re.search(r"\d", password)
        or not PASSWORD_SPECIAL_PATTERN.search(password)
    ):
        return "密码需同时包含大写字母、小写字母、数字和特殊符号。"
    if username.strip().casefold() in password.casefold():
        return "密码不能包含完整用户名。"
    if re.search(r"(.)\1\1", password):
        return "密码不能包含连续 3 个相同字符。"
    return None


def normalize_phone(phone: str) -> str:
    value = re.sub(r"[\s-]", "", phone.strip())
    if value.startswith("+86"):
        value = value[3:]
    if not PHONE_PATTERN.fullmatch(value) or not re.fullmatch(PHONE_MOBILE_PATTERN, value):
        raise ValueError("请输入正确的手机号")
    return value


def validate_sms_code(code: str) -> str:
    value = code.strip()
    if not SMS_CODE_PATTERN.fullmatch(value):
        raise ValueError("验证码必须是 6 位数字。")
    return value


def _public_user(row: sqlite3.Row | dict[str, Any]) -> dict[str, Any]:
    keys = set(row.keys())
    username = str(row["username"])
    return {
        "id": int(row["id"]),
        "username": username,
        "nickname": str(row["nickname"] or username) if "nickname" in keys else username,
        "avatar": str(row["avatar"] or "") if "avatar" in keys else "",
        "phone": str(row["phone"] or "") if "phone" in keys else "",
        "created_at": str(row["created_at"]),
    }


def _validate_nickname(nickname: str) -> str:
    value = nickname.strip()
    if not 1 <= len(value) <= NICKNAME_MAX_LENGTH:
        raise ValueError(f"昵称长度需为 1-{NICKNAME_MAX_LENGTH} 位。")
    if any(ord(character) < 32 for character in value):
        raise ValueError("昵称不能包含控制字符。")
    return value


def _validate_avatar(avatar: str) -> str:
    value = avatar.strip()
    if not value:
        return ""
    if value.startswith("https://"):
        if len(value) > 1_000:
            raise ValueError("头像地址过长。")
        return value
    match = re.fullmatch(r"data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)", value)
    if match is None:
        raise ValueError("头像仅支持 PNG、JPG、WebP 图片。")
    try:
        content = base64.b64decode(match.group(2), validate=True)
    except (binascii.Error, ValueError, TypeError) as exc:
        raise ValueError("头像图片内容无效。") from exc
    if not content or len(content) > AVATAR_MAX_BYTES:
        raise ValueError("头像不能为空且不能超过 1 MB。")
    return value


def get_user_by_id(user_id: int) -> dict[str, Any] | None:
    init_auth_db()
    with _connect() as connection:
        connection.row_factory = sqlite3.Row
        row = connection.execute(
            """
            SELECT users.*
            FROM users WHERE users.id = ?
            """,
            (int(user_id),),
        ).fetchone()
    return _public_user(row) if row else None


def update_user_profile(user_id: int, nickname: str, avatar: str) -> dict[str, Any]:
    clean_nickname = _validate_nickname(nickname)
    clean_avatar = _validate_avatar(avatar)
    init_auth_db()
    with _connect() as connection:
        cursor = connection.execute(
            "UPDATE users SET nickname = ?, avatar = ? WHERE id = ?",
            (clean_nickname, clean_avatar, int(user_id)),
        )
        if cursor.rowcount == 0:
            raise ValueError("账户不存在。")
    user = get_user_by_id(user_id)
    if user is None:
        raise ValueError("账户不存在。")
    return user


def user_count() -> int:
    init_auth_db()
    with _connect() as connection:
        return int(connection.execute("SELECT COUNT(*) FROM users").fetchone()[0])


def _unique_generated_username(connection: sqlite3.Connection, base_name: str) -> str:
    """Return a generated username that respects the public 16-character limit."""
    base_name = base_name[:16]
    candidate = base_name
    suffix = 1
    while connection.execute(
        "SELECT 1 FROM users WHERE username = ? COLLATE NOCASE LIMIT 1",
        (candidate,),
    ).fetchone():
        suffix += 1
        marker = f"_{suffix}"
        candidate = f"{base_name[: 16 - len(marker)]}{marker}"
    return candidate


def register_user(username: str, password: str) -> dict[str, Any]:
    username = username.strip()
    error = validate_credentials(username, password)
    if error:
        raise ValueError(error)
    init_auth_db()
    password_hash, password_salt = hash_password(password)
    created_at = _now().isoformat()
    try:
        with _connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            if connection.execute(
                "SELECT 1 FROM users WHERE username = ? COLLATE NOCASE LIMIT 1",
                (username,),
            ).fetchone():
                raise ValueError("该用户名已注册，请直接登录。")
            cursor = connection.execute(
                "INSERT INTO users (username, password_hash, password_salt, nickname, created_at) VALUES (?, ?, ?, ?, ?)",
                (username, password_hash, password_salt, username, created_at),
            )
            user_id = int(cursor.lastrowid)
    except sqlite3.IntegrityError as exc:
        raise ValueError("该用户名已注册，请直接登录。") from exc
    user = get_user_by_id(user_id)
    if user is None:
        raise ValueError("注册失败，请稍后重试。")
    return user


def authenticate_user(username: str, password: str) -> dict[str, Any] | None:
    init_auth_db()
    with _connect() as connection:
        connection.row_factory = sqlite3.Row
        row = connection.execute(
            "SELECT * FROM users WHERE username = ? COLLATE NOCASE",
            (username.strip(),),
        ).fetchone()
    if row is None or not verify_password(password, row["password_hash"], row["password_salt"]):
        return None
    return _public_user(row)


def find_user_by_phone(phone: str) -> dict[str, Any] | None:
    normalized = normalize_phone(phone)
    init_auth_db()
    with _connect() as connection:
        connection.row_factory = sqlite3.Row
        row = connection.execute("SELECT * FROM users WHERE phone = ?", (normalized,)).fetchone()
    return _public_user(row) if row else None


def _insert_phone_user(phone: str) -> dict[str, Any]:
    normalized = normalize_phone(phone)
    password_hash, password_salt = hash_password(secrets.token_urlsafe(32))
    created_at = _now().isoformat()
    with _connect() as connection:
        username = _unique_generated_username(connection, f"phone_user_{normalized[-4:]}")
        cursor = connection.execute(
            "INSERT INTO users (username, password_hash, password_salt, phone, phone_verified_at, nickname, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (username, password_hash, password_salt, normalized, created_at, username, created_at),
        )
        user_id = int(cursor.lastrowid)
    user = get_user_by_id(user_id)
    if user is None:
        raise ValueError("手机号账户创建失败，请稍后重试。")
    return user


def _code_digest(phone: str, purpose: str, code: str) -> str:
    payload = f"{phone}:{purpose}:{code}".encode("utf-8")
    return hmac.new(SMS_CODE_SECRET.encode("utf-8"), payload, hashlib.sha256).hexdigest()


def issue_sms_code(phone: str, purpose: str) -> dict[str, Any]:
    normalized = normalize_phone(phone)
    if purpose not in {"register", "login"}:
        raise ValueError("验证码用途无效。")
    if SMS_PROVIDER == "disabled":
        raise ValueError("当前环境已禁用手机验证码，请使用账号密码登录。")
    if SMS_PROVIDER != "console":
        raise ValueError("当前短信服务商适配器尚未实现，请先完成服务商接入和测试。")
    init_auth_db()
    if purpose == "register" and find_user_by_phone(normalized):
        raise ValueError("该手机号已注册，请使用验证码登录。")
    now = _now()
    with _connect() as connection:
        latest = connection.execute(
            "SELECT created_at FROM verification_codes WHERE phone = ? AND purpose = ? ORDER BY id DESC LIMIT 1",
            (normalized, purpose),
        ).fetchone()
        if latest:
            latest_at = datetime.fromisoformat(str(latest[0]))
            if (now - latest_at).total_seconds() < SMS_RESEND_INTERVAL_SECONDS:
                remaining = SMS_RESEND_INTERVAL_SECONDS - int((now - latest_at).total_seconds())
                raise ValueError(f"验证码发送过于频繁，请 {max(1, remaining)} 秒后再试。")
        sent_count = connection.execute(
            "SELECT COUNT(*) FROM verification_codes WHERE phone = ? AND created_at > ?",
            (normalized, (now - timedelta(hours=1)).isoformat()),
        ).fetchone()[0]
        if int(sent_count) >= SMS_MAX_PER_HOUR:
            raise ValueError("该手机号一小时内验证码请求次数过多，请稍后再试。")
        code = f"{secrets.randbelow(1_000_000):06d}"
        connection.execute(
            "INSERT INTO verification_codes (phone, purpose, code_hash, expires_at, attempts, created_at) VALUES (?, ?, ?, ?, 0, ?)",
            (normalized, purpose, _code_digest(normalized, purpose, code), (now + timedelta(seconds=SMS_CODE_TTL_SECONDS)).isoformat(), now.isoformat()),
        )
    result: dict[str, Any] = {
        "phone": normalized,
        "expires_in": SMS_CODE_TTL_SECONDS,
        "resend_in": SMS_RESEND_INTERVAL_SECONDS,
        "provider": SMS_PROVIDER,
    }
    if SMS_DEV_MODE and not SETTINGS.is_production:
        result["dev_code"] = code
    return result


def consume_sms_code(phone: str, purpose: str, code: str) -> bool:
    normalized = normalize_phone(phone)
    value = validate_sms_code(code)
    init_auth_db()
    now = _now()
    with _connect() as connection:
        connection.row_factory = sqlite3.Row
        row = connection.execute(
            "SELECT * FROM verification_codes WHERE phone = ? AND purpose = ? ORDER BY id DESC LIMIT 1",
            (normalized, purpose),
        ).fetchone()
        if row is None or row["consumed_at"] or datetime.fromisoformat(str(row["expires_at"])) <= now:
            return False
        if int(row["attempts"]) >= SMS_MAX_ATTEMPTS:
            return False
        if not hmac.compare_digest(str(row["code_hash"]), _code_digest(normalized, purpose, value)):
            connection.execute("UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ?", (row["id"],))
            return False
        connection.execute("UPDATE verification_codes SET consumed_at = ? WHERE id = ?", (now.isoformat(), row["id"]))
    return True


def verify_phone_and_get_user(phone: str, purpose: str, code: str) -> dict[str, Any]:
    normalized = normalize_phone(phone)
    if not consume_sms_code(normalized, purpose, code):
        raise ValueError("验证码错误、已过期或尝试次数已用完。")
    user = find_user_by_phone(normalized)
    if user:
        if purpose == "register":
            raise ValueError("该手机号已注册，请使用验证码登录。")
        return user
    return _insert_phone_user(normalized)


def create_session(user_id: int) -> str:
    init_auth_db()
    token = secrets.token_urlsafe(32)
    now = _now()
    with _connect() as connection:
        connection.execute("DELETE FROM sessions WHERE expires_at <= ?", (now.isoformat(),))
        connection.execute(
            "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
            (
                hashlib.sha256(token.encode("utf-8")).hexdigest(),
                user_id,
                (now + timedelta(days=SESSION_TTL_DAYS)).isoformat(),
                now.isoformat(),
            ),
        )
    return token


def get_user_by_session(token: str | None) -> dict[str, Any] | None:
    if not token:
        return None
    init_auth_db()
    now = _now().isoformat()
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    with _connect() as connection:
        connection.row_factory = sqlite3.Row
        row = connection.execute(
            """
            SELECT users.id, users.username, users.phone, users.nickname, users.avatar, users.created_at
            FROM sessions JOIN users ON users.id = sessions.user_id
            WHERE sessions.token_hash = ? AND sessions.expires_at > ?
            """,
            (token_hash, now),
        ).fetchone()
    return _public_user(row) if row else None


def revoke_session(token: str | None) -> None:
    if not token:
        return
    init_auth_db()
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    with _connect() as connection:
        connection.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash,))


init_auth_db()
