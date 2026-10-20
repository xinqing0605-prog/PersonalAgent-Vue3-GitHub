"""Explicit, bounded diagnostics. No third-party tools are executed by the agent."""
from __future__ import annotations

import csv
import io
import json
import os
from pathlib import Path
import queue
import re
import shutil
import subprocess
import tempfile
import threading
import time
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

MAX_MESSAGE = 1_000_000
PROTOCOLS = {"2024-11-05", "2025-03-26", "2025-06-18"}


def _rpc_result(message: object, request_id: int) -> dict:
    if not isinstance(message, dict) or message.get("jsonrpc") != "2.0" or message.get("id") != request_id:
        raise ValueError("MCP 响应标识或协议格式不正确。")
    if "error" in message:
        raise ValueError("MCP 服务返回协议错误，请检查服务端日志。")
    if not isinstance(message.get("result"), dict):
        raise ValueError("MCP 响应缺少有效的 result 对象。")
    return message["result"]


class _StdioConnection:
    def __init__(self, config: dict):
        command = str(config.get("command", "")).strip()
        executable = shutil.which(command) or command
        if not Path(executable).is_file():
            raise ValueError("没有找到 MCP 可执行文件。")
        if Path(executable).suffix.lower() in {".cmd", ".bat"}:
            raise ValueError("连接测试请直接填写 node.exe 或 python.exe，并把脚本路径填在参数中，不执行批处理包装器。")
        self.timeout = min(max(float(config.get("timeout_seconds", 30)), 3), 180)
        # Do not pass the application's API credentials to third-party programs.
        allowed = {"PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "HOME"}
        env = {k: v for k, v in os.environ.items() if k.upper() in allowed}
        env.update(PYTHONIOENCODING="utf-8", PYTHONUTF8="1")
        self.process = subprocess.Popen([executable, *config.get("args", [])], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, env=env, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        self.messages: queue.Queue = queue.Queue(maxsize=128)
        self.stopped = threading.Event()
        self.reader = threading.Thread(target=self._read, daemon=True)
        self.reader.start()

    def _read(self):
        try:
            while not self.stopped.is_set():
                line = self.process.stdout.readline(MAX_MESSAGE + 1)
                if not line:
                    raise ValueError("MCP 进程结束，未返回完整响应。")
                if len(line) > MAX_MESSAGE:
                    raise ValueError("MCP 响应过大。")
                item = json.loads(line.decode("utf-8"))
                self.messages.put(item, timeout=0.5)
        except Exception as exc:
            try:
                self.messages.put_nowait(exc)
            except queue.Full:
                pass

    def call(self, method: str, params: dict | None = None, request_id: int | None = None):
        payload = {"jsonrpc": "2.0", "method": method}
        if params is not None:
            payload["params"] = params
        if request_id is not None:
            payload["id"] = request_id
        self.process.stdin.write((json.dumps(payload, ensure_ascii=False) + "\n").encode("utf-8"))
        self.process.stdin.flush()
        if request_id is None:
            return {}
        deadline = time.monotonic() + self.timeout
        for _ in range(128):
            try:
                message = self.messages.get(timeout=max(0.001, deadline - time.monotonic()))
            except queue.Empty as exc:
                raise ValueError("MCP 连接超时，未收到协议响应。") from exc
            if isinstance(message, Exception):
                raise ValueError("MCP 输出不是有效的协议响应，请检查启动参数。") from message
            if isinstance(message, dict) and message.get("id") == request_id:
                return _rpc_result(message, request_id)
            if time.monotonic() >= deadline:
                break
        raise ValueError("MCP 通知过多或响应超时。")

    def close(self):
        self.stopped.set()
        try:
            self.process.stdin.close()
            self.process.wait(timeout=0.5)
        except (OSError, subprocess.TimeoutExpired):
            self.process.terminate()
            try:
                self.process.wait(timeout=1)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait(timeout=2)
        self.reader.join(timeout=1)
        self.process.stdout.close()


class _HttpConnection:
    def __init__(self, config: dict):
        self.url = str(config.get("url", ""))
        parsed = urlsplit(self.url)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password:
            raise ValueError("MCP 地址必须是无账号密码的 HTTP 或 HTTPS 地址。")
        self.timeout = min(max(float(config.get("timeout_seconds", 30)), 3), 180)
        self.headers = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}

    def call(self, method: str, params: dict | None = None, request_id: int | None = None):
        payload = {"jsonrpc": "2.0", "method": method}
        if params is not None:
            payload["params"] = params
        if request_id is not None:
            payload["id"] = request_id
        request = Request(self.url, data=json.dumps(payload).encode("utf-8"), headers=self.headers, method="POST")
        with urlopen(request, timeout=self.timeout) as response:
            session = response.headers.get("Mcp-Session-Id")
            if session:
                if len(session) > 1024 or not all(33 <= ord(ch) <= 126 for ch in session):
                    raise ValueError("MCP 会话标识无效。")
                self.headers["Mcp-Session-Id"] = session
            if request_id is None:
                return {}
            if "text/event-stream" in response.headers.get("Content-Type", ""):
                data, consumed = [], 0
                deadline = time.monotonic() + self.timeout
                while time.monotonic() < deadline:
                    raw = response.readline(MAX_MESSAGE + 1)
                    consumed += len(raw)
                    if consumed > MAX_MESSAGE:
                        raise ValueError("MCP 响应过大。")
                    if not raw:
                        break
                    line = raw.decode("utf-8").rstrip("\r\n")
                    if line.startswith("data:"):
                        data.append(line[5:].lstrip(" "))
                    elif not line and data:
                        message = json.loads("\n".join(data))
                        data = []
                        if isinstance(message, dict) and message.get("id") == request_id:
                            return _rpc_result(message, request_id)
                raise ValueError("MCP 事件流未返回请求结果。")
            raw = response.read(MAX_MESSAGE + 1)
            if len(raw) > MAX_MESSAGE:
                raise ValueError("MCP 响应过大。")
            return _rpc_result(json.loads(raw.decode("utf-8")), request_id)

    def close(self):
        if "Mcp-Session-Id" in self.headers:
            try:
                with urlopen(Request(self.url, headers=self.headers, method="DELETE"), timeout=min(self.timeout, 2)):
                    pass
            except OSError:
                pass  # Stateless servers and servers without DELETE are supported.


def check_mcp_connection(config: dict) -> dict:
    connection = None
    started = time.monotonic()
    try:
        connection = _StdioConnection(config) if config.get("transport") == "stdio" else _HttpConnection(config)
        initialized = connection.call("initialize", {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "PersonalAgent-Diagnostics", "version": "1.0"}}, 1)
        version = initialized.get("protocolVersion")
        if version not in PROTOCOLS:
            raise ValueError("MCP 服务协议版本暂不兼容。")
        if isinstance(connection, _HttpConnection):
            connection.headers["MCP-Protocol-Version"] = version
        connection.call("notifications/initialized")
        capabilities = initialized.get("capabilities", {})
        tools, cursor = [], None
        if isinstance(capabilities, dict) and "tools" in capabilities:
            for page in range(5):
                result = connection.call("tools/list", {"cursor": cursor} if cursor else {}, page + 2)
                batch = result.get("tools")
                if not isinstance(batch, list) or any(not isinstance(item, dict) or not isinstance(item.get("name"), str) for item in batch):
                    raise ValueError("MCP 工具列表格式无效。")
                tools.extend({"name": item["name"][:120], "description": str(item.get("description", ""))[:300]} for item in batch)
                cursor = result.get("nextCursor")
                if not cursor or len(tools) >= 100:
                    break
        return {"ok": True, "protocol_version": version, "tools": tools[:100], "truncated": bool(cursor) or len(tools) > 100, "duration_ms": round((time.monotonic() - started) * 1000), "message": f"协议握手成功，读取到 {min(len(tools), 100)} 个工具。仅检查连接，未执行任何工具，也未注册到对话。"}
    except ValueError:
        raise
    except (OSError, RuntimeError, TypeError, KeyError) as exc:
        raise RuntimeError("MCP 连接失败，请检查命令、参数、服务状态或认证要求。") from exc
    finally:
        if connection is not None:
            connection.close()


def parse_tesseract_tsv(tsv: str, minimum: float, preserve_layout: bool) -> str:
    lines: dict[tuple, list[str]] = {}
    for row in csv.DictReader(io.StringIO(tsv), delimiter="\t"):
        try:
            confidence = float(row.get("conf", -1)) / 100
        except (ValueError, TypeError):
            continue
        text = (row.get("text") or "").strip()
        if text and confidence >= minimum:
            key = tuple(row.get(field) for field in ("page_num", "block_num", "par_num", "line_num")) if preserve_layout else (0,)
            lines.setdefault(key, []).append(text)
    return "\n".join(" ".join(words) for words in lines.values())


def recognize_image(raw: bytes, config: dict) -> dict:
    if config.get("engine", "auto") not in {"auto", "tesseract"}:
        raise ValueError("当前识别测试支持 Tesseract，请选择自动或 Tesseract。PaddleOCR 和云端接入尚未实现。")
    executable = shutil.which("tesseract")
    if not executable:
        raise ValueError("未安装 Tesseract 或未加入 PATH。安装引擎和所需语言包后重启应用再测试。")
    languages = config.get("languages") or ["chi_sim", "eng"]
    if any(not re.fullmatch(r"[A-Za-z0-9_]{1,30}", str(item)) for item in languages):
        raise ValueError("OCR 语言代码无效。")
    try:
        from PIL import Image
        with Image.open(io.BytesIO(raw)) as source:
            if source.width * source.height > 20_000_000:
                raise ValueError("图片像素过大，请缩小到 2000 万像素以内。")
            source.load()
            picture = source.convert("RGB")
    except Exception as exc:
        raise ValueError("图片无法读取或像素过大，请使用有效的 PNG、JPG 或 WebP 图片。") from exc
    options = {"capture_output": True, "text": True, "encoding": "utf-8", "errors": "replace", "timeout": 30, "creationflags": getattr(subprocess, "CREATE_NO_WINDOW", 0)}
    warnings = []
    with tempfile.TemporaryDirectory(prefix="personal-agent-ocr-") as directory:
        image_path = Path(directory) / "input.png"
        picture.save(image_path)
        try:
            if config.get("detect_orientation"):
                orientation = subprocess.run([executable, str(image_path), "stdout", "--psm", "0"], **options)
                rotation = re.search(r"Rotate:\s*(90|180|270)\b", orientation.stdout)
                if orientation.returncode != 0:
                    warnings.append("方向检测未成功，按原图识别；短文本或缺少 osd 语言包可能导致此情况。")
                elif rotation:
                    picture.rotate(-int(rotation.group(1)), expand=True).save(image_path)
            result = subprocess.run([executable, str(image_path), "stdout", "-l", "+".join(languages), "tsv"], **options)
        except subprocess.TimeoutExpired as exc:
            raise ValueError("OCR 识别超时，请缩小图片后重试。") from exc
        if result.returncode:
            raise ValueError("OCR 引擎执行失败，请检查所选语言包是否安装。")
        text = parse_tesseract_tsv(result.stdout, float(config.get("min_confidence", 0.6)), bool(config.get("preserve_layout", True)))
    return {"ok": True, "engine": "tesseract", "text": text, "warnings": warnings, "message": "识别完成。" if text else "未识别到符合置信度的文字，可尝试清晰图片或降低阈值。"}
