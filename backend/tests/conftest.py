import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.translation_service import get_translation_service, TranslationService
from app.services.translators.mock import MockTranslationProvider


@pytest.fixture
def client():
    """Synchronous test client for FastAPI endpoints."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def mock_service():
    """Provides a TranslationService configured with MockTranslationProvider."""
    service = get_translation_service()
    mock_provider = MockTranslationProvider(is_available=True)
    service.set_provider(mock_provider)
    yield service
    # Reset to default
    service.set_provider(service._create_default_provider())
