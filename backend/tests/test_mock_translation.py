from fastapi.testclient import TestClient


def test_mock_translation_python_to_javascript(client: TestClient, mock_service):
    payload = {
        "source_lang": "python",
        "target_lang": "javascript",
        "code": "def greet(name):\n    print('Hello ' + name)\n    return True",
        "instructions": "use modern ES6 style"
    }
    response = client.post("/api/translate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["source_lang"] == "python"
    assert data["target_lang"] == "javascript"
    assert "console.log" in data["translated_code"]
    assert "true" in data["translated_code"]
    assert "explanation" in data
    assert len(data["explanation"]) > 0
    assert len(data["warnings"]) > 0

    # Ensure provider_info never claims code is formally verified
    assert "provider_info" in data
    assert data["provider_info"]["verified"] is False
    assert data["provider_info"]["provider"] == "mock"


def test_mock_translation_javascript_to_python(client: TestClient, mock_service):
    payload = {
        "source_lang": "javascript",
        "target_lang": "python",
        "code": "function isReady() {\n    console.log('ready');\n    return true;\n}",
    }
    response = client.post("/api/translate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["source_lang"] == "javascript"
    assert data["target_lang"] == "python"
    assert "print" in data["translated_code"]
    assert "True" in data["translated_code"]
    assert data["provider_info"]["verified"] is False
