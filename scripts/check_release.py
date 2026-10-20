"""Check copied deployment sources and restart persistence without real user data."""
from __future__ import annotations
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def run(args, *, cwd, env, success=True):
    result = subprocess.run(args, cwd=cwd, env=env, text=True, encoding="utf-8", capture_output=True, timeout=90)
    if (result.returncode == 0) != success:
        print(result.stdout)
        print(result.stderr)
        raise SystemExit("Release check failed.")
    if success:
        print(result.stdout.strip())


def main():
    work = ROOT / "work"
    work.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="release-check-", dir=work) as temporary:
        base = Path(temporary)
        source = base / "app"
        source.mkdir()
        # Node builds the frontend in Docker's first stage. Test the same
        # compiled artifacts here without requiring a local Docker daemon.
        compiled = ROOT / "frontend-vue" / "dist"
        if not (compiled / "index.html").is_file():
            raise SystemExit("Build frontend-vue first: npm ci && npm run build")
        for src, dest in ((ROOT / "backend", source / "backend"),
                          (compiled, source / "frontend")):
            shutil.copytree(src, dest, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
        for relative in ("desktop/instance_guard.py", "deploy/container_entrypoint.py"):
            target = source / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / relative, target)
        env = {k: v for k, v in os.environ.items()
               if not k.startswith(("AGENT_", "APP_", "AUTH_", "SMS_", "SESSION_", "ALLOW_", "DEEPSEEK_", "PYTHONPATH"))}
        volume = base / "persistent"
        env.update(
            APP_ENV="production", APP_DEBUG="false", AGENT_ROOT_DIR=str(source),
            AGENT_RUNTIME_DIR=str(volume / "data"), AUTH_DB_PATH=str(volume / "auth.db"),
            AGENT_USER_DATA_ROOT=str(volume / "users"), AGENT_LEGACY_USER_ID="0",
            SESSION_COOKIE_SECURE="true", SESSION_COOKIE_SAMESITE="lax", SESSION_COOKIE_DOMAIN="",
            ALLOWED_HOSTS="demo.example.test,localhost,127.0.0.1",
            ALLOWED_ORIGINS="https://demo.example.test", ALLOW_KEY_REVEAL="false",
            ALLOW_SHARED_MODEL_CREDENTIALS="false", SMS_PROVIDER="disabled", SMS_DEV_MODE="false",
            PYTHONDONTWRITEBYTECODE="1", PYTHONUTF8="1",
        )
        # A new process has no cached auth/settings objects from the previous one.
        for phase in ("create", "restore"):
            run([sys.executable, "-B", "-c", (ROOT / "scripts/smoke_web.py").read_text(encoding="utf-8"), phase],
                cwd=source, env=env)
        assert not (source / "data").exists(), "Runtime data escaped the persistent directory"
        assert not (source / "notes").exists(), "First account used legacy app directory"
        node = shutil.which("node")
        if not node:
            raise SystemExit("Node.js is required to check the Netlify entry.")
        scripts = base / "scripts"
        scripts.mkdir()
        entry = scripts / "build_netlify_entry.cjs"
        shutil.copy2(ROOT / "scripts/build_netlify_entry.cjs", entry)
        env.pop("DEMO_APP_URL", None)
        run([node, str(entry)], cwd=base, env=env, success=False)
        env["DEMO_APP_URL"] = "https://demo.example.test"
        for key in ("URL", "DEPLOY_PRIME_URL", "DEPLOY_URL"):
            env.pop(key, None)
        run([node, str(entry)], cwd=base, env=env)
        assert (base / "dist/netlify-entry/_redirects").read_text() == "/ https://demo.example.test/ 302!\n"
        env["URL"] = env["DEMO_APP_URL"]
        run([node, str(entry)], cwd=base, env=env, success=False)
    print("Release source / restart / Netlify checks passed; temporary data removed.")


if __name__ == "__main__":
    main()
