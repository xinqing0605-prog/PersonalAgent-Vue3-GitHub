"""Dependency-free lexical ranking for the local knowledge retrieval layer."""

from __future__ import annotations

from math import log
import logging
import re
from typing import Any

from .embeddings import EmbeddingError, cosine_similarity, embed_texts


logger = logging.getLogger(__name__)


def tokenize(text: str) -> set[str]:
    """Create lightweight tokens for both Chinese and space-delimited text."""
    tokens: set[str] = set(re.findall(r"[A-Za-z0-9]+", text.lower()))
    chinese_sequences = re.findall(r"[\u4e00-\u9fff]+", text)
    for sequence in chinese_sequences:
        tokens.update(sequence[index : index + 2] for index in range(len(sequence) - 1))
        if len(sequence) >= 3:
            tokens.update(sequence[index : index + 3] for index in range(len(sequence) - 2))
    return tokens


def rank_chunks(question: str, chunks: list[dict[str, Any]], limit: int = 3) -> list[dict[str, Any]]:
    """Rank candidate chunks with BM25-style lexical scoring.

    The implementation intentionally stays dependency-free for the local
    fallback.  Scores are scaled to integers so the existing API remains
    backwards-compatible while still accounting for term frequency, inverse
    document frequency and document length.
    """
    if limit <= 0 or not chunks:
        return []
    question_terms = tokenize(question)
    if not question_terms:
        return []

    tokenized_chunks = [tokenize(f"{item.get('title', '')} {item.get('content', '')}") for item in chunks]
    document_frequency: dict[str, int] = {}
    for terms in tokenized_chunks:
        for term in terms & question_terms:
            document_frequency[term] = document_frequency.get(term, 0) + 1
    total_chunks = len(chunks)
    lengths = [len(terms) for terms in tokenized_chunks]
    average_length = sum(lengths) / max(total_chunks, 1)
    k1 = 1.2
    b = 0.75
    scored: list[tuple[int, dict[str, Any]]] = []

    for item, terms, length in zip(chunks, tokenized_chunks, lengths):
        content = str(item.get("content", ""))
        title = str(item.get("title", ""))
        haystack = f"{title} {content}".lower()
        raw_score = 0.0
        for term in question_terms:
            term_frequency = len(re.findall(re.escape(term), haystack))
            if term_frequency <= 0:
                continue
            frequency = document_frequency.get(term, 0)
            inverse_document_frequency = log((total_chunks - frequency + 0.5) / (frequency + 0.5) + 1)
            normalization = 1 - b + b * (length / max(average_length, 1))
            raw_score += inverse_document_frequency * (term_frequency * (k1 + 1)) / (term_frequency + k1 * normalization)
        if not raw_score:
            continue
        score = round(raw_score * 100)
        if question.strip().lower() in haystack:
            score += 400
        if any(term in title.lower() for term in question_terms):
            score += 100
        result = dict(item)
        result["score"] = score
        scored.append((score, result))

    scored.sort(key=lambda item: item[0], reverse=True)
    if not scored:
        return []
    score_floor = max(1, round(scored[0][0] * 0.6))
    return [item for score, item in scored if score >= score_floor][:limit]


def hybrid_rank_chunks(
    question: str,
    chunks: list[dict[str, Any]],
    limit: int = 3,
    *,
    embedding_connection: dict[str, Any] | None = None,
    cache_path: Any | None = None,
) -> list[dict[str, Any]]:
    """Combine lexical ranking with optional semantic similarity.

    The lexical path remains the deterministic fallback.  Providers are only
    contacted when a knowledge base explicitly selects an embedding service.
    """
    lexical_results = rank_chunks(question, chunks, limit=max(limit, 10))
    if not embedding_connection or not chunks:
        return lexical_results[:limit]
    try:
        texts = [question] + [f"{item.get('title', '')}\n{item.get('content', '')}" for item in chunks]
        vectors = embed_texts(texts, embedding_connection, cache_path=cache_path)
    except EmbeddingError as exc:
        logger.warning("嵌入检索失败，已回退到 BM25：%s", exc)
        return lexical_results[:limit]

    lexical_scores = {
        _chunk_identity(item): int(item.get("score", 0) or 0)
        for item in lexical_results
    }
    max_lexical = max(lexical_scores.values(), default=1)
    query_vector = vectors[0]
    scored: list[tuple[int, dict[str, Any]]] = []
    for index, item in enumerate(chunks, start=1):
        semantic_score = max(0.0, cosine_similarity(query_vector, vectors[index]))
        lexical_score = lexical_scores.get(_chunk_identity(item), 0) / max_lexical
        if semantic_score <= 0 and lexical_score <= 0:
            continue
        combined = round((0.45 * lexical_score + 0.55 * semantic_score) * 1000)
        result = dict(item)
        result["score"] = combined
        result["retrieval"] = "hybrid"
        scored.append((combined, result))
    scored.sort(key=lambda item: item[0], reverse=True)
    if not scored:
        return lexical_results[:limit]
    score_floor = max(1, round(scored[0][0] * 0.6))
    return [item for score, item in scored if score >= score_floor][:limit]


def _chunk_identity(item: dict[str, Any]) -> tuple[str, str, str, str, str]:
    return (
        str(item.get("knowledge_base_id", "")),
        str(item.get("filename", "")),
        str(item.get("chunk_index", "")),
        str(item.get("title", "")),
        str(item.get("content", ""))[:80],
    )
