import base64
import sys
import tempfile
import unittest
from dataclasses import replace
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

import backend.app.auth as auth
import backend.app.main as main_module
import backend.app.user_storage as user_storage
from backend.app.main import app
from backend.app.tools import execute_tool


class UserIsolationTests(unittest.TestCase):
    def test_theme_and_custom_background_are_isolated_between_accounts(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            with (
                patch.object(auth, "AUTH_DB_PATH", root / "auth.db"),
                patch.object(user_storage, "ROOT_DIR", root),
                patch.object(user_storage, "USERS_ROOT", root / "users"),
                patch.object(user_storage, "LEGACY_USER_ID", 999),
            ):
                first_client = TestClient(app)
                second_client = TestClient(app)
                first_client.post("/api/auth/register", json={"username": "themeone", "password": "Safe1234!"})
                second_client.post("/api/auth/register", json={"username": "themetwo", "password": "Other1234!"})
                png_data_url = (
                    "data:image/png;base64,"
                    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
                )

                saved = first_client.put(
                    "/api/theme",
                    json={
                        "theme_id": "custom",
                        "custom_background": png_data_url,
                        "custom_background_name": "私人背景.png",
                        "overlay": 0.58,
                    },
                )
                self.assertEqual(saved.status_code, 200)
                self.assertEqual(saved.json()["theme"]["theme_id"], "custom")
                transparent = first_client.put(
                    "/api/theme",
                    json={
                        "theme_id": "custom",
                        "custom_background": png_data_url,
                        "custom_background_name": "私人背景.png",
                        "overlay": 0.0,
                    },
                )
                self.assertEqual(transparent.status_code, 200)
                self.assertEqual(transparent.json()["theme"]["overlay"], 0.0)
                opaque = first_client.put(
                    "/api/theme",
                    json={
                        "theme_id": "custom",
                        "custom_background": png_data_url,
                        "custom_background_name": "私人背景.png",
                        "overlay": 1.0,
                    },
                )
                self.assertEqual(opaque.status_code, 200)
                self.assertEqual(opaque.json()["theme"]["overlay"], 1.0)

                favorite = first_client.post(
                    "/api/theme/favorites",
                    json={
                        "name": "清晰背景",
                        "theme": {
                            "theme_id": "custom",
                            "custom_background": png_data_url,
                            "custom_background_name": "私人背景.png",
                            "overlay": 0.25,
                        },
                    },
                )
                self.assertEqual(favorite.status_code, 200)
                favorite_id = favorite.json()["favorite"]["id"]
                favorite_list = first_client.get("/api/theme").json()["favorites"]
                self.assertEqual([item["name"] for item in favorite_list], ["清晰背景"])
                self.assertNotIn("data:image", str(favorite_list))
                preview = first_client.get(f"/api/theme/favorites/{favorite_id}/preview")
                self.assertEqual(preview.status_code, 200)
                self.assertEqual(preview.headers["content-type"], "image/png")
                self.assertEqual(preview.content, base64.b64decode(png_data_url.split(",", 1)[1]))
                self.assertEqual(
                    preview.headers["cache-control"],
                    "private, no-store, max-age=0",
                )

                second_theme = second_client.get("/api/theme")
                self.assertEqual(second_theme.status_code, 200)
                self.assertEqual(second_theme.json()["theme"]["theme_id"], "mint")
                self.assertEqual(second_theme.json()["theme"]["custom_background"], "")
                self.assertEqual(second_theme.json()["favorites"], [])
                self.assertEqual(second_client.get(f"/api/theme/favorites/{favorite_id}/preview").status_code, 404)
                activated = first_client.post(f"/api/theme/favorites/{favorite_id}/activate")
                self.assertEqual(activated.status_code, 200)
                self.assertEqual(activated.json()["theme"]["overlay"], 0.25)
                removed = first_client.delete(f"/api/theme/favorites/{favorite_id}")
                self.assertEqual(removed.status_code, 200)
                self.assertEqual(first_client.get("/api/theme").json()["favorites"], [])
                self.assertEqual(first_client.get(f"/api/theme/favorites/{favorite_id}/preview").status_code, 404)
                second_client.put(
                    "/api/theme",
                    json={"theme_id": "ocean", "custom_background": "", "custom_background_name": "", "overlay": 0.7},
                )
                self.assertEqual(first_client.get("/api/theme").json()["theme"]["custom_background_name"], "私人背景.png")

                spoofed = first_client.put(
                    "/api/theme",
                    json={
                        "theme_id": "custom",
                        "custom_background": "data:image/png;base64,bm90LWEtcG5n",
                        "custom_background_name": "伪造.png",
                        "overlay": 0.62,
                    },
                )
                self.assertEqual(spoofed.status_code, 400)
                self.assertIn("格式与文件内容不一致", spoofed.json()["detail"])
                self.assertEqual(TestClient(app).get("/api/theme").status_code, 401)
                self.assertEqual(TestClient(app).post("/api/theme/favorites", json={}).status_code, 401)
                self.assertEqual(TestClient(app).get(f"/api/theme/favorites/{favorite_id}/preview").status_code, 401)

    def test_unsaved_shared_environment_key_cannot_power_account_chat(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            isolated_settings = replace(
                main_module.SETTINGS, allow_shared_model_credentials=False
            )
            with (
                patch.object(user_storage, "ROOT_DIR", root),
                patch.object(user_storage, "USERS_ROOT", root / "users"),
                patch.object(user_storage, "LEGACY_USER_ID", 1),
                patch.object(main_module, "SETTINGS", isolated_settings),
                patch.object(main_module, "getenv", return_value="shared-secret-key"),
            ):
                services = main_module.configured_model_services(1)
                self.assertEqual(services["deepseek"]["api_key"], "")
                with self.assertRaisesRegex(RuntimeError, "尚未配置 API Key"):
                    main_module.resolve_chat_model("deepseek", 1)

    def test_knowledge_tasks_notes_attachments_and_profiles_are_isolated(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            patches = (
                patch.object(auth, "AUTH_DB_PATH", root / "auth.db"),
                patch.object(user_storage, "ROOT_DIR", root),
                patch.object(user_storage, "USERS_ROOT", root / "users"),
                patch.object(user_storage, "LEGACY_USER_ID", 999),
            )
            with patches[0], patches[1], patches[2], patches[3]:
                first_client = TestClient(app)
                second_client = TestClient(app)
                first = first_client.post(
                    "/api/auth/register",
                    json={"username": "first", "password": "Safe1234!"},
                ).json()["user"]
                second = second_client.post(
                    "/api/auth/register",
                    json={"username": "second", "password": "Other1234!"},
                ).json()["user"]

                created = first_client.post(
                    "/api/knowledge-bases",
                    json={"name": "仅账户一可见", "description": "隔离验证"},
                )
                self.assertEqual(created.status_code, 200)
                base_id = created.json()["id"]
                self.assertEqual(len(first_client.get("/api/knowledge-bases").json()), 1)
                self.assertEqual(second_client.get("/api/knowledge-bases").json(), [])
                self.assertEqual(second_client.get(f"/api/knowledge-bases/{base_id}/documents").status_code, 404)

                execute_tool("create_task", {"title": "账户一待办"}, user_id=int(first["id"]))
                saved_note = execute_tool("save_note", {"title": "账户一笔记", "content": "私有内容"}, user_id=int(first["id"]))
                self.assertEqual(len(execute_tool("list_tasks", {"status": "全部"}, user_id=int(first["id"]))["tasks"]), 1)
                self.assertEqual(execute_tool("list_tasks", {"status": "全部"}, user_id=int(second["id"]))["tasks"], [])
                self.assertEqual(len(execute_tool("search_notes", {"query": "私有"}, user_id=int(first["id"]))["notes"]), 1)
                self.assertEqual(execute_tool("search_notes", {"query": "私有"}, user_id=int(second["id"]))["notes"], [])
                self.assertEqual(first_client.get("/api/notes").json()["notes"][0]["title"], "账户一笔记")
                self.assertEqual(second_client.get("/api/notes").json()["notes"], [])
                updated_note = first_client.put(
                    f"/api/notes/{saved_note['id']}",
                    json={"title": "账户一笔记（已修改）", "content": "私有内容与图片粘贴标记"},
                )
                self.assertEqual(updated_note.status_code, 200)
                self.assertEqual(first_client.get("/api/notes").json()["notes"][0]["title"], "账户一笔记（已修改）")
                self.assertEqual(second_client.get("/api/notes").json()["notes"], [])
                self.assertEqual(second_client.delete(f"/api/notes/{saved_note['id']}").status_code, 404)
                deleted_note = first_client.delete(f"/api/notes/{saved_note['id']}")
                self.assertEqual(deleted_note.status_code, 200)
                self.assertEqual(deleted_note.json()["title"], "账户一笔记（已修改）")
                self.assertEqual(first_client.get("/api/notes").json()["notes"], [])

                conversation_id = "shared-looking-id"
                uploaded = first_client.post(
                    f"/api/conversations/{conversation_id}/files",
                    json={"files": [{"filename": "private.txt", "data_base64": base64.b64encode(b"private").decode("ascii")}]},
                )
                self.assertEqual(uploaded.status_code, 200)
                self.assertEqual(len(first_client.get(f"/api/conversations/{conversation_id}/files").json()["files"]), 1)
                self.assertEqual(second_client.get(f"/api/conversations/{conversation_id}/files").json()["files"], [])
                document_upload = first_client.post(
                    f"/api/conversations/{conversation_id}/files",
                    json={"files": [{"filename": "attachment.docx", "data_base64": base64.b64encode(b"PK-test-docx").decode("ascii")}]},
                )
                self.assertEqual(document_upload.status_code, 200)
                self.assertEqual(document_upload.json()["files"][0]["filename"], "attachment.docx")

                profile = first_client.patch(
                    "/api/auth/profile",
                    json={"nickname": "账户一昵称", "avatar": ""},
                )
                self.assertEqual(profile.status_code, 200)
                self.assertEqual(profile.json()["user"]["nickname"], "账户一昵称")
                self.assertEqual(second_client.get("/api/auth/me").json()["user"]["nickname"], "second")

    def test_profile_validation_rejects_invalid_values(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            with patch.object(auth, "AUTH_DB_PATH", Path(temporary) / "auth.db"):
                client = TestClient(app)
                client.post("/api/auth/register", json={"username": "profile", "password": "Safe1234!"})
                self.assertEqual(client.patch("/api/auth/profile", json={"nickname": "", "avatar": ""}).status_code, 422)
                response = client.patch("/api/auth/profile", json={"nickname": "正常昵称", "avatar": "data:image/gif;base64,R0lGODlh"})
                self.assertEqual(response.status_code, 400)
                self.assertIn("头像仅支持", response.json()["detail"])

    def test_model_services_and_keys_are_isolated_between_accounts(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            patches = (
                patch.object(auth, "AUTH_DB_PATH", root / "auth.db"),
                patch.object(user_storage, "ROOT_DIR", root),
                patch.object(user_storage, "USERS_ROOT", root / "users"),
                patch.object(user_storage, "LEGACY_USER_ID", 999),
            )
            with patches[0], patches[1], patches[2], patches[3]:
                first_client = TestClient(app)
                second_client = TestClient(app)
                first_client.post("/api/auth/register", json={"username": "modelone", "password": "Safe1234!"})
                second_client.post("/api/auth/register", json={"username": "modeltwo", "password": "Other1234!"})

                created = first_client.post(
                    "/api/model-services",
                    json={
                        "name": "账户一私有模型",
                        "service_type": "大模型",
                        "model": "private-chat",
                        "base_url": "https://models.example.com/v1",
                        "api_key": "first-secret-key",
                        "description": "只属于账户一",
                    },
                )
                self.assertEqual(created.status_code, 200)
                service_id = created.json()["service"]["id"]
                same_provider_second_model = first_client.post(
                    "/api/model-services",
                    json={
                        "name": "账户一私有模型",
                        "service_type": "大模型",
                        "model": "private-chat-pro",
                        "base_url": "https://models.example.com/v1/chat/completions",
                        "api_key": "first-secret-key",
                        "description": "同一服务商的第二个模型",
                    },
                )
                self.assertEqual(same_provider_second_model.status_code, 200)
                second_service_id = same_provider_second_model.json()["service"]["id"]
                configured = first_client.put(
                    "/api/model-services/deepseek",
                    json={
                        "name": "账户一 DeepSeek",
                        "description": "账户一专属配置",
                        "service_type": "大模型",
                        "api_key": "first-deepseek-key",
                        "base_url": "https://api.example.com/v1",
                        "model": "deepseek-chat",
                        "enabled": True,
                    },
                )
                self.assertEqual(configured.status_code, 200)

                first_services = first_client.get("/api/model-services")
                second_services = second_client.get("/api/model-services")
                self.assertEqual(first_services.status_code, 200)
                self.assertEqual(second_services.status_code, 200)
                self.assertEqual(first_services.headers["cache-control"], "private, no-store, max-age=0")
                self.assertTrue(any(item["id"] == service_id for item in first_services.json()))
                self.assertTrue(any(item["id"] == second_service_id for item in first_services.json()))
                self.assertFalse(any(item["id"] == service_id for item in second_services.json()))
                self.assertFalse(any(item["id"] == second_service_id for item in second_services.json()))
                first_deepseek = next(item for item in first_services.json() if item["id"] == "deepseek")
                second_deepseek = next(item for item in second_services.json() if item["id"] == "deepseek")
                self.assertTrue(first_deepseek["configured"])
                self.assertFalse(second_deepseek["configured"])
                self.assertEqual(first_deepseek["name"], "账户一 DeepSeek")
                self.assertNotEqual(second_deepseek["name"], "账户一 DeepSeek")

                missing_model = first_client.put(
                    "/api/model-services/mineru",
                    json={
                        "service_type": "大模型",
                        "model": "",
                        "base_url": "https://mineru.example.com/v1",
                        "enabled": True,
                    },
                )
                self.assertEqual(missing_model.status_code, 400)
                self.assertIn("模型标识", missing_model.json()["detail"])

    def test_provider_can_be_created_before_adding_its_models(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            with (
                patch.object(auth, "AUTH_DB_PATH", root / "auth.db"),
                patch.object(user_storage, "ROOT_DIR", root),
                patch.object(user_storage, "USERS_ROOT", root / "users"),
                patch.object(user_storage, "LEGACY_USER_ID", 999),
            ):
                client = TestClient(app)
                client.post("/api/auth/register", json={"username": "providerowner", "password": "Safe1234!"})
                created_provider = client.post(
                    "/api/model-services",
                    json={"name": "Acme AI", "service_type": "大模型", "provider_only": True},
                )
                self.assertEqual(created_provider.status_code, 200)
                provider_id = created_provider.json()["service"]["id"]
                self.assertTrue(created_provider.json()["service"]["provider_only"])
                self.assertFalse(any(item["id"] == provider_id for item in client.get("/api/chat-models").json()))

                duplicate_provider = client.post(
                    "/api/model-services",
                    json={"name": "acme ai", "service_type": "综合服务", "provider_only": True},
                )
                self.assertEqual(duplicate_provider.status_code, 409)

                created_model = client.post(
                    "/api/model-services",
                    json={
                        "name": "Acme AI",
                        "service_type": "大模型",
                        "model": "acme-chat",
                        "base_url": "https://models.example.com/v1",
                        "api_key": "acme-secret-key",
                    },
                )
                self.assertEqual(created_model.status_code, 200)
                services = [item for item in client.get("/api/model-services").json() if item["name"] == "Acme AI"]
                self.assertEqual(len(services), 2)
                self.assertEqual(sum(bool(item.get("provider_only")) for item in services), 1)
                self.assertTrue(any(item["model"] == "acme-chat" for item in client.get("/api/chat-models").json()))

                renamed = client.put(
                    f"/api/model-services/{provider_id}",
                    json={"name": "Acme Cloud", "service_type": "综合服务", "provider_only": True},
                )
                self.assertEqual(renamed.status_code, 200)
                placeholder = next(item for item in client.get("/api/model-services").json() if item["id"] == provider_id)
                self.assertEqual(placeholder["name"], "Acme Cloud")
                self.assertEqual(placeholder["service_type"], "综合服务")

    def test_extended_agent_settings_are_saved_per_account_and_apply_to_new_work(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            with (
                patch.object(auth, "AUTH_DB_PATH", root / "auth.db"),
                patch.object(user_storage, "ROOT_DIR", root),
                patch.object(user_storage, "USERS_ROOT", root / "users"),
                patch.object(user_storage, "LEGACY_USER_ID", 999),
            ):
                first_client = TestClient(app)
                second_client = TestClient(app)
                first_user = first_client.post("/api/auth/register", json={"username": "settingsone", "password": "Safe1234!"}).json()["user"]
                second_client.post("/api/auth/register", json={"username": "settingstwo", "password": "Other1234!"})
                first_client.put(
                    "/api/model-services/deepseek",
                    json={"api_key": "private-deepseek-key", "base_url": "https://api.deepseek.com", "model": "deepseek-chat", "enabled": True},
                )

                defaults = first_client.put(
                    "/api/agent-settings/defaults",
                    json={"chat_model_id": "deepseek", "fallback_model_id": "", "auto_fallback": False, "temperature": 0.7, "max_tokens": 2048},
                )
                self.assertEqual(defaults.status_code, 200)
                self.assertEqual(first_client.get("/api/model").json()["model_id"], "deepseek")
                self.assertEqual(second_client.get("/api/agent-settings").json()["settings"]["defaults"]["chat_model_id"], "")

                gateway = first_client.put(
                    "/api/agent-settings/gateway",
                    json={"enabled": True, "base_url": "https://gateway.example.com/v1", "api_key": "gateway-private-secret", "timeout_seconds": 45, "max_retries": 2},
                )
                self.assertEqual(gateway.status_code, 200)
                safe_gateway = first_client.get("/api/agent-settings").json()["settings"]["gateway"]
                self.assertTrue(safe_gateway["configured"])
                self.assertEqual(safe_gateway["api_key"], "")
                self.assertNotIn("gateway-private-secret", str(safe_gateway))
                imported_gateway = first_client.post("/api/agent-settings/gateway/import", json={"name": "测试网关", "model": "gateway-chat"})
                self.assertEqual(imported_gateway.status_code, 200)
                gateway_model_id = imported_gateway.json()["service_id"]
                self.assertTrue(next(item for item in first_client.get("/api/chat-models").json() if item["id"] == gateway_model_id)["configured"])
                updated_gateway = first_client.put(
                    "/api/agent-settings/gateway",
                    json={"enabled": True, "base_url": "https://new-gateway.example.com/v1", "api_key": "replacement-gateway-secret", "timeout_seconds": 45, "max_retries": 2},
                )
                self.assertEqual(updated_gateway.status_code, 200)
                stored_gateway_model = main_module.load_custom_model_services(int(first_user["id"]))[gateway_model_id]
                self.assertEqual(stored_gateway_model["base_url"], "https://new-gateway.example.com/v1")
                self.assertEqual(stored_gateway_model["endpoint_url"], "https://new-gateway.example.com/v1")
                self.assertEqual(stored_gateway_model["api_key"], "replacement-gateway-secret")
                cleared_gateway = first_client.put(
                    "/api/agent-settings/gateway",
                    json={"enabled": True, "base_url": "https://new-gateway.example.com/v1", "api_key": "", "clear_api_key": True, "timeout_seconds": 45, "max_retries": 2},
                )
                self.assertEqual(cleared_gateway.status_code, 200)
                self.assertEqual(main_module.load_custom_model_services(int(first_user["id"]))[gateway_model_id]["api_key"], "")
                disabled_gateway = first_client.put(
                    "/api/agent-settings/gateway",
                    json={"enabled": False, "base_url": "https://new-gateway.example.com/v1", "api_key": "", "timeout_seconds": 45, "max_retries": 2},
                )
                self.assertEqual(disabled_gateway.status_code, 200)
                self.assertFalse(next(item for item in first_client.get("/api/chat-models").json() if item["id"] == gateway_model_id)["configured"])

                local_model = first_client.post(
                    "/api/local-models/import",
                    json={"provider": "ollama", "model": "qwen2.5:7b", "base_url": "http://127.0.0.1:11434/v1"},
                )
                self.assertEqual(local_model.status_code, 200)
                local_id = local_model.json()["service_id"]
                self.assertTrue(any(item["id"] == local_id for item in first_client.get("/api/chat-models").json()))
                self.assertFalse(any(item["id"] == local_id for item in second_client.get("/api/chat-models").json()))
                self.assertEqual(
                    first_client.post("/api/local-models/import", json={"provider": "ollama", "model": "unsafe", "base_url": "https://remote.example.com/v1"}).status_code,
                    400,
                )

                mcp = first_client.put(
                    "/api/agent-settings/mcp",
                    json={"servers": [{"name": "Python MCP", "transport": "stdio", "command": sys.executable, "args": ["-m", "example"], "enabled": True, "timeout_seconds": 20}]},
                )
                self.assertEqual(mcp.status_code, 200)
                server_id = mcp.json()["settings"]["mcp_servers"][0]["id"]
                self.assertTrue(first_client.post(f"/api/agent-settings/mcp/{server_id}/check").json()["ok"])

                document = first_client.put(
                    "/api/agent-settings/document",
                    json={"document_processor": "内置文本解析", "top_k": 7, "smart_chunking": True, "separator": "\\n\\n", "chunk_size": 1536, "chunk_overlap": 128, "preserve_headings": True, "extract_tables": True, "ocr_fallback": True},
                )
                self.assertEqual(document.status_code, 200)
                created = first_client.post("/api/knowledge-bases", json={"name": "继承全局默认值"})
                self.assertEqual(created.status_code, 200)
                self.assertEqual(created.json()["settings"]["top_k"], 7)
                self.assertEqual(created.json()["settings"]["chunk_size"], 1536)
                self.assertEqual(created.json()["settings"]["chunk_overlap"], 128)
                self.assertTrue(created.json()["settings"]["preserve_headings"])
                self.assertTrue(created.json()["settings"]["extract_tables"])
                self.assertTrue(created.json()["settings"]["ocr_fallback"])

                ocr = first_client.put(
                    "/api/agent-settings/ocr",
                    json={"engine": "auto", "languages": ["chi_sim", "eng"], "detect_orientation": True, "preserve_layout": False, "min_confidence": 0.75},
                )
                self.assertEqual(ocr.status_code, 200)
                self.assertEqual(first_client.get("/api/agent-settings").json()["settings"]["ocr"]["min_confidence"], 0.75)
                self.assertEqual(second_client.get("/api/agent-settings").json()["settings"]["ocr"]["min_confidence"], 0.6)

    def test_embedding_endpoint_is_normalized_and_unblocks_knowledge_base_creation(self) -> None:
        """A pasted SiliconFlow operation URL must work for the selected BGE model."""
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            patches = (
                patch.object(auth, "AUTH_DB_PATH", root / "auth.db"),
                patch.object(user_storage, "ROOT_DIR", root),
                patch.object(user_storage, "USERS_ROOT", root / "users"),
                patch.object(user_storage, "LEGACY_USER_ID", 999),
            )
            with patches[0], patches[1], patches[2], patches[3]:
                client = TestClient(app)
                user = client.post(
                    "/api/auth/register",
                    json={"username": "embeddinguser", "password": "Safe1234!"},
                ).json()["user"]

                configured = client.post(
                    "/api/model-services",
                    json={
                        "name": "硅基流动",
                        "service_type": "嵌入模型",
                        "model": "BAAI/bge-m3",
                        "base_url": "https://api.siliconflow.cn/v1/embeddings",
                        "api_key": "siliconflow-test-key",
                        "description": "",
                    },
                )
                self.assertEqual(configured.status_code, 200)
                self.assertTrue(configured.json()["normalized_endpoint"])
                self.assertEqual(
                    configured.json()["service"]["base_url"],
                    "https://api.siliconflow.cn/v1",
                )
                self.assertEqual(
                    configured.json()["service"]["endpoint_url"],
                    "https://api.siliconflow.cn/v1/embeddings",
                )

                created = client.post(
                    "/api/knowledge-bases",
                    json={
                        "name": "嵌入测试知识库",
                        "settings": {"embedding_model": "BAAI: BGE-M3"},
                    },
                )
                self.assertEqual(created.status_code, 200)

                connection = main_module.embedding_connection_for_settings(
                    main_module.KnowledgeBaseSettings(embedding_model="BAAI: BGE-M3"),
                    user_id=int(user["id"]),
                )
                self.assertIsNotNone(connection)
                self.assertEqual(connection["model"], "BAAI/bge-m3")
                self.assertEqual(connection["base_url"], "https://api.siliconflow.cn/v1")


if __name__ == "__main__":
    unittest.main()
