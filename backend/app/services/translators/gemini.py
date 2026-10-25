import json
import logging
import re
import time
from typing import Optional, List, Dict, Any
import httpx

from app.schemas.translation import (
    Language,
    ProviderStatusResponse,
    ProviderTestResponse,
    ModelOption,
)
from app.services.translators.base import (
    BaseTranslationProvider,
    TranslationResult,
    ProviderUnavailableError,
    TranslationExecutionError,
)

logger = logging.getLogger("ocb.translators.gemini")

DEFAULT_GEMINI_MODEL = "gemini-3.8-flash"
FALLBACK_SUGGESTIONS = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-pro", "gemini-flash-latest"]
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"


class GeminiTranslationProvider(BaseTranslationProvider):
    def __init__(
        self,
        api_key: str,
        model: Optional[str] = None,
        timeout: float = 60.0
    ):
        if not api_key or not api_key.strip():
            raise ProviderUnavailableError(
                message="Google Gemini API key is required.",
                setup_instructions="Provide your Google Gemini API key in Provider Settings (get a free key at https://aistudio.google.com)."
            )
        self.api_key = api_key.strip()
        self.model = (model or DEFAULT_GEMINI_MODEL).strip()
        self.timeout = timeout

    @property
    def name(self) -> str:
        return "gemini"

    async def get_status(self) -> ProviderStatusResponse:
        """Verify API key validity and model accessibility with Google Gemini REST API."""
        test_result = await self.test_connection()
        return ProviderStatusResponse(
            provider="gemini",
            available=test_result.valid,
            model=self.model,
            details=test_result.message,
            setup_instructions=test_result.details if not test_result.valid else None
        )

    async def test_connection(self) -> ProviderTestResponse:
        """
        Actively test the Gemini API key against Google's models discovery endpoint.
        Dynamically discovers models supporting generateContent and verifies accessibility.
        Does NOT expose the API key in error messages or logs.
        """
        # Endpoint: GET /v1beta/models
        url = f"{GEMINI_API_BASE}/models"
        headers = {
            "x-goog-api-key": self.api_key,
            "User-Agent": "OCB-OctonCodeBridge/0.1.0"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=headers)

                if res.status_code == 200:
                    data = res.json()
                    raw_models = data.get("models", [])

                    # Dynamically filter models supporting generateContent
                    available_options: List[ModelOption] = []
                    available_ids: List[str] = []
                    for m in raw_models:
                        methods = m.get("supportedGenerationMethods", [])
                        if "generateContent" in methods:
                            full_name = m.get("name", "")
                            m_id = full_name.replace("models/", "").strip()
                            d_name = m.get("displayName", m_id)
                            available_options.append(ModelOption(id=m_id, label=f"{d_name} ({m_id})"))
                            available_ids.append(m_id)

                    if not available_ids:
                        return ProviderTestResponse(
                            valid=False,
                            provider="gemini",
                            model=self.model,
                            message="API key verified, but no models supporting 'generateContent' were returned.",
                            details="Ensure Generative Language API is enabled on your project in Google Cloud / AI Studio.",
                            error_type="NoAvailableModels",
                            available_models=[]
                        )

                    # Check if configured model is in the available list
                    clean_model = self.model.replace("models/", "").strip()
                    model_found = clean_model in available_ids or any(
                        m.endswith(f"/{clean_model}") for m in available_ids
                    )

                    if clean_model and not model_found:
                        # Recommend a model that actually exists in available_ids, NOT the failed model
                        recommended = "gemini-3.8-flash" if "gemini-3.8-flash" in available_ids else available_ids[0]
                        sample_available = [m for m in available_ids if m != clean_model][:4]
                        return ProviderTestResponse(
                            valid=False,
                            provider="gemini",
                            model=self.model,
                            message=f"Model '{self.model}' is not available for this API key. Recommended alternative: '{recommended}'.",
                            details=f"Your key has access to {len(available_ids)} models, including: {', '.join(sample_available)}. Please select an active model in settings.",
                            error_type="ModelUnavailable",
                            available_models=available_options
                        )

                    return ProviderTestResponse(
                        valid=True,
                        provider="gemini",
                        model=self.model,
                        message=f"Connected successfully to Google Gemini. Verified access to {len(available_ids)} active models.",
                        details=None,
                        error_type=None,
                        available_models=available_options
                    )

                elif res.status_code in (400, 401):
                    return ProviderTestResponse(
                        valid=False,
                        provider="gemini",
                        model=self.model,
                        message="Invalid Google Gemini API key.",
                        details="Please verify your API key from Google AI Studio (https://aistudio.google.com).",
                        error_type="InvalidApiKey"
                    )
                elif res.status_code == 403:
                    return ProviderTestResponse(
                        valid=False,
                        provider="gemini",
                        model=self.model,
                        message="API key forbidden or permission denied.",
                        details="Ensure the API key has Generative Language API enabled and is not IP or referer restricted.",
                        error_type="Forbidden"
                    )
                elif res.status_code == 429:
                    return ProviderTestResponse(
                        valid=False,
                        provider="gemini",
                        model=self.model,
                        message="Gemini API rate limit or quota exceeded.",
                        details="Check your current quota in Google AI Studio or wait before retrying.",
                        error_type="QuotaExceeded"
                    )
                else:
                    return ProviderTestResponse(
                        valid=False,
                        provider="gemini",
                        model=self.model,
                        message=f"Gemini API returned HTTP {res.status_code}.",
                        details="An unexpected response was received from Google Gemini.",
                        error_type="HttpError"
                    )

        except (httpx.ConnectError, httpx.NetworkError):
            return ProviderTestResponse(
                valid=False,
                provider="gemini",
                model=self.model,
                message="Cannot connect to Google Gemini API.",
                details="Network connection failed. Check your internet access and proxy settings.",
                error_type="NetworkError"
            )
        except httpx.TimeoutException:
            return ProviderTestResponse(
                valid=False,
                provider="gemini",
                model=self.model,
                message="Connection to Google Gemini API timed out.",
                details="Request exceeded 10 seconds. Check network latency.",
                error_type="Timeout"
            )
        except Exception as e:
            logger.exception("Unexpected error during Gemini connection test")
            return ProviderTestResponse(
                valid=False,
                provider="gemini",
                model=self.model,
                message="Connection test failed due to an unexpected error.",
                details=f"Error type: {type(e).__name__}",
                error_type="UnexpectedError"
            )

    async def translate(
        self,
        source_lang: Language,
        target_lang: Language,
        code: str,
        instructions: Optional[str] = None
    ) -> TranslationResult:
        url = f"{GEMINI_API_BASE}/models/{self.model}:generateContent"
        headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json",
            "User-Agent": "OCB-OctonCodeBridge/0.1.0"
        }

        prompt = self._build_prompt(source_lang, target_lang, code, instructions)

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }

        start_time = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(url, headers=headers, json=payload)

                if res.status_code != 200:
                    self._handle_http_error(res)

                data = res.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    block_reason = data.get("promptFeedback", {}).get("blockReason", "Unknown")
                    raise TranslationExecutionError(
                        f"Gemini did not return any translation candidates (Block reason: {block_reason})."
                    )

                part_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if not part_text:
                    raise TranslationExecutionError("Gemini returned an empty response.")

        except httpx.ConnectError as e:
            raise ProviderUnavailableError(
                "Unable to connect to Google Gemini API. Please check your internet connection.",
                "Ensure your machine has internet access to reach https://generativelanguage.googleapis.com"
            ) from e
        except httpx.ReadTimeout as e:
            raise TranslationExecutionError(
                f"Translation timed out after {self.timeout}s while waiting for Google Gemini response."
            ) from e
        except (ProviderUnavailableError, TranslationExecutionError):
            raise
        except Exception as e:
            raise TranslationExecutionError(
                f"Unexpected error communicating with Google Gemini: {type(e).__name__}"
            ) from e

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        translated_code, explanation, warnings = self._parse_response(part_text, source_lang, target_lang)
        warnings.append("AI translations may contain subtle behavioral differences. Review before running.")

        return TranslationResult(
            translated_code=translated_code,
            explanation=explanation,
            warnings=warnings,
            model=self.model,
            provider_name="gemini",
            execution_time_ms=round(elapsed_ms, 2)
        )

    def _handle_http_error(self, res: httpx.Response) -> None:
        if res.status_code in (400, 401):
            raise ProviderUnavailableError(
                "Google Gemini rejected the request: Invalid API key.",
                "Verify your API key from Google AI Studio (https://aistudio.google.com)."
            )
        elif res.status_code == 403:
            raise TranslationExecutionError(
                "Google Gemini request forbidden or quota suspended for this API key."
            )
        elif res.status_code == 404:
            alt_candidates = [m for m in FALLBACK_SUGGESTIONS if m != self.model]
            suggestions = f" (such as {', '.join(alt_candidates[:2])})" if alt_candidates else ""
            raise TranslationExecutionError(
                f"Configured Gemini model '{self.model}' was not found or is unavailable for your API key. "
                f"Please open Provider Settings to select an active model{suggestions} or click 'Test Connection' to refresh your available models."
            )
        elif res.status_code == 429:
            raise TranslationExecutionError(
                "Google Gemini API rate limit or quota exceeded. Please wait a moment before trying again."
            )
        elif res.status_code >= 500:
            raise TranslationExecutionError(
                f"Google Gemini service is temporarily unavailable (HTTP {res.status_code})."
            )
        else:
            raise TranslationExecutionError(
                f"Gemini API returned an unexpected error (HTTP {res.status_code})."
            )

    def _build_prompt(
        self,
        source_lang: Language,
        target_lang: Language,
        code: str,
        instructions: Optional[str]
    ) -> str:
        guidance = instructions.strip() if instructions else "Produce clean, idiomatic, and modern code."
        return (
            f"You are an expert compiler engineer and software architect specializing in translating between {source_lang.value} and {target_lang.value}.\n"
            f"Task: Translate the given {source_lang.value} source code snippet into clean, idiomatic {target_lang.value}.\n\n"
            f"User constraints / instructions: {guidance}\n\n"
            f"Respond strictly with valid JSON conforming to the following schema:\n"
            f"{{\n"
            f'  "translated_code": "string containing pure translated code",\n'
            f'  "explanation": "concise overview of key language idiom changes and assumptions",\n'
            f'  "warnings": ["list of important behavioral caveats, missing library equivalents, or type differences"]\n'
            f"}}\n\n"
            f"--- SOURCE CODE ({source_lang.value}) ---\n"
            f"{code}\n"
            f"--- END SOURCE CODE ---\n"
        )

    def _parse_response(
        self,
        text: str,
        source_lang: Language,
        target_lang: Language
    ) -> tuple[str, str, List[str]]:
        try:
            parsed = json.loads(text.strip())
            if isinstance(parsed, dict) and "translated_code" in parsed:
                translated_code = str(parsed.get("translated_code", ""))
                explanation = str(parsed.get("explanation", "Translation completed."))
                warnings = parsed.get("warnings", [])
                if not isinstance(warnings, list):
                    warnings = [str(warnings)] if warnings else []
                return translated_code, explanation, [str(w) for w in warnings]
        except json.JSONDecodeError:
            pass

        # Fallback if model output contained markdown code fences
        fence_match = re.search(r"```(?:[a-zA-Z0-9_\-\+]+)?\s*([\s\S]*?)```", text)
        if fence_match:
            translated_code = fence_match.group(1).strip()
            explanation = re.sub(r"```[\s\S]*?```", "", text).strip() or f"Translated from {source_lang.value} to {target_lang.value}."
            return translated_code, explanation, ["Parsed code from markdown output."]

        return text.strip(), f"Translated from {source_lang.value} to {target_lang.value}.", ["Raw model response parsed."]
