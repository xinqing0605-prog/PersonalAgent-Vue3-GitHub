import unittest

from fastapi.testclient import TestClient

from backend.app.main import app


class ApiSecurityTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_health_endpoint(self) -> None:
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_key_reveal_is_denied_for_non_local_clients(self) -> None:
        response = self.client.post("/api/model-services/deepseek/reveal-key")
        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
