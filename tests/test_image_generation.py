import json
import unittest
from unittest.mock import patch

from backend.app.main import generate_image_answer, is_image_model, looks_like_image_request


class _Response:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self, _limit):
        return json.dumps(self.payload).encode("utf-8")


class ImageGenerationTests(unittest.TestCase):
    connection = {
        "provider": "Qwen",
        "model": "z-image-turbo",
        "base_url": "https://maas.qianwenapi.com/compatible-mode/v1",
        "api_key": "sk-test",
    }

    def test_image_request_and_model_are_detected(self):
        self.assertTrue(is_image_model(self.connection))
        self.assertTrue(looks_like_image_request("生成一个黑色衣服的美女图片"))

    def test_qwen_native_response_is_renderable(self):
        payload = {"output": {"choices": [{"message": {"content": [{"image": "https://img.example.com/a.png"}]}}]}}
        with patch("backend.app.main.urlopen", return_value=_Response(payload)) as mocked:
            answer, images = generate_image_answer("生成一张海报", self.connection)

        request = mocked.call_args.args[0]
        body = json.loads(request.data.decode("utf-8"))
        self.assertEqual(request.full_url, "https://maas.qianwenapi.com/api/v1/services/aigc/multimodal-generation/generation")
        self.assertEqual(body["model"], "z-image-turbo")
        self.assertEqual(body["input"]["messages"][0]["content"][0]["text"], "生成一张海报")
        self.assertEqual(answer, "已生成图片。")
        self.assertEqual(images, ["https://img.example.com/a.png"])

    def test_compatible_gateway_can_fallback_to_openai_image_route(self):
        calls = []

        def fake_urlopen(request, timeout=120):
            calls.append((request.full_url, json.loads(request.data.decode("utf-8"))))
            if len(calls) == 1:
                from urllib.error import HTTPError

                raise HTTPError(request.full_url, 404, "not found", {}, _Response({"error": "unsupported"}))
            return _Response({"data": [{"b64_json": "a" * 128}]})

        with patch("backend.app.main.urlopen", side_effect=fake_urlopen):
            _answer, images = generate_image_answer("画一只猫", self.connection)

        self.assertEqual(len(calls), 2)
        self.assertEqual(calls[1][0], "https://maas.qianwenapi.com/compatible-mode/v1/images/generations")
        self.assertTrue(images[0].startswith("data:image/png;base64,"))


if __name__ == "__main__":
    unittest.main()
