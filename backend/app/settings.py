from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os
from typing import Mapping

from dotenv import dotenv_values


class SettingsError(RuntimeError):
    """Raised when a runtime profile is unsafe or incomplete."""


ENVIRONMENT_ALIASES = {
    "dev": "local",
    "development": "local",
    "local": "local",
    "test": "test",
    "testing": "test",
    "stage": "test",
    "staging": "test",
    "prod": "production",
    "production": "production",
}


def _normalize_environment(value: str | None) -> str:
    normalized = str(value or "local").strip().lower()
    return ENVIRONMENT_ALIASES.get(normalized, normalized)


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None or not str(value).strip():
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _as_int(value: str | None, default: int) -> int:
    try:
        return int(str(value).strip()) if value is not None else default
    except (TypeError, ValueError):
        return default


def _as_list(value: str | None, default: tuple[str, ...] = ()) -> tuple[str, ...]:
    if value is None:
        return default
    return tuple(item.strip() for item in str(value).split(",") if item.strip())


def _resolve_path(value: str | None, root_dir: Path, default: Path) -> Path:
    candidate = Path(value).expanduser() if value and str(value).strip() else default
    if not candidate.is_absolute():
        candidate = root_dir / candidate
    return candidate.resolve()


def load_environment_files(root_dir: Path) -> str:
    """Load base and profile files without ever overriding process environment.

    Precedence is: process environment > .env.<profile> > .env.  Secrets supplied
    by a deployment platform therefore cannot be shadowed by repository files.
    """

    original_keys = set(os.environ)
    base_values = dotenv_values(root_dir / ".env")
    for key, value in base_values.items():
        if key and value is not None and key not in os.environ:
            os.environ[key] = value

    environment = _normalize_environment(os.getenv("APP_ENV"))
    profile_values = dotenv_values(root_dir / f".env.{environment}")
    for key, value in profile_values.items():
        if key and value is not None and key not in original_keys:
            os.environ[key] = value
    os.environ["APP_ENV"] = environment
    return environment


@dataclass(frozen=True)
class Settings:
    environment: str
    root_dir: Path
    runtime_dir: Path
    auth_db_path: Path
    users_root: Path
    legacy_user_id: int
    host: str
    port: int
    debug: bool
    allow_key_reveal: bool
    allow_shared_model_credentials: bool
    allowed_hosts: tuple[str, ...]
    allowed_origins: tuple[str, ...]
    session_cookie_name: str
    session_ttl_days: int
    cookie_secure: bool
    cookie_samesite: str
    cookie_domain: str | None
    sms_provider: str
    sms_dev_mode: bool
    sms_code_secret: str
    storage_backend: str

    @property
    def is_local(self) -> bool:
        return self.environment == "local"

    @property
    def is_test(self) -> bool:
        return self.environment == "test"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    def errors(self) -> list[str]:
        errors: list[str] = []
        if self.environment not in {"local", "test", "production"}:
            errors.append("APP_ENV 仅支持 local、test 或 production。")
        if self.cookie_samesite not in {"lax", "strict", "none"}:
            errors.append("SESSION_COOKIE_SAMESITE 仅支持 lax、strict 或 none。")
        if self.cookie_samesite == "none" and not self.cookie_secure:
            errors.append("SameSite=None 必须同时开启 SESSION_COOKIE_SECURE。")
        if self.session_ttl_days < 1 or self.session_ttl_days > 90:
            errors.append("SESSION_TTL_DAYS 必须在 1 到 90 天之间。")

        if self.is_production:
            if self.debug:
                errors.append("生产环境禁止开启 APP_DEBUG。")
            if self.allow_key_reveal:
                errors.append("生产环境禁止开启 ALLOW_KEY_REVEAL。")
            if not self.cookie_secure:
                errors.append("生产环境必须开启 SESSION_COOKIE_SECURE。")
            if self.sms_dev_mode:
                errors.append("生产环境禁止开启 SMS_DEV_MODE。")
            if self.sms_provider == "console":
                errors.append("生产环境不能使用 console 验证码；未接入短信服务前请设为 disabled。")
            if self.sms_provider != "disabled" and len(self.sms_code_secret) < 32:
                errors.append("生产短信验证码密钥 SMS_CODE_SECRET 至少需要 32 个字符。")
            if not self.allowed_hosts or "*" in self.allowed_hosts:
                errors.append("生产环境必须显式配置 ALLOWED_HOSTS，且不能使用通配符。")
        return errors

    def warnings(self) -> list[str]:
        warnings: list[str] = []
        if self.is_production and self.storage_backend == "local":
            warnings.append(
                "当前仍使用 SQLite/本地文件存储，只适合单实例和持久磁盘；多实例生产环境需迁移 PostgreSQL、Redis 与对象存储。"
            )
        if self.sms_provider == "disabled":
            warnings.append("手机验证码功能已禁用。")
        elif self.sms_provider not in {"console", "disabled"}:
            warnings.append(f"短信服务商 {self.sms_provider} 尚未实现适配器，发送接口会拒绝请求。")
        return warnings

    def safe_summary(self) -> dict[str, object]:
        return {
            "environment": self.environment,
            "root_dir": str(self.root_dir),
            "runtime_dir": str(self.runtime_dir),
            "auth_db_path": str(self.auth_db_path),
            "users_root": str(self.users_root),
            "host": self.host,
            "port": self.port,
            "debug": self.debug,
            "allow_shared_model_credentials": self.allow_shared_model_credentials,
            "cookie_secure": self.cookie_secure,
            "cookie_samesite": self.cookie_samesite,
            "sms_provider": self.sms_provider,
            "sms_dev_mode": self.sms_dev_mode,
            "storage_backend": self.storage_backend,
            "warnings": self.warnings(),
        }


def build_settings(
    environ: Mapping[str, str] | None = None,
    *,
    default_root_dir: Path | None = None,
) -> Settings:
    values: Mapping[str, str] = os.environ if environ is None else environ
    source_root = (default_root_dir or Path(__file__).resolve().parents[2]).resolve()
    root_dir = _resolve_path(values.get("AGENT_ROOT_DIR"), source_root, source_root)
    environment = _normalize_environment(values.get("APP_ENV"))
    default_runtime = root_dir / (".runtime/test" if environment == "test" else "data")
    runtime_dir = _resolve_path(values.get("AGENT_RUNTIME_DIR"), root_dir, default_runtime)
    auth_db_path = _resolve_path(
        values.get("AUTH_DB_PATH"), root_dir, runtime_dir / "auth.db"
    )
    users_root = _resolve_path(
        values.get("AGENT_USER_DATA_ROOT"), root_dir, runtime_dir / "users"
    )
    production = environment == "production"
    test = environment == "test"
    default_hosts = ("127.0.0.1", "localhost", "testserver") if not production else ()
    default_origins = (
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "http://127.0.0.1:8001",
        "http://localhost:8001",
    ) if not production else ()

    cookie_samesite = str(values.get("SESSION_COOKIE_SAMESITE", "lax")).strip().lower()
    cookie_domain = str(values.get("SESSION_COOKIE_DOMAIN", "")).strip() or None
    default_cookie_name = f"personal_agent_session_{environment}"
    return Settings(
        environment=environment,
        root_dir=root_dir,
        runtime_dir=runtime_dir,
        auth_db_path=auth_db_path,
        users_root=users_root,
        legacy_user_id=_as_int(values.get("AGENT_LEGACY_USER_ID"), 0 if test else 1),
        host=str(values.get("APP_HOST", "127.0.0.1" if not production else "0.0.0.0")),
        port=_as_int(values.get("APP_PORT"), 8001 if test else 8000),
        debug=_as_bool(values.get("APP_DEBUG"), default=not production),
        allow_key_reveal=_as_bool(values.get("ALLOW_KEY_REVEAL"), default=False),
        allow_shared_model_credentials=_as_bool(
            values.get("ALLOW_SHARED_MODEL_CREDENTIALS"), default=False
        ),
        allowed_hosts=_as_list(values.get("ALLOWED_HOSTS"), default_hosts),
        allowed_origins=_as_list(values.get("ALLOWED_ORIGINS"), default_origins),
        session_cookie_name=str(values.get("SESSION_COOKIE_NAME", default_cookie_name)).strip(),
        session_ttl_days=_as_int(values.get("SESSION_TTL_DAYS"), 30),
        cookie_secure=_as_bool(values.get("SESSION_COOKIE_SECURE"), default=production),
        cookie_samesite=cookie_samesite,
        cookie_domain=cookie_domain,
        sms_provider=str(values.get("SMS_PROVIDER", "console" if not production else "disabled")).strip().lower(),
        sms_dev_mode=_as_bool(values.get("SMS_DEV_MODE"), default=not production),
        sms_code_secret=str(values.get("SMS_CODE_SECRET", "local-agent-sms-secret")),
        storage_backend=str(values.get("STORAGE_BACKEND", "local")).strip().lower(),
    )


_SOURCE_ROOT_DIR = Path(os.getenv("AGENT_ROOT_DIR", Path(__file__).resolve().parents[2])).resolve()
load_environment_files(_SOURCE_ROOT_DIR)
SETTINGS = build_settings(default_root_dir=_SOURCE_ROOT_DIR)


def validate_runtime_environment(settings: Settings = SETTINGS) -> None:
    errors = settings.errors()
    # Local/test profiles expose diagnostics through check_environment.py but
    # remain startable for development. Production always fails fast.
    if errors and settings.is_production:
        formatted = "\n- ".join(errors)
        raise SettingsError(f"运行环境配置不安全或不完整：\n- {formatted}")
