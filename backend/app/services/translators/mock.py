import time
import re
from typing import Optional, List
from app.schemas.translation import Language, ProviderStatusResponse
from app.services.translators.base import (
    BaseTranslationProvider,
    TranslationResult,
    ProviderUnavailableError
)


class MockTranslationProvider(BaseTranslationProvider):
    def __init__(self, is_available: bool = True, model_name: str = "mock-model-v1"):
        self._is_available = is_available
        self._model_name = model_name

    @property
    def name(self) -> str:
        return "mock"

    def set_available(self, available: bool) -> None:
        self._is_available = available

    async def get_status(self) -> ProviderStatusResponse:
        if not self._is_available:
            return ProviderStatusResponse(
                provider="mock",
                available=False,
                model=self._model_name,
                details="Mock provider is configured to simulate an unavailable state.",
                setup_instructions="Set mock provider availability to True."
            )
        return ProviderStatusResponse(
            provider="mock",
            available=True,
            model=self._model_name,
            details="Mock provider is active for unit testing and offline development.",
            setup_instructions=None
        )

    async def translate(
        self,
        source_lang: Language,
        target_lang: Language,
        code: str,
        instructions: Optional[str] = None
    ) -> TranslationResult:
        if not self._is_available:
            raise ProviderUnavailableError(
                message="Mock translation provider is offline or disabled.",
                setup_instructions="Enable mock provider availability in settings or tests."
            )

        start_time = time.perf_counter()

        # Deterministic simple transform for testing
        translated = code
        warnings: List[str] = [
            "Generated with Mock Translation Provider for offline testing.",
            "Manual review recommended before executing or deploying translated code."
        ]
        explanation_items = [
            f"Simulated translation from {source_lang.value} to {target_lang.value}."
        ]

        if source_lang == Language.PYTHON and target_lang == Language.JAVASCRIPT:
            # print("hello") -> console.log("hello");
            translated = re.sub(r'print\((.*)\)', r'console.log(\1);', translated)
            # def func(a, b): -> function func(a, b) { ... }
            translated = re.sub(r'def\s+([a-zA-Z_]\w*)\s*\((.*?)\):', r'function \1(\2) {', translated)
            # True / False / None -> true / false / null
            translated = re.sub(r'\bTrue\b', 'true', translated)
            translated = re.sub(r'\bFalse\b', 'false', translated)
            translated = re.sub(r'\bNone\b', 'null', translated)
            explanation_items.append("Converted Python `print` statements to JavaScript `console.log`.")
            explanation_items.append("Converted Python boolean/None literals to JavaScript equivalents.")

        elif source_lang == Language.JAVASCRIPT and target_lang == Language.PYTHON:
            # console.log("hello"); -> print("hello")
            translated = re.sub(r'console\.log\((.*?)\);?', r'print(\1)', translated)
            # function func(a, b) { -> def func(a, b):
            translated = re.sub(r'function\s+([a-zA-Z_]\w*)\s*\((.*?)\)\s*\{', r'def \1(\2):', translated)
            # true / false / null -> True / False / None
            translated = re.sub(r'\btrue\b', 'True', translated)
            translated = re.sub(r'\bfalse\b', 'False', translated)
            translated = re.sub(r'\bnull\b', 'None', translated)
            explanation_items.append("Converted JavaScript `console.log` to Python `print`.")
            explanation_items.append("Converted JavaScript literals to Python `True`/`False`/`None`.")

        if instructions:
            explanation_items.append(f"Applied instructions: '{instructions}'.")

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return TranslationResult(
            translated_code=translated,
            explanation="\n".join(explanation_items),
            warnings=warnings,
            model=self._model_name,
            provider_name="mock",
            execution_time_ms=round(elapsed_ms, 2)
        )
