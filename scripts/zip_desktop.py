"""Archive a fresh desktop staging directory and verify every entry."""
import hashlib
import os
from pathlib import Path
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
stage = Path(sys.argv[1]).resolve()
assert stage.is_relative_to(root) and stage != root
assert (stage / "PersonalAgent/PersonalAgent.exe").is_file()
assert (stage / "PersonalAgent/_internal/frontend/index.html").read_bytes() == (root / "frontend-vue/dist/index.html").read_bytes()
files = sorted(p for p in stage.rglob("*") if p.is_file())
for path in files:
    assert not path.is_symlink()
    assert not any(part in {"desktop-data", ".env", "auth.db", "data", "users"} for part in path.relative_to(stage).parts)
out = Path(os.environ.get("DESKTOP_ZIP_OUTPUT", root / "交付/PersonalAgent-Windows-demo.zip")).resolve()
if not out.is_relative_to(root):
    raise SystemExit("Desktop ZIP output must remain inside the project.")
out.parent.mkdir(exist_ok=True)
pending = out.with_suffix(".pending.zip")
with zipfile.ZipFile(pending, "w", zipfile.ZIP_DEFLATED) as archive:
    for path in files:
        archive.write(path, path.relative_to(stage).as_posix())
with zipfile.ZipFile(pending) as archive:
    assert archive.testzip() is None
    for path in files:
        assert hashlib.sha256(archive.read(path.relative_to(stage).as_posix())).digest() == hashlib.sha256(path.read_bytes()).digest()
pending.replace(out)
print("Desktop ZIP verified:", len(files), "files;", out.stat().st_size, "bytes")
print("SHA256:", hashlib.sha256(out.read_bytes()).hexdigest())
