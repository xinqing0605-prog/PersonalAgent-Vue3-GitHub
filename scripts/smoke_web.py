"""Exercise a clean production installation. Use ONLY isolated demo/test storage."""
import sys
from pathlib import Path

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.settings import SETTINGS
from backend.app.user_storage import user_root

phase = sys.argv[1]
assert phase in {"create", "restore"}
assert SETTINGS.is_production
assert SETTINGS.legacy_user_id == 0
assert not SETTINGS.allow_shared_model_credentials
expected_root = SETTINGS.users_root / "1"
assert user_root(1) == expected_root
with TestClient(app, base_url="https://demo.example.test") as client:
    assert client.get("/").status_code == 200
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/ready").status_code == 200
    assert client.get("/api/notes").status_code == 401
    endpoint = "register" if phase == "create" else "login"
    result = client.post("/api/auth/" + endpoint, json={"username": "releasecheck", "password": "Safe9876!Demo"})
    assert result.status_code == 200, result.status_code
    assert result.json()["user"]["id"] == 1
    assert "secure" in result.headers["set-cookie"].lower()
    if phase == "create":
        note = client.post("/api/notes", json={"title": "release-persistence", "content": "Saved on persistent storage."})
        assert note.status_code == 200 and note.json()["success"]
        task = client.post("/api/tasks", json={"title": "release-task"})
        assert task.status_code == 200 and task.json()["task_id"] > 0
    notes = client.get("/api/notes").json()["notes"]
    tasks = client.get("/api/tasks").json()["tasks"]
    assert any(n["title"] == "release-persistence" for n in notes)
    assert any(t["title"] == "release-task" for t in tasks)
    assert (expected_root / "tasks.db").is_file()
    assert any((expected_root / "notes").glob("*.md"))
print("Production smoke passed:", phase, "(first account, cookie, notes, tasks, persistent paths)")
