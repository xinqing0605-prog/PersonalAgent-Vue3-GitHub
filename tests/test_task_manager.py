import sqlite3
from contextlib import closing
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient
import backend.app.auth as auth
import backend.app.user_storage as storage
from backend.app.main import app
from backend.app.tools import init_task_db, list_tasks, save_note


class TaskManagerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        for obj, name, value in [(auth, "AUTH_DB_PATH", root / "auth.db"), (storage, "ROOT_DIR", root), (storage, "USERS_ROOT", root / "users"), (storage, "LEGACY_USER_ID", 0)]:
            patcher = patch.object(obj, name, value); patcher.start(); self.addCleanup(patcher.stop)
        self.a = TestClient(app); self.b = TestClient(app)
        for client, name in [(self.a, "taskfirst"), (self.b, "tasksecond")]:
            self.assertEqual(client.post("/api/auth/register", json={"username": name, "password": "Safe1234!"}).status_code, 200)

    def test_create_edit_search_filter_reload_and_delete_are_account_scoped(self):
        body = {"title": "整理资料", "description": "会议备注", "due_date": "2026-10-20T14:30", "priority": "高", "status": "未完成"}
        result = self.a.post("/api/tasks", json=body)
        self.assertEqual(result.status_code, 200)
        task_id = result.json()["task_id"]
        self.assertEqual(self.a.get("/api/tasks?query=会议").json()["tasks"][0]["due_date"], body["due_date"])
        self.assertEqual(self.b.get("/api/tasks").json()["tasks"], [])
        self.assertEqual(self.b.put(f"/api/tasks/{task_id}", json=body).status_code, 404)
        self.assertEqual(self.b.delete(f"/api/tasks/{task_id}").status_code, 404)
        for status in ["进行中", "已完成", "未完成"]:
            body["status"] = status; body["title"] = "改名资料"
            self.assertEqual(self.a.put(f"/api/tasks/{task_id}", json=body).status_code, 200)
            status_filter = "待办" if status == "未完成" else status
            tasks = self.a.get("/api/tasks", params={"status": status_filter, "query": "改名"}).json()["tasks"]
            self.assertEqual(len(tasks), 1); self.assertEqual(tasks[0]["status"], status)
        self.assertEqual(self.a.delete(f"/api/tasks/{task_id}").status_code, 200)
        self.assertEqual(self.a.get("/api/tasks").json()["tasks"], [])

    def test_old_database_is_migrated_without_losing_tasks(self):
        db = storage.tasks_db_path(1, create_parent=True)
        with closing(sqlite3.connect(db)) as connection, connection:
            connection.execute("CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, due_date TEXT NOT NULL, priority TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL)")
            connection.execute("INSERT INTO tasks VALUES (7, '旧待办', '', '普通', '未完成', '2026-09-01')")
        init_task_db(1); init_task_db(1)
        tasks = list_tasks(user_id=1)["tasks"]
        self.assertEqual(tasks[0]["id"], 7); self.assertEqual(tasks[0]["title"], "旧待办"); self.assertEqual(tasks[0]["description"], "")

    def test_invalid_input_and_anonymous_access(self):
        for body in [{"title": " "}, {"title": "x", "status": "unknown"}, {"title": "x", "due_date": "2026-02-30"}]:
            self.assertEqual(self.a.post("/api/tasks", json=body).status_code, 422)
        self.assertEqual(TestClient(app).get("/api/tasks").status_code, 401)

    def test_note_images_and_duplicate_titles_survive_save(self):
        content = "正文\n![截图](data:image/png;base64,iVBORw0KGgo=)\n结尾"
        body = {"title": "同名笔记", "content": content}
        ids = [self.a.post("/api/notes", json=body).json()["id"] for _ in range(3)]
        self.assertEqual(len(set(ids)), 3)
        self.assertEqual(len(self.a.get("/api/notes").json()["notes"]), 3)
        self.assertTrue(all(content in note["content"] for note in self.a.get("/api/notes").json()["notes"]))
        self.assertEqual(self.b.get("/api/notes").json()["notes"], [])
        self.assertEqual(self.a.put(f"/api/notes/{ids[0]}", json={"title": "修改笔记", "content": "只保留文字"}).status_code, 200)
        self.assertEqual(len(self.a.get("/api/notes").json()["notes"]), 3)
