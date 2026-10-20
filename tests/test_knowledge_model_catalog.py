"""Configured knowledge models: lifecycle, account isolation and exact routing."""
import tempfile
import unittest
from contextlib import ExitStack
from dataclasses import replace
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient
import backend.app.auth as auth
import backend.app.main as main
import backend.app.user_storage as storage
from backend.app.embeddings import embed_texts


class KnowledgeModelCatalogTests(unittest.TestCase):
    def setUp(self):
        self.stack = ExitStack()
        self.addCleanup(self.stack.close)
        root = Path(self.stack.enter_context(tempfile.TemporaryDirectory()))
        for target, name, value in [
            (auth, "AUTH_DB_PATH", root / "auth.db"),
            (storage, "ROOT_DIR", root),
            (storage, "USERS_ROOT", root / "users"),
            (storage, "LEGACY_USER_ID", 999),
            (main, "SETTINGS", replace(main.SETTINGS, allow_shared_model_credentials=False)),
        ]:
            self.stack.enter_context(patch.object(target, name, value))
        self.client = TestClient(main.app)
        response = self.client.post("/api/auth/register", json={"username": "catalogtest", "password": "Safe1234!"})
        self.assertEqual(response.status_code, 200, response.text)
        self.user_id = int(response.json()["user"]["id"])

    def create_service(self, kind="嵌入模型", model="embed-one", **overrides):
        payload = dict(name="测试服务", service_type=kind, model=model,
                       base_url="https://models.example.test/v1", api_key="qa-catalog-only")
        payload.update(overrides)
        response = self.client.post("/api/model-services", json=payload)
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["service"]["id"]

    def catalog(self, client=None):
        response = (client or self.client).get("/api/model-catalog")
        self.assertEqual(response.status_code, 200)
        return response.json()["models"]

    def create_base(self, **settings):
        response = self.client.post("/api/knowledge-bases", json={"name": "测试资料", "settings": settings})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def test_no_presets_and_account_isolation(self):
        self.assertTrue(all(len(options) == 1 for options in self.catalog().values()))
        service_id = self.create_service()
        second = TestClient(main.app)
        second.post("/api/auth/register", json={"username": "catalogother", "password": "Safe1234!"})
        self.assertTrue(all(len(options) == 1 for options in self.catalog(second).values()))
        refused = second.post("/api/knowledge-bases", json={"name": "跨账户", "settings": {"embedding_model": f"service:{service_id}"}})
        self.assertEqual(refused.status_code, 400)
        self.assertNotIn("qa-catalog-only", self.client.get("/api/model-catalog").text)

    def test_edited_builtin_qwen_appears_with_actual_model_and_survives_rename(self):
        response = self.client.put("/api/model-services/qwen", json={
            "name": "Qwen", "service_type": "嵌入模型", "model": "qwen3-vl-embedding",
            "base_url": "https://maas.example.test/compatible-mode/v1", "api_key": "qa-qwen-only"})
        self.assertEqual(response.status_code, 200, response.text)
        choices = self.catalog()["embedding"]
        self.assertEqual(choices[1]["name"], "Qwen · qwen3-vl-embedding")
        self.assertEqual(len(choices), 2)
        base = self.create_base(embedding_model="service:qwen")
        self.client.put("/api/model-services/qwen", json={"name": "千问改名", "model": "embed-revision-2"})
        restored = self.client.get("/api/knowledge-bases").json()[0]
        self.assertEqual(restored["settings"]["embedding_model"], "service:qwen")
        connection = main.embedding_connection_for_settings(main.KnowledgeBaseSettings(**base["settings"]), self.user_id)
        self.assertEqual(connection["model"], "embed-revision-2")
        self.assertEqual(self.catalog()["embedding"][1]["name"], "千问改名 · embed-revision-2")

    def test_same_endpoint_profiles_route_to_exact_model_and_credentials(self):
        first = self.create_service(model="embed-one", api_key="qa-first-only")
        second = self.create_service(model="embed-two", api_key="qa-second-only")
        for service_id, model, key in [(first, "embed-one", "qa-first-only"), (second, "embed-two", "qa-second-only")]:
            base = self.create_base(embedding_model=f"service:{service_id}")
            connection = main.embedding_connection_for_settings(main.KnowledgeBaseSettings(**base["settings"]), self.user_id)
            with patch("openai.OpenAI") as sdk:
                sdk.return_value.embeddings.create.return_value = SimpleNamespace(data=[SimpleNamespace(index=0, embedding=[1.0, 0.5])])
                self.assertEqual(embed_texts(["知识库资料"], connection), [[1.0, 0.5]])
                sdk.assert_called_once_with(api_key=key, base_url="https://models.example.test/v1")
                sdk.return_value.embeddings.create.assert_called_once_with(model=model, input=["知识库资料"])

    def test_three_types_deleted_choices_disappear_and_documents_survive(self):
        cases = [("文档解析", "document_processor", "document_processor", "内置文本解析", ""),
                 ("嵌入模型", "embedding", "embedding_model", "本地关键词检索", "embed-one"),
                 ("重排模型", "reranker", "reranker", "不使用", "rerank-one")]
        for kind, catalog_key, field, fallback, model in cases:
            with self.subTest(kind=kind):
                service_id = self.create_service(kind, model)
                reference = f"service:{service_id}"
                self.assertEqual(self.catalog()[catalog_key][1]["id"], reference)
                base = self.create_base(**{field: reference, "top_k": 9})
                directory = main.knowledge_base_directory(base["id"], user_id=self.user_id) / "documents"
                directory.mkdir(exist_ok=True)
                document = directory / "资料.md"
                document.write_text("需要保留的原始资料", encoding="utf-8")
                self.assertEqual(self.client.delete(f"/api/model-services/{service_id}").status_code, 200)
                self.assertEqual(len(self.catalog()[catalog_key]), 1)
                bases = self.client.get("/api/knowledge-bases").json()
                loaded = next(item for item in bases if item["id"] == base["id"])
                self.assertEqual(loaded["settings"][field], fallback)
                self.assertEqual(loaded["settings"]["top_k"], 9)
                self.assertEqual(loaded["document_count"], 1)
                self.assertEqual(document.read_text(encoding="utf-8"), "需要保留的原始资料")
                self.assertEqual(getattr(main.load_knowledge_base(base["id"], user_id=self.user_id).settings, field), fallback)
                rejected = self.client.patch(f"/api/knowledge-bases/{base['id']}", json={"settings": {field: reference}})
                self.assertEqual(rejected.status_code, 400)
                self.assertEqual(self.client.patch(f"/api/knowledge-bases/{base['id']}", json={"settings": loaded["settings"]}).status_code, 200)

    def test_clear_key_disable_and_change_type_update_options(self):
        service_id = self.create_service()
        base = self.create_base(embedding_model=f"service:{service_id}")
        for update in [{"clear_api_key": True}, {"enabled": False}]:
            with self.subTest(update=update):
                self.assertEqual(self.client.put(f"/api/model-services/{service_id}", json=update).status_code, 200)
                self.assertEqual(len(self.catalog()["embedding"]), 1)
                self.assertIsNone(main.embedding_connection_for_settings(main.KnowledgeBaseSettings(**base["settings"]), self.user_id))
                self.client.put(f"/api/model-services/{service_id}", json={"api_key": "qa-restored-only", "enabled": True})
                self.assertEqual(len(self.catalog()["embedding"]), 2)
        self.client.put(f"/api/model-services/{service_id}", json={"service_type": "重排模型", "model": "rerank-two"})
        self.assertEqual(len(self.catalog()["embedding"]), 1)
        self.assertEqual(self.catalog()["reranker"][1]["id"], f"service:{service_id}")
        refused = self.client.patch(f"/api/knowledge-bases/{base['id']}", json={"settings": base["settings"]})
        self.assertEqual(refused.status_code, 400)

    def test_incomplete_and_provider_only_profiles_are_not_selectable(self):
        for kind in ["嵌入模型", "重排模型"]:
            response = self.client.post("/api/model-services", json={"name": "空模型", "service_type": kind, "model": "", "base_url": "https://example.test/v1", "api_key": "qa-test-only"})
            self.assertEqual(response.status_code, 400)
        service_id = self.create_service(api_key="")
        self.assertEqual(len(self.catalog()["embedding"]), 1)
        # Existing legacy profiles with a missing model stay hidden until completed.
        services = main.load_custom_model_services(self.user_id)
        services[service_id].update(model="", api_key="qa-test-only")
        main.save_custom_model_services(services, self.user_id)
        self.assertEqual(len(self.catalog()["embedding"]), 1)
        provider = self.client.post("/api/model-services", json={"name": "仅服务商", "service_type": "嵌入模型", "provider_only": True})
        self.assertEqual(provider.status_code, 200, provider.text)
        self.assertEqual(len(self.catalog()["embedding"]), 1)
        self.client.put(f"/api/model-services/{service_id}", json={"model": "completed-embed"})
        self.assertEqual(len(self.catalog()["embedding"]), 2)

    def test_legacy_selection_migrates_only_when_actual_model_matches(self):
        service_id = self.create_service(model="BAAI/bge-m3")
        base = self.create_base(embedding_model="BAAI: BGE-M3")
        self.assertEqual(base["settings"]["embedding_model"], f"service:{service_id}")
        self.client.put(f"/api/model-services/{service_id}", json={"model": "different-model"})
        refused = self.client.post("/api/knowledge-bases", json={"name": "旧预设", "settings": {"embedding_model": "BAAI: BGE-M3"}})
        self.assertEqual(refused.status_code, 400)
        old = main.KnowledgeBase.model_validate(base)
        old.settings.embedding_model = "BAAI: BGE-M3"
        main.save_knowledge_base(old, user_id=self.user_id)
        self.assertEqual(main.load_knowledge_base(old.id, user_id=self.user_id).settings.embedding_model, "本地关键词检索")

    def test_legacy_builtin_document_parser_requires_credentials(self):
        self.assertEqual(len(self.catalog()["document_processor"]), 1)
        self.client.put("/api/model-services/mineru", json={"api_key": "qa-mineru-only"})
        self.assertEqual(self.catalog()["document_processor"][1]["id"], "service:mineru")
        base = self.create_base(document_processor="MinerU（需配置）")
        self.assertEqual(base["settings"]["document_processor"], "service:mineru")
        self.client.put("/api/model-services/mineru", json={"clear_api_key": True})
        self.assertEqual(len(self.catalog()["document_processor"]), 1)


if __name__ == "__main__":
    unittest.main()
