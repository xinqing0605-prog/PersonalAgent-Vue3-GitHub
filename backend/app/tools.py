"""Local, permission-bounded tools exposed to the personal Agent."""

import sqlite3
from contextlib import closing
import re
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from .user_storage import knowledge_dir, notes_dir, tasks_db_path, workspace_dir

MAX_FILE_SIZE = 100_000


AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "创建一个个人待办任务。适用于用户明确要求记录、安排或提醒某件事。",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "待办任务标题。"},
                    "due_date": {"type": "string", "description": "截止日期，可为空。保留用户原话，例如 今天、明天、后天或 2026-08-12，不要自行计算相对日期。"},
                    "priority": {"type": "string", "description": "优先级：低、普通、高。"},
                },
                "required": ["title"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_tasks",
            "description": "查询个人待办任务。默认查询未完成任务。",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {"type": "string", "description": "任务状态：未完成、已完成或全部。"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "complete_task",
            "description": "将指定的个人待办任务标记为已完成。",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "integer", "description": "任务编号。"},
                },
                "required": ["task_id"],
            },
        },
    },
]

AGENT_TOOLS.extend(
    [
        {
            "type": "function",
            "function": {
                "name": "search_notes",
                "description": "搜索本地 notes 文件夹中的个人 Markdown 笔记。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "要搜索的关键词。"},
                    },
                    "required": ["query"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "save_note",
                "description": "将一篇个人笔记保存到本地 notes 文件夹。只能写入这个固定目录。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "description": "笔记标题。"},
                        "content": {"type": "string", "description": "笔记正文。"},
                    },
                    "required": ["title", "content"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "list_local_files",
                "description": "列出个人 Agent 允许访问目录中的文件。仅可访问 knowledge、notes 或 workspace 目录，不能访问电脑上的其他位置。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "directory": {"type": "string", "description": "目录名称：knowledge、notes 或 workspace。默认 workspace。"},
                        "query": {"type": "string", "description": "可选文件名关键词，用于筛选结果。"},
                    },
                    "required": [],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "read_local_file",
                "description": "读取个人 Agent 允许访问目录中的一个 UTF-8 文本文件。仅可访问 knowledge、notes 或 workspace 目录，路径不能包含 ..。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "directory": {"type": "string", "description": "目录名称：knowledge、notes 或 workspace。"},
                        "path": {"type": "string", "description": "相对于该目录的文件路径。"},
                    },
                    "required": ["directory", "path"],
                },
            },
        },
    ]
)


def init_task_db(user_id: int = 1) -> Path:
    database = tasks_db_path(user_id, create_parent=True)
    with closing(sqlite3.connect(database)) as connection, connection:
        connection.execute("BEGIN IMMEDIATE")
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                due_date TEXT NOT NULL DEFAULT '',
                priority TEXT NOT NULL DEFAULT '普通',
                status TEXT NOT NULL DEFAULT '未完成',
                description TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            )
            """
        )
        columns = {row[1] for row in connection.execute("PRAGMA table_info(tasks)")}
        if "description" not in columns:
            connection.execute("ALTER TABLE tasks ADD COLUMN description TEXT NOT NULL DEFAULT ''")
    return database


def normalize_due_date(value: str) -> str:
    """Normalize common Chinese relative dates on the server, not in the LLM."""
    text = value.strip()
    if not text:
        return ""
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}", text):
        return datetime.fromisoformat(text).isoformat(timespec="minutes")
    today = date.today()
    if "后天" in text:
        return (today + timedelta(days=2)).isoformat()
    if "明天" in text:
        return (today + timedelta(days=1)).isoformat()
    if "今天" in text:
        return today.isoformat()
    iso_match = re.search(r"\d{4}-\d{2}-\d{2}", text)
    if iso_match:
        return iso_match.group(0)
    month_day = re.search(r"(\d{1,2})月(\d{1,2})日", text)
    if month_day:
        return f"{today.year:04d}-{int(month_day.group(1)):02d}-{int(month_day.group(2)):02d}"
    return text


def create_task(title: str, due_date: str = "", priority: str = "普通", *, user_id: int = 1,
                description: str = "", status: str = "未完成") -> dict[str, Any]:
    if not title.strip():
        return {"success": False, "message": "任务标题不能为空。"}
    database = init_task_db(user_id)
    priority = priority if priority in {"低", "普通", "高"} else "普通"
    due_date = normalize_due_date(due_date)
    created_at = datetime.now(timezone.utc).isoformat()
    status = status if status in {"未完成", "进行中", "已完成"} else "未完成"
    with closing(sqlite3.connect(database)) as connection, connection:
        cursor = connection.execute(
            "INSERT INTO tasks (title, due_date, priority, status, description, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (title.strip(), due_date.strip(), priority, status, description.strip(), created_at),
        )
    return {
        "task_id": int(cursor.lastrowid),
        "title": title.strip(),
        "due_date": due_date.strip(),
        "priority": priority,
        "status": status,
        "description": description.strip(),
    }


def list_tasks(status: str = "未完成", *, user_id: int = 1, query: str = "") -> dict[str, Any]:
    database = init_task_db(user_id)
    with closing(sqlite3.connect(database)) as connection, connection:
        connection.row_factory = sqlite3.Row
        if status == "全部":
            rows = connection.execute("SELECT * FROM tasks ORDER BY id DESC").fetchall()
        elif status == "未完成":
            rows = connection.execute("SELECT * FROM tasks WHERE status != '已完成' ORDER BY id DESC").fetchall()
        else:
            rows = connection.execute(
                "SELECT * FROM tasks WHERE status = ? ORDER BY id DESC",
                (status if status in {"进行中", "已完成"} else "未完成",),
            ).fetchall()
    keyword = query.strip().casefold()
    return {"tasks": [dict(row) for row in rows if not keyword or keyword in f"{row['title']} {row['description']}".casefold()]}


def update_task(task_id: int, title: str, due_date: str, priority: str, status: str,
                description: str, *, user_id: int = 1) -> dict[str, Any]:
    if not title.strip() or status not in {"未完成", "进行中", "已完成"}:
        return {"success": False, "message": "任务标题或状态无效。"}
    with closing(sqlite3.connect(init_task_db(user_id))) as connection, connection:
        cursor = connection.execute(
            "UPDATE tasks SET title=?, due_date=?, priority=?, status=?, description=? WHERE id=?",
            (title.strip(), normalize_due_date(due_date), priority, status, description.strip(), task_id),
        )
        if cursor.rowcount == 0:
            return {"success": False, "message": "未找到该任务。"}
    return {"success": True, "task_id": task_id}


def delete_task(task_id: int, *, user_id: int = 1) -> dict[str, Any]:
    with closing(sqlite3.connect(init_task_db(user_id))) as connection, connection:
        cursor = connection.execute("DELETE FROM tasks WHERE id=?", (task_id,))
        if cursor.rowcount == 0:
            return {"success": False, "message": "未找到该任务。"}
    return {"success": True, "task_id": task_id}


def complete_task(task_id: int, *, user_id: int = 1) -> dict[str, Any]:
    database = init_task_db(user_id)
    with closing(sqlite3.connect(database)) as connection, connection:
        cursor = connection.execute("UPDATE tasks SET status = '已完成' WHERE id = ?", (task_id,))
        if cursor.rowcount == 0:
            return {"success": False, "message": f"没有找到任务 {task_id}。"}
    return {"success": True, "task_id": task_id, "status": "已完成"}


def _allowed_directory(name: str, user_id: int = 1) -> Path | None:
    directories = {
        "knowledge": knowledge_dir(user_id, create=True),
        "notes": notes_dir(user_id, create=True),
        "workspace": workspace_dir(user_id, create=True),
    }
    return directories.get(name.strip().lower())


def _safe_local_path(directory: str, relative_path: str, user_id: int = 1) -> tuple[Path | None, str | None]:
    root = _allowed_directory(directory, user_id)
    if root is None:
        return None, "目录不在允许范围内。只能访问 knowledge、notes 或 workspace。"
    candidate = Path(relative_path.strip())
    if not relative_path.strip() or candidate.is_absolute() or ".." in candidate.parts:
        return None, "文件路径必须是目录内的相对路径，且不能包含 ..。"
    try:
        path = (root / candidate).resolve()
        path.relative_to(root.resolve())
    except (OSError, ValueError):
        return None, "文件路径不在允许范围内。"
    return path, None


def list_local_files(directory: str = "workspace", query: str = "", *, user_id: int = 1) -> dict[str, Any]:
    root = _allowed_directory(directory, user_id)
    if root is None:
        return {"success": False, "message": "目录不在允许范围内。只能访问 knowledge、notes 或 workspace。"}
    keyword = query.strip().lower()
    files: list[dict[str, Any]] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(root).as_posix()
        if keyword and keyword not in relative.lower():
            continue
        files.append({"path": relative, "size": path.stat().st_size})
        if len(files) == 50:
            break
    return {"success": True, "directory": root.name, "files": files, "truncated": len(files) == 50}


def read_local_file(directory: str, path: str, *, user_id: int = 1) -> dict[str, Any]:
    file_path, error = _safe_local_path(directory, path, user_id)
    if error:
        return {"success": False, "message": error}
    if not file_path.exists() or not file_path.is_file():
        return {"success": False, "message": "未找到该文件。"}
    if file_path.stat().st_size > MAX_FILE_SIZE:
        return {"success": False, "message": f"文件超过 {MAX_FILE_SIZE} 字节，暂不读取。"}
    try:
        content = file_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return {"success": False, "message": "该文件不是 UTF-8 文本，暂不读取。"}
    return {
        "success": True,
        "directory": directory.strip().lower(),
        "path": str(Path(path)),
        "content": content,
    }


def search_notes(query: str, *, user_id: int = 1) -> dict[str, Any]:
    keyword = query.strip().lower()
    notes: list[dict[str, str]] = []
    for path in sorted(notes_dir(user_id, create=True).glob("*.md")):
        content = path.read_text(encoding="utf-8")
        if keyword and keyword not in content.lower() and keyword not in path.stem.lower():
            continue
        lines = content.splitlines()
        title = lines[0][2:].strip() if lines and lines[0].startswith("# ") else path.stem
        excerpt = content[:240].replace("\n", " ")
        if keyword:
            index = content.lower().find(keyword)
            if index >= 0:
                excerpt = content[max(0, index - 80) : index + 160].replace("\n", " ")
        notes.append({"id": path.name, "title": title or path.stem, "path": str(path), "excerpt": excerpt, "content": content})
    return {"notes": notes}


def save_note(title: str, content: str, *, user_id: int = 1) -> dict[str, Any]:
    clean_title = title.strip()[:80]
    clean_content = content.strip()
    if not clean_title or not clean_content:
        return {"success": False, "message": "笔记标题和内容都不能为空。"}
    safe_name = re.sub(r"[^\w\u4e00-\u9fff -]", "", clean_title).strip()[:60] or "未命名笔记"
    directory = notes_dir(user_id, create=True)
    path = directory / f"{safe_name}.md"
    if path.exists():
        suffix = uuid4().hex[:12]
        path = directory / f"{safe_name}-{suffix}.md"
    path.write_text(f"# {clean_title}\n\n{clean_content}\n", encoding="utf-8")
    return {"success": True, "id": path.name, "title": clean_title, "path": str(path)}


def update_note(note_id: str, title: str, content: str, *, user_id: int = 1) -> dict[str, Any]:
    clean_title = title.strip()[:80]
    clean_content = content.strip()
    clean_id = Path(note_id).name
    if clean_id != note_id or not clean_id.lower().endswith(".md"):
        return {"success": False, "message": "笔记标识无效。"}
    if not clean_title or not clean_content:
        return {"success": False, "message": "笔记标题和内容都不能为空。"}
    directory = notes_dir(user_id, create=True)
    path = directory / clean_id
    if not path.exists() or not path.is_file():
        return {"success": False, "message": "未找到要修改的笔记。"}
    path.write_text(f"# {clean_title}\n\n{clean_content}\n", encoding="utf-8")
    return {"success": True, "id": path.name, "title": clean_title, "path": str(path)}


def delete_note(note_id: str, *, user_id: int = 1) -> dict[str, Any]:
    clean_id = Path(note_id).name
    if clean_id != note_id or not clean_id.lower().endswith(".md"):
        return {"success": False, "message": "笔记标识无效。"}
    directory = notes_dir(user_id, create=True)
    path = directory / clean_id
    if not path.exists() or not path.is_file():
        return {"success": False, "message": "未找到要删除的笔记。"}
    content = path.read_text(encoding="utf-8")
    first_line = content.splitlines()[0] if content else ""
    title = first_line[2:].strip() if first_line.startswith("# ") else path.stem
    path.unlink()
    return {"success": True, "id": clean_id, "title": title or path.stem}


def execute_tool(name: str, arguments: dict[str, Any], *, user_id: int = 1) -> dict[str, Any]:
    if name == "create_task":
        return create_task(
            str(arguments.get("title", "")),
            str(arguments.get("due_date", "")),
            str(arguments.get("priority", "普通")),
            user_id=user_id,
        )
    if name == "list_tasks":
        return list_tasks(str(arguments.get("status", "未完成")), user_id=user_id)
    if name == "complete_task":
        return complete_task(int(arguments.get("task_id", 0)), user_id=user_id)
    if name == "search_notes":
        return search_notes(str(arguments.get("query", "")), user_id=user_id)
    if name == "save_note":
        return save_note(str(arguments.get("title", "")), str(arguments.get("content", "")), user_id=user_id)
    if name == "list_local_files":
        return list_local_files(
            str(arguments.get("directory", "workspace")),
            str(arguments.get("query", "")),
            user_id=user_id,
        )
    if name == "read_local_file":
        return read_local_file(
            str(arguments.get("directory", "workspace")),
            str(arguments.get("path", "")),
            user_id=user_id,
        )
    return {"found": False, "message": f"未知工具：{name}"}
