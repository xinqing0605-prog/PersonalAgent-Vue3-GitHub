import unittest
from unittest.mock import patch

from backend.app.retrieval import hybrid_rank_chunks, rank_chunks, tokenize


class RetrievalTests(unittest.TestCase):
    def test_tokenize_supports_chinese_and_latin_terms(self) -> None:
        terms = tokenize("退货 policy")
        self.assertIn("退货", terms)
        self.assertIn("policy", terms)

    def test_rank_chunks_prefers_relevant_and_shorter_context(self) -> None:
        chunks = [
            {"title": "退货政策", "content": "商品签收后七天内可以申请退货。"},
            {"title": "配送说明", "content": "配送通常需要三到五个工作日。"},
            {"title": "杂项", "content": "退货相关说明。" * 15},
        ]
        results = rank_chunks("七天内如何申请退货", chunks, limit=2)
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "退货政策")
        if len(results) > 1:
            self.assertGreater(results[0]["score"], results[1]["score"])

    def test_hybrid_path_uses_semantic_scores_when_provider_is_configured(self) -> None:
        chunks = [
            {"title": "配送说明", "content": "物流通常需要三到五个工作日。"},
            {"title": "退货政策", "content": "商品签收后七天内可以申请退货。"},
        ]

        def fake_embed_texts(texts, connection, *, cache_path=None):
            return [[0.0, 1.0] if "退货" in text else [1.0, 0.0] for text in texts]

        with patch("backend.app.retrieval.embed_texts", side_effect=fake_embed_texts):
            results = hybrid_rank_chunks(
                "我想退货",
                chunks,
                limit=1,
                embedding_connection={"api_key": "test", "model": "test", "base_url": ""},
            )
        self.assertEqual(results[0]["title"], "退货政策")
        self.assertEqual(results[0]["retrieval"], "hybrid")


if __name__ == "__main__":
    unittest.main()
