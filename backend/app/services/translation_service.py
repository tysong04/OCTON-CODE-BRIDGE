import logging
from typing import Optional
from app.config import settings
from app.schemas.translation import (
    TranslationRequest,
    TranslationResponse,
    ProviderStatusResponse,
    ProviderInfo,
)
from app.services.translators.base import (
    BaseTranslationProvider,
    ProviderUnavailableError,
    TranslationExecutionError,
)
from app.services.translators.mock import MockTranslationProvider
from app.services.translators.ollama import OllamaTranslationProvider

logger = logging.getLogger("ocb.services.translation")


class TranslationService:
    def __init__(self, provider: Optional[BaseTranslationProvider] = None):
        if provider:
            self.provider = provider
        else:
            self.provider = self._create_default_provider()

    def _create_default_provider(self) -> BaseTranslationProvider:
        provider_type = settings.PROVIDER_TYPE.lower().strip()
        if provider_type == "mock":
            logger.info("Initializing TranslationService with MockTranslationProvider")
            return MockTranslationProvider()
        else:
            logger.info("Initializing TranslationService with OllamaTranslationProvider (model: %s)", settings.OLLAMA_MODEL)
            return OllamaTranslationProvider(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.OLLAMA_MODEL,
                timeout=settings.OLLAMA_TIMEOUT_SECONDS
            )

    def set_provider(self, provider: BaseTranslationProvider) -> None:
        """Dynamically replace provider (useful for testing or configuration switching)."""
        self.provider = provider

    async def get_status(self) -> ProviderStatusResponse:
        """Retrieve live health and readiness of current translation provider."""
        return await self.provider.get_status()

    async def translate(self, request: TranslationRequest) -> TranslationResponse:
        """
        Orchestrate translation through the configured provider.
        Does NOT log code contents or instructions for privacy and security.
        """
        logger.info(
            "Translation requested: %s -> %s (code_size=%d bytes, instructions=%s)",
            request.source_lang.value,
            request.target_lang.value,
            len(request.code.encode("utf-8")),
            "provided" if request.instructions else "none"
        )

        result = await self.provider.translate(
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            code=request.code,
            instructions=request.instructions
        )

        return TranslationResponse(
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            translated_code=result.translated_code,
            explanation=result.explanation,
            warnings=result.warnings,
            provider_info=ProviderInfo(
                provider=result.provider_name or self.provider.name,
                model=result.model,
                execution_time_ms=result.execution_time_ms,
                verified=False  # Crucial: Never claim AI generated code is verified
            )
        )


_service_instance: Optional[TranslationService] = None


def get_translation_service() -> TranslationService:
    global _service_instance
    if _service_instance is None:
        _service_instance = TranslationService()
    return _service_instance
