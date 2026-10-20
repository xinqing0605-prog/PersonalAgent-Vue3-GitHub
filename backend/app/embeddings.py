"""Optional OpenAI-compatible embeddings with a small local cache."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


class EmbeddingError(RuntimeError):
    """Raised when an embedding provider cannot produce a valid vector."""


def _cache_key(text: str, model: str, base_url: str) -> str:
    payload = f"{base_url.rstrip('/')}\n{model}\n{text}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _load_cache(cache_path: Path | None) -> dict[str, list[float]]:
    if cache_path is None or not cache_path.exists():
        return {}
    try:
        saved = json.loads(cache_path.read_text(encoding="utf-8"))
    except (OSError, ValueError, TypeError):
        return {}
    if not isinstance(saved, dict):
        return {}
    return {
        str(key): [float(value) for value in vector]
        for key, vector in saved.items()
        if isinstance(vector, list) and vector
    }


def _save_cache(cache_path: Path | None, cache: dict[str, list[float]]) -> None:
    if cache_path is None:
        return
    try:
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        temporary = cache_path.with_suffix(f"{cache_path.suffix}.tmp")
        temporary.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
        temporary.replace(cache_path)
    except OSError:
        # A read-only deployment should still be able to answer with the
        # provider result; caching is an optimization, not a hard dependency.
        return


def embed_texts(
    texts: list[str],
    connection: dict[str, Any],
    *,
    cache_path: Path | None = None,
) -> list[list[float]]:
    """Embed texts through an OpenAI-compatible provider, reusing local cache."""
    if not texts:
        return []
    api_key = str(connection.get("api_key", "")).strip()
    model = str(connection.get("model", "")).strip()
    base_url = str(connection.get("base_url", "")).strip()
    if not api_key or not model:
        raise EmbeddingError("嵌入服务缺少 API Key 或模型标识")

    cache = _load_cache(cache_path)
    keys = [_cache_key(text, model, base_url) for text in texts]
    missing: list[tuple[int, str]] = [
        (index, text) for index, (text, key) in enumerate(zip(texts, keys)) if key not in cache
    ]
    if missing:
        try:
            from openai import OpenAI

            client_kwargs: dict[str, str] = {"api_key": api_key}
            if base_url:
                client_kwargs["base_url"] = base_url
            response = OpenAI(**client_kwargs).embeddings.create(
                model=model,
                input=[text for _, text in missing],
            )
        except Exception as exc:  # provider-specific SDK errors vary by vendor
            raise EmbeddingError(f"嵌入服务调用失败：{exc}") from exc

        data = sorted(response.data, key=lambda item: int(getattr(item, "index", 0)))
        if len(data) != len(missing):
            raise EmbeddingError("嵌入服务返回数量与输入不一致")
        for (index, _), item in zip(missing, data):
            vector = getattr(item, "embedding", None)
            if not isinstance(vector, list) or not vector:
                raise EmbeddingError("嵌入服务返回了空向量")
            cache[keys[index]] = [float(value) for value in vector]
        _save_cache(cache_path, cache)

    try:
        vectors = [cache[key] for key in keys]
        dimensions = {len(vector) for vector in vectors}
    except (KeyError, TypeError, ValueError) as exc:
        raise EmbeddingError("嵌入缓存数据无效") from exc
    if len(dimensions) != 1:
        raise EmbeddingError("嵌入向量维度不一致")
    return vectors


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right) or not left:
        return 0.0
    left_norm = sum(value * value for value in left) ** 0.5
    right_norm = sum(value * value for value in right) ** 0.5
    if not left_norm or not right_norm:
        return 0.0
    return sum(a * b for a, b in zip(left, right)) / (left_norm * right_norm)
