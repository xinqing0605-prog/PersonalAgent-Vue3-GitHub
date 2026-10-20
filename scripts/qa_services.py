"""Offline fixtures for manual QA. Loopback only; no real model or account data.

python scripts/qa_services.py --port 18765
python scripts/qa_services.py --stdio
"""
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import sys


def rpc(message):
    method = message.get("method")
    if method == "initialize":
        result = {"protocolVersion": "2025-06-18", "capabilities": {"tools": {}}, "serverInfo": {"name": "QA offline fixture", "version": "1.0"}}
    elif method == "tools/list":
        result = {"tools": [{"name": "qa_echo", "description": "只用于测试连接，不执行文件操作。", "inputSchema": {"type": "object", "properties": {"text": {"type": "string"}}}}]}
    else:
        return None
    return {"jsonrpc": "2.0", "id": message.get("id"), "result": result}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass  # Do not log prompts, credentials or personal data.

    def reply(self, code, data=None):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8") if data is not None else b""
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        if self.path in {"/v1/models", "/models"}:
            self.reply(200, {"data": [{"id": "qa-chat"}, {"id": "qa-fail"}]})
        elif self.path == "/api/tags":
            self.reply(200, {"models": [{"name": "qa-local", "size": 1024}]})
        else:
            self.reply(404, {"error": "QA route not found"})

    def do_POST(self):
        size = int(self.headers.get("Content-Length", 0))
        if size > 2_000_000:
            return self.reply(413)
        try:
            payload = json.loads(self.rfile.read(size))
        except ValueError:
            return self.reply(400, {"error": "invalid JSON"})
        if self.path == "/mcp":
            result = rpc(payload)
            return self.reply(200 if result else 202, result)
        if self.path == "/v1/chat/completions":
            if payload.get("model") == "qa-fail":
                return self.reply(503, {"error": {"message": "Deliberate QA failure"}})
            latest = payload.get("messages", [{}])[-1].get("content", "")
            if isinstance(latest, list):
                latest = next((part.get("text", "") for part in latest if part.get("type") == "text"), "")
            current = str(latest).split("用户当前问题（请直接回答这一条）：")[-1]
            answer = "QA 模拟服务已接收当前问题：" + current[:400]
            if "代码" in current:
                answer = '```js\nconst message = "QA-CODE-0907";\nconsole.log(message);\n```'
            return self.reply(200, {"id": "qa-response", "object": "chat.completion", "model": payload.get("model"), "choices": [{"index": 0, "message": {"role": "assistant", "content": answer}, "finish_reason": "stop"}], "usage": {"prompt_tokens": 10, "completion_tokens": 10, "total_tokens": 20}})
        self.reply(404)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=18765)
    parser.add_argument("--stdio", action="store_true")
    args = parser.parse_args()
    if args.stdio:
        for line in sys.stdin:
            result = rpc(json.loads(line))
            if result:
                print(json.dumps(result, ensure_ascii=False), flush=True)
    else:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
        print(f"QA 服务运行中 http://127.0.0.1:{args.port}，Ctrl+C 停止；这不是实际 AI 模型。", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()
