# OCB (Octon Code Bridge) — Architecture & Design Specification

## Overview

**OCB (Octon Code Bridge)** is an open, developer-centric, privacy-first code translation tool designed to perform accurate translations between Python and JavaScript (in both directions). It is built for snippets and single source files, prioritizing local AI execution (via Ollama) so user code is never exposed to third-party cloud APIs.

---

## High-Level System Architecture

```text
┌────────────────────────────────────────────────────────┐
│               Frontend (React 18 + TS + Vite)          │
│   - Split-Pane Editor / Output with Stats & Samples    │
│   - Single-File Uploader (.py / .js with size limits)   │
│   - Live Backend & Provider Status Badges              │
│   - Copy & Download Handlers                           │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON (REST API)
                            ▼
┌────────────────────────────────────────────────────────┐
│               Backend (Python 3.14 + FastAPI)          │
│   - Input Validation (Pydantic schemas)                │
│   - Safe Logging (code content & secrets redacted)     │
│   - Size & Language Pair Validation                    │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│ OllamaTranslationProvider │ │  MockTranslationProvider  │
│ - Local LLM Daemon        │ │ - Fast, deterministic     │
│ - http://localhost:11434  │ │   offline test suite      │
│ - e.g. qwen2.5-coder:7b   │ │ - Zero setup required     │
└───────────────────────────┘ └───────────────────────────┘
```

---

## Modular Provider Interface

All AI translation integrations inherit from `BaseTranslationProvider`:

```python
class BaseTranslationProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Name of provider ('ollama', 'mock')."""
        pass

    @abstractmethod
    async def get_status(self) -> ProviderStatusResponse:
        """Check provider connectivity and model existence."""
        pass

    @abstractmethod
    async def translate(
        self,
        source_lang: Language,
        target_lang: Language,
        code: str,
        instructions: Optional[str] = None
    ) -> TranslationResult:
        """Execute translation between language pair."""
        pass
```

### Providers Implemented:
1. **`OllamaTranslationProvider`**:
   - Queries Ollama's `/api/tags` endpoint to detect daemon liveness and verify that the target model is installed.
   - Dispatches prompt to `/api/generate` with strict JSON constraints.
   - Parses code, explanations, and warnings, falling back to fence extraction if needed.
   - Never fails silently: returns exact step-by-step shell commands (`ollama pull <model>`) if the service or model is missing.
2. **`MockTranslationProvider`**:
   - Provides deterministic translation and mock status toggling for automated CI/CD and offline unit testing without requiring GPU or Ollama runtime.

---

## Security & Privacy Considerations

1. **Zero Untrusted Execution**:
   - Neither the backend nor the frontend ever executes, evals, or compiles user code or translated code.
   - Uploaded files are strictly parsed as raw text.
2. **Data Minimization & Redaction**:
   - Source code snippets and custom instruction prompts are excluded from backend application logs. Only metadata (e.g. byte length, language pair) is logged.
3. **Strict Validation**:
   - Hard limits on code snippet size (64 KB maximum).
   - Validation against empty payloads, identical language pairs, and unsupported language extensions.
4. **No Third-Party Telemetry**:
   - No external trackers, advertising scripts, or remote cloud telemetry.
