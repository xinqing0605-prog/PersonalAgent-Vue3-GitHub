import base64
from contextlib import ExitStack
from http.server import ThreadingHTTPServer
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
from types import SimpleNamespace
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

from fastapi.testclient import TestClient
import backend.app.auth as auth
import backend.app.main as main
import backend.app.user_storage as storage
from backend.app.integration_checks import check_mcp_connection, parse_tesseract_tsv, recognize_image
from scripts.qa_services import Handler


class CompletionAuditTests(unittest.TestCase):
    def setUp(self):
        self.scope = ExitStack()
        self.addCleanup(self.scope.close)
        root = Path(self.scope.enter_context(tempfile.TemporaryDirectory()))
        for target, name, value in [(auth, 'AUTH_DB_PATH', root / 'auth.db'), (storage, 'ROOT_DIR', root), (storage, 'USERS_ROOT', root / 'users'), (storage, 'LEGACY_USER_ID', 999)]:
            self.scope.enter_context(patch.object(target, name, value))
        self.client = self.scope.enter_context(TestClient(main.app))
        self.assertEqual(self.client.post('/api/auth/register', json={'username': 'QaA0907', 'password': 'Test0907!Aa'}).status_code, 200)

    def connection(self):
        return {'id': 'qa', 'provider': 'QA', 'model': 'qa-chat', 'base_url': 'http://127.0.0.1:8765/v1', 'api_key': 'qa-local'}

    def test_long_history_valid_and_excessive_input_rejected(self):
        self.assertEqual(len(main.ChatMessage(role='assistant', content='a' * 15000).content), 15000)
        response = self.client.post('/api/ask', json={'question': '继续', 'history': [{'role': 'assistant', 'content': 'a' * 20001}]})
        self.assertEqual(response.status_code, 422)

    def test_current_question_is_last_and_history_is_bounded(self):
        completion = SimpleNamespace(create=lambda **kwargs: self.capture(kwargs))
        with patch('openai.OpenAI', return_value=SimpleNamespace(chat=SimpleNamespace(completions=completion))):
            main.generate_agent_answer('今天的三个最小行动', [], [main.ChatMessage(role='assistant', content='旧附件QA-OLD' * 2000)], model_connection=self.connection())
        self.assertTrue(self.captured['messages'][-1]['content'].endswith('今天的三个最小行动'))
        self.assertLessEqual(len(self.captured['messages'][-2]['content']), 12000)
        self.assertNotIn('extra_body', self.captured)
        self.assertIn('用户已经转到新话题', self.captured['messages'][1]['content'])

    def capture(self, kwargs):
        self.captured = kwargs
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content='测试回答', tool_calls=[]))])

    def test_long_single_paragraph_chunk_budget_and_overlap(self):
        text = ''.join(chr(0x4e00 + i) for i in range(700))
        chunks = main.split_knowledge_text(text, main.KnowledgeBaseSettings(chunk_size=128, chunk_overlap=20))
        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(main.estimate_text_tokens(chunk) <= 128 for chunk in chunks))
        self.assertEqual(chunks[0][-20:], chunks[1][:20])
        self.assertTrue(chunks[-1].endswith(text[-1]))

    def test_gateway_retries_transient_but_not_auth_failure(self):
        response = SimpleNamespace(read=lambda *_: b'{"data": []}', __enter__=lambda s:s, __exit__=lambda *args:False)
        from unittest.mock import MagicMock
        success = MagicMock(); success.__enter__.return_value.read.return_value = b'{"data": []}'
        with patch.object(main, 'urlopen', side_effect=[HTTPError('http://qa', 503, 'fail', {}, None), success]) as call, patch.object(main.time, 'sleep'):
            self.assertEqual(main._read_json_url('http://qa', max_retries=1), {'data': []})
            self.assertEqual(call.call_count, 2)
        with patch.object(main, 'urlopen', side_effect=HTTPError('http://qa', 401, 'fail', {}, None)) as call:
            with self.assertRaises(RuntimeError): main._read_json_url('http://qa', max_retries=5)
            self.assertEqual(call.call_count, 1)

    def test_gateway_chat_applies_timeout_retries(self):
        client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=lambda **kwargs:self.capture(kwargs))))
        with patch('openai.OpenAI', return_value=client) as factory, patch.object(main, 'load_custom_model_services', return_value={'qa': {'gateway_profile': True}}), patch.object(main, 'load_agent_settings', return_value={'defaults': {}, 'gateway': {'timeout_seconds': 9, 'max_retries': 0}}):
            main.generate_agent_answer('测试', [], [], model_connection=self.connection())
        self.assertEqual(factory.call_args.kwargs['timeout'], 9)
        self.assertEqual(factory.call_args.kwargs['max_retries'], 0)

    def test_write_is_not_replayed_when_next_model_round_fails(self):
        tool = SimpleNamespace(id='call-1', function=SimpleNamespace(name='create_task', arguments='{"title":"QA"}'))
        response = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content='', tool_calls=[tool]))])
        from unittest.mock import Mock
        client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=Mock(side_effect=[response, RuntimeError('model failed')]))))
        with patch('openai.OpenAI', return_value=client), patch.object(main, 'execute_tool', return_value={'success': True}) as execute:
            answer, tools, _ = main.generate_agent_answer('创建QA待办', [], [], model_connection=self.connection())
        self.assertIn('部分操作已执行', answer)
        self.assertEqual(execute.call_count, 1)

    def test_stdio_real_handshake_lists_tools(self):
        script = Path(__file__).resolve().parents[1] / 'scripts' / 'qa_services.py'
        result = check_mcp_connection({'transport': 'stdio', 'command': sys.executable, 'args': [str(script), '--stdio'], 'timeout_seconds': 3})
        self.assertTrue(result['ok'])
        self.assertEqual(result['tools'][0]['name'], 'qa_echo')

    def test_http_real_handshake_lists_tools(self):
        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            result = check_mcp_connection({'transport': 'streamable_http', 'url': f'http://127.0.0.1:{server.server_port}/mcp', 'timeout_seconds': 3})
            self.assertEqual(result['tools'][0]['name'], 'qa_echo')
        finally:
            server.shutdown(); server.server_close(); thread.join(timeout=2)

    def test_mcp_whitespace_name_and_disabled_connection_rejected(self):
        response = self.client.put('/api/agent-settings/mcp', json={'servers': [{'name': '   ', 'command': sys.executable}]})
        self.assertEqual(response.status_code, 400)
        response = self.client.put('/api/agent-settings/mcp', json={'servers': [{'id': 'qa', 'name': 'QA', 'command': sys.executable, 'enabled': False}]})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.post('/api/agent-settings/mcp/qa/connect').status_code, 400)

    def test_ocr_language_validation(self):
        self.assertEqual(self.client.put('/api/agent-settings/ocr', json={'languages': ['eng', '--bad']}).status_code, 400)
        self.assertEqual(self.client.put('/api/agent-settings/ocr', json={'languages': ['eng', 'eng']}).json()['settings']['ocr']['languages'], ['eng'])

    def test_ocr_confidence_filter_and_layout(self):
        data = 'page_num\tblock_num\tpar_num\tline_num\tconf\ttext\n1\t1\t1\t1\t90\tQA\n1\t1\t1\t1\t20\tnoise\n1\t1\t1\t2\t99\t0907\n'
        self.assertEqual(parse_tesseract_tsv(data, .6, True), 'QA\n0907')
        self.assertEqual(parse_tesseract_tsv(data, .6, False), 'QA 0907')

    def test_ocr_real_image_pipeline_with_stub_engine(self):
        from PIL import Image
        blob = io.BytesIO(); Image.new('RGB', (50, 50), 'white').save(blob, format='PNG')
        tsv = 'page_num\tblock_num\tpar_num\tline_num\tconf\ttext\n1\t1\t1\t1\t99\tQA-OCR-0907\n'
        with patch('backend.app.integration_checks.shutil.which', return_value='tesseract.exe'), patch('backend.app.integration_checks.subprocess.run', return_value=SimpleNamespace(returncode=0, stdout=tsv)) as run:
            result = recognize_image(blob.getvalue(), {'engine':'auto', 'languages':['eng'], 'detect_orientation':False})
        self.assertEqual(result['text'], 'QA-OCR-0907')
        self.assertIn('tsv', run.call_args.args[0])
        self.assertFalse(Path(run.call_args.args[0][1]).exists())

    def test_ocr_missing_engine_and_invalid_format_visible(self):
        with patch('backend.app.integration_checks.shutil.which', return_value=None):
            response = self.client.post('/api/agent-settings/ocr/recognize', json={'filename':'qa.png', 'data_base64':base64.b64encode(b'qa').decode()})
        self.assertEqual(response.status_code, 400)
        self.assertIn('未安装', response.json()['detail'])
        self.assertEqual(self.client.post('/api/agent-settings/ocr/recognize', json={'filename':'qa.exe','data_base64':'YQ=='}).status_code, 400)

    def test_diagnostic_endpoints_require_login(self):
        with TestClient(main.app) as anonymous:
            self.assertEqual(anonymous.post('/api/agent-settings/mcp/qa/connect').status_code, 401)
            self.assertEqual(anonymous.post('/api/agent-settings/ocr/recognize', json={'filename':'qa.png','data_base64':'YQ=='}).status_code, 401)


if __name__ == '__main__':
    unittest.main()
