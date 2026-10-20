"""Resolve every persistent data path inside the authenticated user's space.

User 1 keeps the original on-disk locations so upgrading an existing desktop
installation never hides or deletes its data. Every later account receives a
separate directory under ``data/users/<id>``.
"""

from __future__ import annotations

from pathlib import Path

from .settings import SETTINGS


ROOT_DIR = SETTINGS.root_dir
USERS_ROOT = SETTINGS.users_root
LEGACY_USER_ID = SETTINGS.legacy_user_id


def normalized_user_id(user_id: int | str) -> int:
    try:
        value = int(user_id)
    except (TypeError, ValueError) as exc:
        raise ValueError("账户标识无效。") from exc
    if value < 1:
        raise ValueError("账户标识无效。")
    return value


def is_legacy_user(user_id: int | str) -> bool:
    """Whether a user owns the pre-multi-account data directory."""
    return normalized_user_id(user_id) == LEGACY_USER_ID


def user_root(user_id: int | str, *, create: bool = False) -> Path:
    value = normalized_user_id(user_id)
    root = ROOT_DIR if is_legacy_user(value) else USERS_ROOT / str(value)
    if create:
        root.mkdir(parents=True, exist_ok=True)
    return root


def _legacy_or_user_path(user_id: int | str, legacy: Path, *parts: str, create_parent: bool = False) -> Path:
    value = normalized_user_id(user_id)
    path = legacy if is_legacy_user(value) else user_root(value) / Path(*parts)
    if create_parent:
        path.parent.mkdir(parents=True, exist_ok=True)
    return path


def tasks_db_path(user_id: int | str, *, create_parent: bool = False) -> Path:
    return _legacy_or_user_path(user_id, ROOT_DIR / "data" / "tasks.db", "tasks.db", create_parent=create_parent)


def notes_dir(user_id: int | str, *, create: bool = False) -> Path:
    path = _legacy_or_user_path(user_id, ROOT_DIR / "notes", "notes")
    if create:
        path.mkdir(parents=True, exist_ok=True)
    return path


def workspace_dir(user_id: int | str, *, create: bool = False) -> Path:
    path = _legacy_or_user_path(user_id, ROOT_DIR / "workspace", "workspace")
    if create:
        path.mkdir(parents=True, exist_ok=True)
    return path


def knowledge_dir(user_id: int | str, *, create: bool = False) -> Path:
    path = _legacy_or_user_path(user_id, ROOT_DIR / "knowledge", "knowledge")
    if create:
        path.mkdir(parents=True, exist_ok=True)
    return path


def conversations_dir(user_id: int | str, *, create: bool = False) -> Path:
    path = _legacy_or_user_path(user_id, ROOT_DIR / "data" / "conversations", "conversations")
    if create:
        path.mkdir(parents=True, exist_ok=True)
    return path


def knowledge_bases_dir(user_id: int | str, *, create: bool = False) -> Path:
    path = _legacy_or_user_path(user_id, ROOT_DIR / "data" / "knowledge_bases", "knowledge_bases")
    if create:
        path.mkdir(parents=True, exist_ok=True)
    return path


def model_services_path(user_id: int | str, *, create_parent: bool = False) -> Path:
    return _legacy_or_user_path(
        user_id,
        ROOT_DIR / "data" / "model_services.json",
        "model_services.json",
        create_parent=create_parent,
    )


def custom_model_services_path(user_id: int | str, *, create_parent: bool = False) -> Path:
    return _legacy_or_user_path(
        user_id,
        ROOT_DIR / "data" / "custom_model_services.json",
        "custom_model_services.json",
        create_parent=create_parent,
    )


def agent_settings_path(user_id: int | str, *, create_parent: bool = False) -> Path:
    """Return the account-owned advanced model and tool settings file."""

    return _legacy_or_user_path(
        user_id,
        ROOT_DIR / "data" / "agent_settings.json",
        "agent_settings.json",
        create_parent=create_parent,
    )


def theme_settings_path(user_id: int | str, *, create_parent: bool = False) -> Path:
    """Return the account-owned theme settings file."""

    return _legacy_or_user_path(
        user_id,
        ROOT_DIR / "data" / "theme.json",
        "theme.json",
        create_parent=create_parent,
    )
