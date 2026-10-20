"""Create a clean GitHub source ZIP without demo data, runtime state or release artifacts."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ROOT_FILES = (
    "README.md", "Dockerfile", "netlify.toml", "render.yaml",
    ".gitignore", ".dockerignore", ".gitattributes",
    ".env.example", ".env.local.example", ".env.test.example", ".env.production.example",
)
DIRECTORIES = (".github", "backend", "frontend-vue", "desktop", "deploy", "tests", "docs")
SCRIPT_FILES = (
    "build_netlify_entry.cjs", "check_environment.py", "check_release.py",
    "export_github_source.py", "package_desktop_demo.ps1", "qa_services.py",
    "run_checks.ps1", "run_local.ps1", "run_production.ps1", "run_test_server.ps1",
    "setup_local.ps1", "smoke_web.py", "test_chat_history.cjs",
    "zip_desktop.py", "run_vue.ps1",
)
TEXT_EXTENSIONS = {".py", ".html", ".css", ".js", ".cjs", ".md", ".json", ".yml",
                   ".yaml", ".toml", ".txt", ".ps1", ".bat", ".cmd", ".vue", ".ts"}
BLOCKED_PARTS = {
    ".git", ".venv", "__pycache__", "node_modules", ".runtime", "data",
    "knowledge", "notes", "workspace", "desktop-data", "dist", "build",
    "work", "交付", "eval", "test-results", "playwright-report", ".vite",
}
SECRET = re.compile(
    r"sk-[A-Za-z0-9_-]{24,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}"
    r"|AKIA[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"
)


def source_files() -> list[Path]:
    files = [ROOT / name for name in ROOT_FILES if (ROOT / name).is_file()]
    for directory in DIRECTORIES:
        for path in (ROOT / directory).rglob("*"):
            relative = path.relative_to(ROOT)
            if path.is_file() and not path.is_symlink() and path.suffix in TEXT_EXTENSIONS:
                if not any(part in BLOCKED_PARTS for part in relative.parts):
                    files.append(path)
    for name in ("frontend-vue/.gitignore", "deploy/.env.web.example", "deploy/.env.modelscope.example", "deploy/Caddyfile.example"):
        path = ROOT / name
        if path.is_file():
            files.append(path)
    for name in SCRIPT_FILES:
        path = ROOT / "scripts" / name
        if path.is_file():
            files.append(path)
    return sorted(set(files), key=lambda p: p.relative_to(ROOT).as_posix())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output", type=Path,
        default=ROOT / "交付" / "PersonalAgent-GitHub-source.zip",
    )
    args = parser.parse_args()
    output = args.output.resolve()
    if not output.is_relative_to(ROOT):
        raise SystemExit("Output must remain inside the project.")
    files = source_files()
    manifest: dict[str, str] = {}
    for path in files:
        relative = path.relative_to(ROOT).as_posix()
        data = path.read_bytes()
        if SECRET.search(data.decode("utf-8-sig")):
            raise SystemExit(f"Possible credential in {relative}; export stopped (value hidden).")
        manifest[relative] = hashlib.sha256(data).hexdigest()

    output.parent.mkdir(parents=True, exist_ok=True)
    pending = output.with_suffix(".pending.zip")
    with zipfile.ZipFile(pending, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, path.relative_to(ROOT).as_posix())
        archive.writestr(
            "SOURCE-MANIFEST.json",
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        )
    with zipfile.ZipFile(pending) as archive:
        if archive.testzip():
            raise SystemExit("ZIP integrity check failed.")
        for relative, expected in manifest.items():
            if hashlib.sha256(archive.read(relative)).hexdigest() != expected:
                raise SystemExit(f"ZIP hash mismatch: {relative}")
    pending.replace(output)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    print(json.dumps({
        "file": str(output),
        "source_files": len(files),
        "contains_demo_data": False,
        "sha256": digest,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
