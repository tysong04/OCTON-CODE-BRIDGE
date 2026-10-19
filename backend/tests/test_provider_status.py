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
