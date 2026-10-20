"""Validated, account-scoped appearance settings for the desktop client."""

from __future__ import annotations

import base64
import binascii
import json
import re
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from .user_storage import theme_settings_path


BUILTIN_THEME_IDS = {"mint", "ocean", "violet", "apricot"}
THEME_IDS = BUILTIN_THEME_IDS | {"custom"}
DEFAULT_THEME: dict[str, Any] = {
    "theme_id": "mint",
    "custom_background": "",
    "custom_background_name": "",
    "overlay": 0.62,
    "updated_at": "",
}
MAX_THEME_IMAGE_BYTES = 5_000_000
MAX_THEME_FILENAME_LENGTH = 120
MAX_THEME_FAVORITES = 12
MAX_THEME_FAVORITE_NAME_LENGTH = 40
DATA_URL_PATTERN = re.compile(
    r"^data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$"
)


def _normalized_active_theme(payload: object) -> dict[str, Any]:
    if not isinstance(payload, dict):
        return dict(DEFAULT_THEME)
    theme_id = str(payload.get("theme_id") or DEFAULT_THEME["theme_id"])
    if theme_id not in THEME_IDS:
        theme_id = str(DEFAULT_THEME["theme_id"])
    try:
        overlay = float(payload.get("overlay", DEFAULT_THEME["overlay"]))
    except (TypeError, ValueError):
        overlay = float(DEFAULT_THEME["overlay"])
    overlay = min(1.0, max(0.0, overlay))
    return {
        "theme_id": theme_id,
        "custom_background": str(payload.get("custom_background") or ""),
        "custom_background_name": str(payload.get("custom_background_name") or "")[:MAX_THEME_FILENAME_LENGTH],
        "overlay": round(overlay, 2),
        "updated_at": str(payload.get("updated_at") or ""),
    }


def _normalized_stored_favorite(payload: object) -> dict[str, Any] | None:
    if not isinstance(payload, dict):
        return None
    favorite_id = str(payload.get("id") or "").strip()
    name = str(payload.get("name") or "").strip()
    theme = _normalized_active_theme(payload.get("theme"))
    if not favorite_id or not name or (theme["theme_id"] == "custom" and not theme["custom_background"]):
        return None
    if theme["theme_id"] != "custom":
        theme["custom_background"] = ""
        theme["custom_background_name"] = ""
    return {
        "id": favorite_id[:80],
        "name": name[:MAX_THEME_FAVORITE_NAME_LENGTH],
        "theme": theme,
        "created_at": str(payload.get("created_at") or ""),
    }


def _load_theme_document(user_id: int | str) -> dict[str, Any]:
    path = theme_settings_path(user_id)
    if not path.exists():
        return {**DEFAULT_THEME, "schema_version": 2, "favorites": []}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, TypeError, ValueError, json.JSONDecodeError):
        return {**DEFAULT_THEME, "schema_version": 2, "favorites": []}
    active = _normalized_active_theme(payload)
    raw_favorites = payload.get("favorites", []) if isinstance(payload, dict) else []
    favorites: list[dict[str, Any]] = []
    known_ids: set[str] = set()
    for item in raw_favorites if isinstance(raw_favorites, list) else []:
        favorite = _normalized_stored_favorite(item)
        if favorite is None or favorite["id"] in known_ids:
            continue
        known_ids.add(favorite["id"])
        favorites.append(favorite)
        if len(favorites) >= MAX_THEME_FAVORITES:
            break
    return {**active, "schema_version": 2, "favorites": favorites}


def load_theme_settings(user_id: int | str) -> dict[str, Any]:
    """Load the active theme without returning stored favorite image payloads."""

    document = _load_theme_document(user_id)
    return {key: document[key] for key in DEFAULT_THEME}


def _write_theme_document(user_id: int | str, document: dict[str, Any]) -> None:
    path = theme_settings_path(user_id, create_parent=True)
    temporary_path = path.with_suffix(path.suffix + f".{uuid4().hex}.tmp")
    temporary_path.write_text(json.dumps(document, ensure_ascii=False), encoding="utf-8")
    temporary_path.replace(path)


def _validate_theme_image(value: str) -> str:
    if not value:
        return ""
    match = DATA_URL_PATTERN.fullmatch(value)
    if match is None:
        raise ValueError("主题背景仅支持 PNG、JPG、WebP 图片。")
    try:
        content = base64.b64decode(match.group(2), validate=True)
    except (binascii.Error, ValueError, TypeError) as exc:
        raise ValueError("主题背景图片内容无效。") from exc
    if not content or len(content) > MAX_THEME_IMAGE_BYTES:
        raise ValueError("主题背景图片不能为空且不能超过 5 MB。")
    image_type = match.group(1)
    valid_signature = (
        (image_type == "png" and content.startswith(b"\x89PNG\r\n\x1a\n"))
        or (image_type == "jpeg" and content.startswith(b"\xff\xd8\xff"))
        or (
            image_type == "webp"
            and len(content) >= 12
            and content.startswith(b"RIFF")
            and content[8:12] == b"WEBP"
        )
    )
    if not valid_signature:
        raise ValueError("主题背景图片格式与文件内容不一致。")
    return value


def save_theme_settings(
    user_id: int | str,
    *,
    theme_id: str,
    custom_background: str,
    custom_background_name: str,
    overlay: float,
) -> dict[str, Any]:
    normalized_id = str(theme_id or "").strip()
    if normalized_id not in THEME_IDS:
        raise ValueError("请选择有效的内置主题或自定义主题。")
    background = _validate_theme_image(str(custom_background or "").strip())
    if normalized_id == "custom" and not background:
        raise ValueError("使用自定义主题前请先选择一张背景图片。")
    filename = str(custom_background_name or "").strip()
    if len(filename) > MAX_THEME_FILENAME_LENGTH:
        raise ValueError(f"背景图片名称不能超过 {MAX_THEME_FILENAME_LENGTH} 个字符。")
    try:
        normalized_overlay = float(overlay)
    except (TypeError, ValueError) as exc:
        raise ValueError("背景遮罩强度无效。") from exc
    if not 0.0 <= normalized_overlay <= 1.0:
        raise ValueError("界面不透明度需在 0%-100% 之间。")

    active = {
        "theme_id": normalized_id,
        "custom_background": background,
        "custom_background_name": filename if background else "",
        "overlay": round(normalized_overlay, 2),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    document = _load_theme_document(user_id)
    document.update(active)
    document["schema_version"] = 2
    _write_theme_document(user_id, document)
    return active


def _favorite_metadata(favorite: dict[str, Any]) -> dict[str, Any]:
    theme = favorite["theme"]
    return {
        "id": favorite["id"],
        "name": favorite["name"],
        "theme_id": theme["theme_id"],
        "custom_background_name": theme["custom_background_name"],
        "overlay": theme["overlay"],
        "created_at": favorite["created_at"],
    }


def list_theme_favorites(user_id: int | str) -> list[dict[str, Any]]:
    return [_favorite_metadata(item) for item in _load_theme_document(user_id)["favorites"]]


def load_theme_favorite_preview(user_id: int | str, favorite_id: str) -> tuple[str, bytes]:
    """Return one account-owned custom favorite image without exposing it in list JSON."""

    document = _load_theme_document(user_id)
    favorite = next((item for item in document["favorites"] if item["id"] == favorite_id), None)
    if favorite is None:
        raise LookupError("未找到该主题收藏。")
    image = str(favorite["theme"].get("custom_background") or "")
    if favorite["theme"].get("theme_id") != "custom" or not image:
        raise LookupError("该主题收藏没有图片预览。")
    _validate_theme_image(image)
    match = DATA_URL_PATTERN.fullmatch(image)
    if match is None:  # Kept as a defensive guard after validation.
        raise ValueError("主题背景图片内容无效。")
    try:
        content = base64.b64decode(match.group(2), validate=True)
    except (binascii.Error, ValueError, TypeError) as exc:
        raise ValueError("主题背景图片内容无效。") from exc
    return f"image/{match.group(1)}", content


def create_theme_favorite(
    user_id: int | str,
    *,
    name: str,
    theme_id: str,
    custom_background: str,
    custom_background_name: str,
    overlay: float,
) -> dict[str, Any]:
    normalized_name = str(name or "").strip()
    if not normalized_name:
        raise ValueError("请输入主题收藏名称。")
    if len(normalized_name) > MAX_THEME_FAVORITE_NAME_LENGTH:
        raise ValueError(f"主题收藏名称不能超过 {MAX_THEME_FAVORITE_NAME_LENGTH} 个字符。")
    document = _load_theme_document(user_id)
    favorites = document["favorites"]
    if len(favorites) >= MAX_THEME_FAVORITES:
        raise ValueError(f"每个账户最多收藏 {MAX_THEME_FAVORITES} 个主题。")
    if any(item["name"].casefold() == normalized_name.casefold() for item in favorites):
        raise ValueError("已有同名主题收藏。")

    # Reuse the active-theme validator, then restore the unchanged active theme.
    active_before = load_theme_settings(user_id)
    validated = save_theme_settings(
        user_id,
        theme_id=theme_id,
        custom_background=custom_background,
        custom_background_name=custom_background_name,
        overlay=overlay,
    )
    document = _load_theme_document(user_id)
    document.update(active_before)
    snapshot = dict(validated)
    if snapshot["theme_id"] != "custom":
        snapshot["custom_background"] = ""
        snapshot["custom_background_name"] = ""
    favorite = {
        "id": uuid4().hex,
        "name": normalized_name,
        "theme": snapshot,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    document["favorites"].append(favorite)
    document["schema_version"] = 2
    _write_theme_document(user_id, document)
    return _favorite_metadata(favorite)


def activate_theme_favorite(user_id: int | str, favorite_id: str) -> dict[str, Any]:
    document = _load_theme_document(user_id)
    favorite = next((item for item in document["favorites"] if item["id"] == favorite_id), None)
    if favorite is None:
        raise LookupError("未找到该主题收藏。")
    snapshot = dict(favorite["theme"])
    if snapshot["theme_id"] == "custom":
        _validate_theme_image(snapshot["custom_background"])
    else:
        snapshot["custom_background"] = ""
        snapshot["custom_background_name"] = ""
    snapshot["updated_at"] = datetime.now(timezone.utc).isoformat()
    document.update(snapshot)
    document["schema_version"] = 2
    _write_theme_document(user_id, document)
    return {key: document[key] for key in DEFAULT_THEME}


def delete_theme_favorite(user_id: int | str, favorite_id: str) -> None:
    document = _load_theme_document(user_id)
    remaining = [item for item in document["favorites"] if item["id"] != favorite_id]
    if len(remaining) == len(document["favorites"]):
        raise LookupError("未找到该主题收藏。")
    document["favorites"] = remaining
    document["schema_version"] = 2
    _write_theme_document(user_id, document)
