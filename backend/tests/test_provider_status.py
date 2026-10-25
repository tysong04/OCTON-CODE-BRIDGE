from fastapi.testclient import TestClient
from app.services.translation_service import get_translation_service
from app.services.translators.mock import MockTranslationProvider


def test_provider_status_available(client: TestClient, mock_service):
    response = client.get("/api/providers/status")
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "mock"
    assert data["available"] is True
    assert "model" in data


def test_provider_status_unavailable_handling(client: TestClient):
    service = get_translation_service()
    mock_provider = MockTranslationProvider(is_available=False, model_name="mock-model-offline")
    service.set_provider(mock_provider)

    try:
        # Check /api/providers/status
        status_res = client.get("/api/providers/status")
        assert status_res.status_code == 200
        data = status_res.json()
        assert data["available"] is False
        assert data["setup_instructions"] is not None

        # Attempt translation while provider is unavailable -> Expect 503
        payload = {
            "source_lang": "python",
            "target_lang": "javascript",
            "code": "print('hello')",
        }
        trans_res = client.post("/api/translate", json=payload)
        assert trans_res.status_code == 503
        error_detail = trans_res.json()["detail"]
        assert error_detail["error_type"] == "ProviderUnavailable"
        assert "setup_instructions" in error_detail

    finally:
        # Clean up
        service.set_provider(MockTranslationProvider(is_available=True))


def test_normalize_ollama_tag():
    from app.services.translators.ollama import normalize_ollama_tag

    assert normalize_ollama_tag("qwen2.5-coder:7b") == ("qwen2.5-coder", "7b")
    assert normalize_ollama_tag("qwen2.5-coder") == ("qwen2.5-coder", "latest")
    assert normalize_ollama_tag("registry.ollama.ai/library/qwen2.5-coder:7b") == ("qwen2.5-coder", "7b")
    assert normalize_ollama_tag("library/llama3.2:latest") == ("llama3.2", "latest")
    assert normalize_ollama_tag("  QWEN2.5-CODER:7B  ") == ("qwen2.5-coder", "7b")


def test_matches_ollama_model_prevents_false_positives():
    from app.services.translators.ollama import matches_ollama_model

    # Target: 7b
    # Should match identical tags and namespaced tags
    assert matches_ollama_model("qwen2.5-coder:7b", "qwen2.5-coder:7b") is True
    assert matches_ollama_model("qwen2.5-coder:7b", "registry.ollama.ai/library/qwen2.5-coder:7b") is True
    assert matches_ollama_model("qwen2.5-coder:7b", "library/qwen2.5-coder:7b") is True

    # Critical bug fix check: 7b should NOT match 1.5b, 32b, or other parameter sizes
    assert matches_ollama_model("qwen2.5-coder:7b", "qwen2.5-coder:1.5b") is False
    assert matches_ollama_model("qwen2.5-coder:7b", "qwen2.5-coder:32b") is False
    assert matches_ollama_model("qwen2.5-coder:7b", "qwen2.5-coder:latest") is False

    # Substring checks: llama3 should not match llama3.2
    assert matches_ollama_model("llama3", "llama3.2:latest") is False
    assert matches_ollama_model("llama3:latest", "llama3:latest") is True
    assert matches_ollama_model("llama3", "llama3:latest") is True

