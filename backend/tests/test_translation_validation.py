from fastapi.testclient import TestClient


def test_empty_code_rejected(client: TestClient):
    payload = {
        "source_lang": "python",
        "target_lang": "javascript",
        "code": "",
    }
    response = client.post("/api/translate", json=payload)
    assert response.status_code == 422


def test_whitespace_only_code_rejected(client: TestClient):
    payload = {
        "source_lang": "python",
        "target_lang": "javascript",
        "code": "    \n\t   ",
    }
    response = client.post("/api/translate", json=payload)
    assert response.status_code == 422


def test_unsupported_source_language_rejected(client: TestClient):
    payload = {
        "source_lang": "ruby",
        "target_lang": "javascript",
        "code": "puts 'hello'",
    }
    response = client.post("/api/translate", json=payload)
    assert response.status_code == 422


def test_unsupported_target_language_rejected(client: TestClient):
    payload = {
        "source_lang": "python",
        "target_lang": "csharp",
        "code": "print('hello')",
    }
    response = client.post("/api/translate", json=payload)
    assert response.status_code == 422


def test_identical_languages_rejected(client: TestClient):
    payload = {
        "source_lang": "python",
        "target_lang": "python",
        "code": "print('hello')",
    }
    response = client.post("/api/translate", json=payload)
    assert response.status_code == 422


def test_code_exceeding_max_size_rejected(client: TestClient):
    huge_code = "x = 1\n" * 15000  # > 65536 bytes
    payload = {
        "source_lang": "python",
        "target_lang": "javascript",
        "code": huge_code,
    }
    response = client.post("/api/translate", json=payload)
    assert response.status_code == 422
