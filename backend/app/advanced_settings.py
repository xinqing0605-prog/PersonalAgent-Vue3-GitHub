"""Account-scoped settings for models, gateways, MCP, documents and OCR."""

from __future__ import annotations

from copy import deepcopy
import json
from typing import Any

from .user_storage import agent_settings_path


DEFAULT_AGENT_SETTINGS: dict[str, Any] = {
    "defaults": {
        "chat_model_id": "",
        "fallback_model_id": "",
        "auto_fallback": False,
        "temperature": 0.4,
        "max_tokens": 1200,
    },
    "gateway": {
        "enabled": False,
        "base_url": "",
        "api_key": "",
        "timeout_seconds": 60,
        "max_retries": 1,
    },
    "mcp_servers": [],
    "document": {
        "document_processor": "内置文本解析",
        "top_k": 3,
        "smart_chunking": True,
        "separator": "\\n\\n",
        "chunk_size": 1024,
        "chunk_overlap": 200,
        "preserve_headings": True,
        "extract_tables": True,
        "ocr_fallback": True,
    },
    "ocr": {
        "engine": "auto",
        "languages": ["chi_sim", "eng"],
        "detect_orientation": True,
        "preserve_layout": True,
        "min_confidence": 0.6,
    },
}


def _merge_known(default: Any, saved: Any) -> Any:
    if isinstance(default, dict):
        source = saved if isinstance(saved, dict) else {}
        return {key: _merge_known(value, source.get(key)) for key, value in default.items()}
    if isinstance(default, list):
        return deepcopy(saved) if isinstance(saved, list) else deepcopy(default)
    return deepcopy(default if saved is None else saved)


def load_agent_settings(user_id: int | str) -> dict[str, Any]:
    """Load a complete settings object while ignoring unknown persisted fields."""

    try:
        saved = json.loads(agent_settings_path(user_id).read_text(encoding="utf-8"))
    except (FileNotFoundError, OSError, ValueError, TypeError):
        saved = {}
    return _merge_known(DEFAULT_AGENT_SETTINGS, saved)


def save_agent_settings(user_id: int | str, settings: dict[str, Any]) -> dict[str, Any]:
    normalized = _merge_known(DEFAULT_AGENT_SETTINGS, settings)
    path = agent_settings_path(user_id, create_parent=True)
    path.write_text(json.dumps(normalized, ensure_ascii=False, indent=2), encoding="utf-8")
    return normalized


def update_agent_settings_section(user_id: int | str, section: str, value: Any) -> dict[str, Any]:
    if section not in DEFAULT_AGENT_SETTINGS:
        raise ValueError("未知设置分区。")
    settings = load_agent_settings(user_id)
    settings[section] = _merge_known(DEFAULT_AGENT_SETTINGS[section], value)
    return save_agent_settings(user_id, settings)


def safe_agent_settings(settings: dict[str, Any]) -> dict[str, Any]:
    """Return browser-safe settings metadata without exposing gateway secrets."""

    result = deepcopy(settings)
    gateway = result.get("gateway", {})
    key = str(gateway.get("api_key", ""))
    gateway["configured"] = bool(key)
    gateway["api_key_hint"] = f"{key[:3]}…{key[-4:]}" if len(key) > 8 else ("已配置" if key else "")
    gateway["api_key"] = ""
    return result
