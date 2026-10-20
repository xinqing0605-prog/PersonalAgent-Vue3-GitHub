
"""Regressions for provider deletion and theme switching found in manual use."""
import base64
import tempfile
import unittest
from contextlib import ExitStack
from dataclasses import replace
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
import backend.app.auth as auth
import backend.app.main as main
import backend.app.user_storage as storage


class ManualFixesTests(unittest.TestCase):
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
        response = self.client.post("/api/auth/register", json={"username": "sixfixes", "password": "Safe1234!"})
        self.assertEqual(response.status_code, 200, response.text)
        self.uid = response.json()["user"]["id"]

    def services(self, client=None):
        return (client or self.client).get("/api/model-services").json()

    def test_delete_builtin_model_keeps_provider_and_stays_deleted(self):
        self.client.put("/api/model-services/deepseek", json={"api_key": "qa-only-secret"})
        self.assertEqual(self.client.delete("/api/model-services/deepseek").status_code, 200)
        self.assertNotIn("deepseek", [x["id"] for x in self.services()])
        self.assertTrue(any(x.get("provider_only") and x["name"] == "DeepSeek" for x in self.services()))
        self.assertNotIn("deepseek", [x["id"] for x in self.client.get("/api/chat-models").json()])
        self.assertNotIn("deepseek", [x["id"] for x in self.client.get("/api/model-catalog").json()["services"]])
        self.assertEqual(main.load_model_services(self.uid)["deepseek"]["api_key"], "")
        self.assertEqual(self.client.put("/api/model-services/deepseek", json={"enabled": True}).status_code, 404)
        other = TestClient(main.app)
        other.post("/api/auth/register", json={"username": "otherfixes", "password": "Safe1234!"})
        self.assertIn("deepseek", [x["id"] for x in self.services(other)])
        for service in self.client.get("/api/chat-models").json():
            self.assertEqual(self.client.delete("/api/model-services/" + service["service"]).status_code, 200)
        with self.assertRaisesRegex(RuntimeError, "尚未添加聊天模型"):
            main.resolve_chat_model(user_id=self.uid)

    def test_provider_cascade_includes_builtin_custom_and_knowledge_references(self):
        self.client.put("/api/model-services/qwen", json={"name": "混合服务商", "service_type": "嵌入模型", "model": "embed-one", "api_key": "qa-test-key"})
        model = self.client.post("/api/model-services", json={"name": "混合服务商", "service_type": "重排模型", "model": "rerank-one", "base_url": "https://example.test/v1", "api_key": "qa-test-key"})
        self.assertEqual(model.status_code, 200, model.text)
        cid = model.json()["service"]["id"]
        base = self.client.post("/api/knowledge-bases", json={"name": "保留资料", "settings": {"embedding_model": "service:qwen", "reranker": "service:" + cid}}).json()
        self.assertEqual(self.client.delete("/api/model-providers/qwen").status_code, 409)
        self.assertEqual(sum(x["name"] == "混合服务商" for x in self.services()), 2)
        deleted = self.client.delete("/api/model-providers/qwen?cascade=true")
        self.assertEqual(deleted.status_code, 200, deleted.text)
        self.assertEqual(deleted.json()["deleted_models"], 2)
        self.assertFalse(any(x["name"] == "混合服务商" for x in self.services()))
        restored = next(x for x in self.client.get("/api/knowledge-bases").json() if x["id"] == base["id"])
        self.assertEqual(restored["settings"]["embedding_model"], "本地关键词检索")
        self.assertEqual(restored["settings"]["reranker"], "不使用")
        recreated = self.client.post("/api/model-services", json={"name": "混合服务商", "service_type": "大模型", "provider_only": True})
        self.assertEqual(recreated.status_code, 200, recreated.text)

    def test_empty_provider_and_last_custom_model_are_independent(self):
        created = self.client.post("/api/model-services", json={"name": "空服务商", "service_type": "大模型", "provider_only": True})
        pid = created.json()["service"]["id"]
        deleted = self.client.delete("/api/model-providers/" + pid)
        self.assertEqual(deleted.status_code, 200)
        self.assertEqual(deleted.json()["deleted_models"], 0)
        model = self.client.post("/api/model-services", json={"name": "独立服务商", "service_type": "大模型", "model": "chat-one", "base_url": "https://example.test/v1"})
        mid = model.json()["service"]["id"]
        self.assertEqual(self.client.delete("/api/model-services/" + mid).status_code, 200)
        providers = [x for x in self.services() if x["name"] == "独立服务商"]
        self.assertEqual(len(providers), 1)
        self.assertTrue(providers[0]["provider_only"])
        self.assertEqual(self.client.delete("/api/model-providers/" + providers[0]["id"]).status_code, 200)
        self.assertNotIn("独立服务商", [x["name"] for x in self.services()])

    def test_deleted_builtin_provider_can_be_recreated_under_original_name(self):
        self.assertEqual(self.client.delete("/api/model-providers/mineru?cascade=true").status_code, 200)
        created = self.client.post("/api/model-services", json={"name": "MinerU", "service_type": "文档解析", "provider_only": True})
        self.assertEqual(created.status_code, 200, created.text)

    def test_theme_favorites_switch_images_and_builtin_clears_old_image(self):
        def theme(name):
            return {"theme_id": "custom", "custom_background": "data:image/png;base64," + base64.b64encode(b"\x89PNG\r\n\x1a\n" + name.encode()).decode(), "custom_background_name": name, "overlay": 0.3}
        a, b = theme("A.png"), theme("B.png")
        ids = []
        for name, value in [("A", a), ("B", b), ("内置", {"theme_id": "ocean", "overlay": 0.62})]:
            res = self.client.post("/api/theme/favorites", json={"name": name, "theme": value})
            self.assertEqual(res.status_code, 200, res.text)
            ids.append(res.json()["favorite"]["id"])
        self.client.put("/api/theme", json=a)
        for fid, value in [(ids[1], b), (ids[0], a)]:
            result = self.client.post("/api/theme/favorites/" + fid + "/activate").json()["theme"]
            self.assertEqual(result["custom_background"], value["custom_background"])
            self.assertEqual(result["custom_background_name"], value["custom_background_name"])
        result = self.client.post("/api/theme/favorites/" + ids[2] + "/activate").json()["theme"]
        self.assertEqual(result["theme_id"], "ocean")
        self.assertEqual(result["custom_background"], "")
        self.assertEqual(result["custom_background_name"], "")
        self.assertEqual(self.client.get("/api/theme").json()["theme"]["custom_background"], "")
        self.client.put("/api/theme", json={"theme_id": "mint", "custom_background": "", "custom_background_name": "", "overlay": 0.62})
        self.assertEqual(self.client.get("/api/theme").json()["theme"]["custom_background"], "")
        result = self.client.post("/api/theme/favorites/" + ids[1] + "/activate").json()["theme"]
        self.assertEqual(result["custom_background"], b["custom_background"])


if __name__ == "__main__":
    unittest.main()
