import unittest
from types import SimpleNamespace
from unittest.mock import patch

from backend.app.main import AskRequest, WRITE_TOOL_NAMES, generate_agent_answer, process_ask


class FakeCompletions:
    def __init__(self) -> None:
        self.last_tools = []

    def create(self, **kwargs):
        self.last_tools = kwargs.get("tools", [])
        message = SimpleNamespace(content="测试回答", tool_calls=[])
        return SimpleNamespace(choices=[SimpleNamespace(message=message)])


class FakeClient:
    def __init__(self) -> None:
        self.chat = SimpleNamespace(completions=FakeCompletions())


class AgentTraceTests(unittest.TestCase):
    def test_trace_records_llm_round_and_plan_tool_policy(self) -> None:
        fake_client = FakeClient()
        with patch("openai.OpenAI", return_value=fake_client):
            answer, tools_used, trace = generate_agent_answer(
                "请先规划学习任务",
                [],
                [],
                execution_mode="plan",
                model_connection={
                    "id": "test",
                    "provider": "test",
                    "model": "test-model",
                    "api_key": "test-key",
                    "base_url": "https://example.test/v1",
                },
            )
        tool_names = {tool["function"]["name"] for tool in fake_client.chat.completions.last_tools}
        self.assertEqual(answer, "测试回答")
        self.assertEqual(tools_used, [])
        self.assertTrue(WRITE_TOOL_NAMES.isdisjoint(tool_names))
        self.assertEqual(trace[0]["type"], "llm")
        self.assertEqual(trace[0]["round"], 1)
        self.assertEqual(trace[0]["tool_calls"], [])

    def test_process_ask_reports_actual_model_origin(self) -> None:
        connection = {
            "id": "deepseek",
            "provider": "DeepSeek",
            "model": "deepseek-chat",
            "api_key": "test-key",
            "base_url": "https://example.test/v1",
        }
        request = AskRequest(question="请介绍你能做什么", chat_model_id="deepseek")
        with (
            patch("backend.app.main.retrieve", return_value=[{"title": "资料", "content": "内容"}]),
            patch("backend.app.main.message_attachment_context", return_value=("", [])),
            patch("backend.app.main.resolve_chat_model", return_value=connection),
            patch("backend.app.main.generate_agent_answer", return_value=("模型回答", [], [{"type": "llm"}])),
        ):
            result = process_ask(request, user_id=7)
        self.assertEqual(result.answer_origin, "model")
        self.assertTrue(result.knowledge_used)
        self.assertEqual(result.model_id, "deepseek")
        self.assertEqual(result.provider, "DeepSeek")
        self.assertEqual(result.model, "deepseek-chat")

    def test_attachment_only_question_is_valid_and_sources_are_preserved(self) -> None:
        connection = {
            "id": "deepseek",
            "provider": "DeepSeek",
            "model": "deepseek-chat",
            "api_key": "test-key",
            "base_url": "https://example.test/v1",
        }
        source = {
            "title": "测试库 / 验收资料",
            "content": "验收编号 QA-884",
            "knowledge_base_id": "kb-1",
            "filename": "验收资料.docx",
            "chunk_index": 2,
            "score": 9.5,
        }
        request = AskRequest(question="", conversation_id="chat-1", attachment_filenames=["验收资料.docx"])
        with (
            patch("backend.app.main.retrieve", return_value=[source]),
            patch("backend.app.main.message_attachment_context", return_value=("附件正文", [])),
            patch("backend.app.main.resolve_chat_model", return_value=connection),
            patch("backend.app.main.generate_agent_answer", return_value=("附件回答", [], [])) as generate,
        ):
            result = process_ask(request, user_id=7)
        self.assertEqual(generate.call_args.args[0], "请阅读并说明随本条消息发送的附件内容。")
        self.assertEqual(result.sources[0].filename, "验收资料.docx")
        self.assertEqual(result.sources[0].chunk_index, 2)

    def test_model_status_answer_is_not_mislabeled_as_model_generated(self) -> None:
        connection = {
            "id": "deepseek",
            "provider": "DeepSeek",
            "model": "deepseek-chat",
            "api_key": "test-key",
            "base_url": "https://example.test/v1",
        }
        request = AskRequest(question="当前使用的模型是什么", chat_model_id="deepseek")
        with (
            patch("backend.app.main.retrieve", return_value=[]),
            patch("backend.app.main.message_attachment_context", return_value=("", [])),
            patch("backend.app.main.resolve_chat_model", return_value=connection),
            patch("backend.app.main.generate_agent_answer") as generate,
        ):
            result = process_ask(request, user_id=7)
        generate.assert_not_called()
        self.assertEqual(result.answer_origin, "status")
        self.assertFalse(result.knowledge_used)

    def test_local_fallback_does_not_claim_model_generation(self) -> None:
        connection = {
            "id": "deepseek",
            "provider": "DeepSeek",
            "model": "deepseek-chat",
            "api_key": "test-key",
            "base_url": "https://example.test/v1",
        }
        request = AskRequest(question="普通问题", chat_model_id="deepseek")
        with (
            patch("backend.app.main.retrieve", return_value=[]),
            patch("backend.app.main.message_attachment_context", return_value=("", [])),
            patch("backend.app.main.resolve_chat_model", return_value=connection),
            patch("backend.app.main.generate_agent_answer", side_effect=RuntimeError("boom")),
            patch("backend.app.main.build_answer", return_value=("本地回答", False)),
        ):
            result = process_ask(request, user_id=7)
        self.assertEqual(result.answer_origin, "local_fallback")
        self.assertEqual(result.mode, "retrieval")


if __name__ == "__main__":
    unittest.main()
