from __future__ import annotations

import json
from pathlib import Path
import sys


ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from backend.app.settings import SETTINGS  # noqa: E402


def main() -> int:
    errors = SETTINGS.errors()
    payload = SETTINGS.safe_summary()
    payload["valid"] = not errors
    payload["errors"] = errors
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
