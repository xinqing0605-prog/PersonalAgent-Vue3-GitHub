"""Account-owned conversation state shared by isolated desktop cookie profiles."""
import json
import os
import threading
from uuid import uuid4

from .user_storage import conversations_dir

_lock = threading.RLock()


def load_desktop_state(user_id: int):
    path = conversations_dir(user_id) / '_desktop-state.json'
    with _lock:
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding='utf-8'))


def save_desktop_state(user_id: int, state: dict):
    if not isinstance(state.get('conversations'), list) or not isinstance(state.get('activeId'), str):
        raise ValueError('对话记录格式不正确。')
    raw = json.dumps(state, ensure_ascii=False)
    if len(raw.encode('utf-8')) > 20_000_000:
        raise ValueError('对话记录超过 20 MB，请先导出并整理旧记录。')
    directory = conversations_dir(user_id, create=True)
    path = directory / '_desktop-state.json'
    temporary = directory / f'.desktop-state-{uuid4().hex}.tmp'
    with _lock:
        try:
            with temporary.open('x', encoding='utf-8') as output:
                output.write(raw)
                output.flush()
                os.fsync(output.fileno())
            os.replace(temporary, path)
        finally:
            temporary.unlink(missing_ok=True)
