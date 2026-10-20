"""Start the single-instance web app after preparing its mounted data paths."""
from pathlib import Path
import os
import sys


def main():
    directories = {
        Path(os.environ["AGENT_RUNTIME_DIR"]),
        Path(os.environ["AUTH_DB_PATH"]).parent,
        Path(os.environ["AGENT_USER_DATA_ROOT"]),
    }
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
    if hasattr(os, "geteuid") and os.geteuid() == 0:
        # Only own the configured directories, never recursively rewrite user files.
        for directory in directories:
            os.chown(directory, 1000, 1000)
        os.setgroups([])
        os.setgid(1000)
        os.setuid(1000)
        os.environ["HOME"] = "/home/agent"
    for directory in directories:
        if not os.access(directory, os.W_OK):
            raise SystemExit(f"Data directory is not writable: {directory}")
    os.execvp(sys.executable, [
        sys.executable, "-B", "-m", "uvicorn", "backend.app.main:app",
        "--host", "0.0.0.0", "--port", os.environ.get("PORT", "8000"),
        "--workers", "1",
    ])


if __name__ == "__main__":
    main()
