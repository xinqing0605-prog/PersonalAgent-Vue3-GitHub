"""Regression coverage for provider edits and bulk knowledge uploads."""
import base64
import unittest
import test_knowledge_model_catalog as fixtures
import backend.app.main as main

class DesktopFeedbackTests(unittest.TestCase):
    def setUp(self):
        fixtures.KnowledgeModelCatalogTests.setUp(self)
        self.assertEqual(self.client.put("/api/model-services/qwen", json={"name": "Qwen"}).status_code, 200)
    create_service = fixtures.KnowledgeModelCatalogTests.create_service

    def test_duplicate_models_include_builtins_and_ignore_type_and_url(self):
        before = self.client.get("/api/model-services").json()
        qwen = next(item for item in before if item["id"] == "qwen")
        response = self.client.post("/api/model-services", json={
            "name": " QWEN ", "model": " " + qwen["model"].upper() + " ",
            "service_type": "综合服务", "base_url": "https://different.test/v1"})
        self.assertEqual(response.status_code, 409, response.text)
        first = self.create_service(model="alpha")
        second = self.create_service(model="beta")
        response = self.client.put("/api/model-services/" + second, json={"model": " ALPHA ", "api_key": "different-key"})
        self.assertEqual(response.status_code, 409, response.text)
        saved = main.configured_model_services(self.user_id)[second]
        self.assertEqual(saved["model"], "beta")
        self.assertEqual(saved["api_key"], "qa-catalog-only")
        self.assertEqual(self.client.put("/api/model-services/" + first, json={"description": "same identifier edit"}).status_code, 200)
        self.assertEqual(self.client.put("/api/model-services/" + second, json={"model": "gamma"}).status_code, 200)

    def test_provider_collision_is_noop_and_rename_preserves_members(self):
        sid = self.create_service(model="alpha")
        other = self.create_service(model="beta")
        before = main.configured_model_services(self.user_id)
        response = self.client.put("/api/model-providers/" + sid, json={"name": " QWEN "})
        self.assertEqual(response.status_code, 409, response.text)
        self.assertEqual(main.configured_model_services(self.user_id), before)
        response = self.client.put("/api/model-providers/" + sid, json={"name": "新名称", "service_type": "大模型"})
        self.assertEqual(response.status_code, 200, response.text)
        after = main.configured_model_services(self.user_id)
        for item_id in [sid, other]:
            self.assertEqual(after[item_id], {**before[item_id], "name": "新名称"})
        self.assertEqual(self.client.put("/api/model-providers/" + sid, json={"name": "新名称"}).status_code, 200)

    def test_renamed_builtin_uses_saved_provider_label(self):
        response = self.client.put("/api/model-services/openai", json={"name": "Qwen", "model": "image-custom"})
        self.assertEqual(response.status_code, 200, response.text)
        model = next(x for x in self.client.get("/api/chat-models").json() if x["id"] == "openai")
        self.assertEqual((model["name"], model["provider"], model["model"]), ("Qwen", "Qwen", "image-custom"))

    def test_knowledge_accepts_large_batch_without_changing_chat_limit(self):
        base = self.client.post("/api/knowledge-bases", json={"name": "批量资料"}).json()
        files = [{"filename": f"document-{i}.txt", "data_base64": base64.b64encode(b"test content").decode()} for i in range(30)]
        result = self.client.post(f"/api/knowledge-bases/{base['id']}/documents", json={"files": files})
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(len(result.json()), 30)
        self.assertEqual(self.client.get("/api/knowledge-bases").json()[0]["document_count"], 30)
        self.assertEqual(main.MAX_FILES_PER_UPLOAD, 8)
