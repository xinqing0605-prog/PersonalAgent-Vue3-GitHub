import unittest
from types import SimpleNamespace as NS
from unittest.mock import patch
from pydantic import ValidationError
from backend.app.main import generate_agent_answer, process_ask, AskRequest

CONNECTION = {"id":"test", "provider":"test", "model":"test", "api_key":"fake", "base_url":"http://127.0.0.1:18765/v1"}
def response(text, reason):
    return NS(choices=[NS(message=NS(content=text, tool_calls=[]), finish_reason=reason)])

class RecordedQARegressions(unittest.TestCase):
    def generate(self, replies):
        calls=[]
        def create(**kwargs):
            calls.append(kwargs)
            answer=replies.pop(0)
            if isinstance(answer, Exception): raise answer
            return answer
        client=NS(chat=NS(completions=NS(create=create)))
        with patch('openai.OpenAI',return_value=client), patch('backend.app.main.load_agent_settings',return_value={"defaults":{"max_tokens":1200}}), patch('backend.app.main.load_custom_model_services',return_value={}):
            result=generate_agent_answer('生成代码',[],[],model_connection=CONNECTION)
        return result,calls
    def test_length_continues_text_without_repeating_tools(self):
        (answer,tools,trace),calls=self.generate([response('```css\n.app {','length'),response('color: red;\n}\n```','stop')])
        self.assertEqual(answer,'```css\n.app {color: red;\n}\n```')
        self.assertEqual(len(calls),2)
        self.assertNotIn('tools',calls[1])
        self.assertEqual(calls[1]['max_tokens'],1200)
        self.assertFalse(trace[-1]['incomplete'])
    def test_continuation_failure_retains_partial_answer(self):
        (answer,tools,trace),calls=self.generate([response('已有代码','length'),RuntimeError('offline')])
        self.assertEqual(answer,'已有代码');self.assertTrue(trace[-1]['incomplete'])
    def test_continuation_is_bounded(self):
        (answer,tools,trace),calls=self.generate([response(str(i),'length') for i in range(4)])
        self.assertEqual(answer,'0123');self.assertEqual(len(calls),4);self.assertTrue(trace[-1]['incomplete'])
    def test_complete_response_does_not_continue(self):
        result,calls=self.generate([response('完整回答','stop')]);self.assertEqual(len(calls),1)
    def test_incomplete_warning_does_not_claim_model_fallback(self):
        with patch('backend.app.main.retrieve',return_value=[]), patch('backend.app.main.message_attachment_context',return_value=('',[])), patch('backend.app.main.resolve_chat_model',return_value=CONNECTION), patch('backend.app.main.generate_agent_answer',return_value=('未完成代码',[],[{'incomplete':True}])):
            result=process_ask(AskRequest(question='生成长代码'),user_id=7)
        self.assertIn('可能不完整',result.warning);self.assertFalse(result.fallback_used)
    def test_question_boundary_is_separate_from_attachment_upload(self):
        self.assertEqual(len(AskRequest(question='字'*1000).question),1000)
        with self.assertRaises(ValidationError):AskRequest(question='字'*1001)
        self.assertEqual(AskRequest(question='',attachment_filenames=['1001字.txt']).question,'')
