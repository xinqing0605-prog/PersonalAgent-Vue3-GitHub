"""Start the Vue browser-test backend with a fresh, isolated account directory."""
from pathlib import Path
import os
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
if not (ROOT / "frontend-vue/dist/index.html").is_file():
    raise SystemExit("Run npm run build before browser tests.")
WORK = ROOT / "work"
WORK.mkdir(exist_ok=True)
sys.path.insert(0, str(ROOT))

with tempfile.TemporaryDirectory(prefix="vue-browser-qa-", dir=WORK) as directory:
    data = Path(directory).resolve()
    assert data.is_relative_to(WORK.resolve())
    os.environ.update(
        APP_ENV="test", APP_DEBUG="false", AGENT_ROOT_DIR=str(ROOT),
        AGENT_RUNTIME_DIR=str(data / "data"), AUTH_DB_PATH=str(data / "auth.db"),
        AGENT_USER_DATA_ROOT=str(data / "users"), AGENT_LEGACY_USER_ID="0",
        ALLOWED_HOSTS="localhost,127.0.0.1", ALLOWED_ORIGINS="http://127.0.0.1:18883",
        SESSION_COOKIE_SECURE="false", SESSION_COOKIE_DOMAIN="",
        ALLOW_KEY_REVEAL="false", ALLOW_SHARED_MODEL_CREDENTIALS="false",
        SMS_PROVIDER="disabled", SMS_DEV_MODE="false",
    )
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=18883, log_level="warning")
