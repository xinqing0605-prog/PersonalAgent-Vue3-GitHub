"""Knowledge sources: bulk deletion and account-owned note snapshots."""
import base64
import io
from PIL import Image
import unittest

from fastapi.testclient import TestClient
from pydantic import ValidationError
import backend.app.main as main
import test_knowledge_model_catalog as fixtures


class KnowledgeSourcesTests(unittest.TestCase):
    def setUp(self):
        fixtures.KnowledgeModelCatalogTests.setUp(self)
        response = self.client.post("/api/knowledge-bases", json={"name": "资料库"})
        self.assertEqual(response.status_code, 200, response.text)
        self.base_id = response.json()["id"]
        self.url = f"/api/knowledge-bases/{self.base_id}"

    def documents(self):
        return self.client.get(self.url + "/documents").json()["documents"]

    def upload(self, count):
        files = [{"filename": f"资料-{i}.md", "data_base64": base64.b64encode(f"知识库测试内容 {i}".encode()).decode()} for i in range(count)]
        response = self.client.post(self.url + "/documents", json={"files": files})
        self.assertEqual(response.status_code, 200, response.text)
        return [item["filename"] for item in response.json()]

    def delete(self, filenames):
        return self.client.request("DELETE", self.url + "/documents", json={"filenames": filenames})

    def note(self, client=None, title="售后笔记"):
        response = (client or self.client).post("/api/notes", json={"title": title, "content": "售后服务期限为三十天。"})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["id"]

    def test_delete_all_more_than_eight_and_persist_count(self):
        names = self.upload(30)
        response = self.delete(names)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertCountEqual(response.json()["deleted"], names)
        self.assertEqual(self.documents(), [])
        self.assertEqual(self.client.get("/api/knowledge-bases").json()[0]["document_count"], 0)
        self.assertEqual(self.delete(names).json()["deleted"], [])

    def test_delete_validates_entire_batch_before_removal(self):
        names = self.upload(2)
        response = self.delete([names[0], "../escape.md"])
        self.assertEqual(response.status_code, 400)
        self.assertCountEqual([x["filename"] for x in self.documents()], names)
        self.assertEqual(len(self.delete([names[0], names[0]]).json()["deleted"]), 1)

    def test_knowledge_limit_is_independent_of_chat_attachment_limit(self):
        names = [f"file-{i}.md" for i in range(100)]
        self.assertEqual(self.delete(names).status_code, 200)
        self.assertEqual(self.delete(names + ["extra.md"]).status_code, 422)
        self.assertEqual(self.delete([]).status_code, 422)
        with self.assertRaises(ValidationError):
            main.DeleteFilesRequest(filenames=names[:9])

    def test_import_note_snapshot_preview_chunks_and_preserve_original(self):
        note_id = self.note()
        response = self.client.post(self.url + "/notes", json={"note_ids": [note_id, note_id]})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(len(response.json()), 1)
        filename = response.json()[0]["filename"]
        source = self.client.get(self.url + f"/documents/{filename}/source")
        self.assertEqual(source.status_code, 200, source.text)
        self.assertIn("售后服务期限为三十天", source.json()["content"])
        chunks = self.client.get(self.url + f"/documents/{filename}/chunks")
        self.assertEqual(chunks.status_code, 200, chunks.text)
        self.assertGreater(chunks.json()["total"], 0)
        imported_again = self.client.post(self.url + "/notes", json={"note_ids": [note_id]})
        self.assertEqual(imported_again.status_code, 200)
        self.assertNotEqual(filename, imported_again.json()[0]["filename"])
        self.assertEqual(len(self.documents()), 2)
        self.delete([item["filename"] for item in self.documents()])
        original = self.client.get("/api/notes").json()["notes"]
        self.assertEqual(original[0]["id"], note_id)
        self.assertIn("售后服务期限为三十天", original[0]["content"])

    def test_imported_note_keeps_owned_image_after_original_note_deleted(self):
        output = io.BytesIO()
        Image.new("RGB", (32, 24), "teal").save(output, format="PNG")
        source = "data:image/png;base64," + base64.b64encode(output.getvalue()).decode()
        image = self.client.post("/api/images/import", json={"source": source})
        self.assertEqual(image.status_code, 200, image.text)
        image_url = image.json()["url"]
        created = self.client.post("/api/notes", json={"title": "插图说明", "content": f"正文关键词\n![插图]({image_url})"})
        self.assertEqual(created.status_code, 200)
        note_id = created.json()["id"]
        imported = self.client.post(self.url + "/notes", json={"note_ids": [note_id]})
        self.assertEqual(imported.status_code, 200, imported.text)
        filename = imported.json()[0]["filename"]
        self.assertIn(image_url, self.client.get(self.url + f"/documents/{filename}/source").json()["content"])
        self.assertEqual(len(self.client.get("/api/notes?query=正文关键词").json()["notes"]), 1)
        self.assertEqual(self.client.delete(f"/api/notes/{note_id}").status_code, 200)
        self.assertEqual(self.client.get(image_url).content, output.getvalue())
        self.assertIn(image_url, self.client.get(self.url + f"/documents/{filename}/source").json()["content"])
        other = TestClient(main.app)
        other.post("/api/auth/register", json={"username": "imageother", "password": "Safe1234!"})
        self.assertEqual(other.get(image_url).status_code, 404)

    def test_missing_note_batch_does_not_import_partial_data(self):
        note_id = self.note()
        response = self.client.post(self.url + "/notes", json={"note_ids": [note_id, "missing.md"]})
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.documents(), [])
        self.assertEqual(self.client.post(self.url + "/notes", json={"note_ids": []}).status_code, 422)

    def test_note_and_knowledge_base_account_isolation(self):
        other = TestClient(main.app)
        self.assertEqual(other.post("/api/auth/register", json={"username": "othernotes", "password": "Safe1234!"}).status_code, 200)
        foreign_note = self.note(other, "其他账户笔记")
        response = self.client.post(self.url + "/notes", json={"note_ids": [foreign_note]})
        self.assertEqual(response.status_code, 404)
        own_note = self.note()
        self.assertEqual(other.post(self.url + "/notes", json={"note_ids": [own_note]}).status_code, 404)
        names = self.upload(9)
        self.assertEqual(other.request("DELETE", self.url + "/documents", json={"filenames": names}).status_code, 404)
        self.assertEqual(len(self.documents()), 9)


if __name__ == "__main__":
    unittest.main()
