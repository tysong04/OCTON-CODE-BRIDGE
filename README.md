# OCB — Octon Code Bridge

> **Private, local AI-powered code translator between Python and JavaScript.**

OCB is a developer-focused code translation tool designed to translate snippets and single source files cleanly between **Python and JavaScript** in both directions. It emphasizes local AI inference via **Ollama**, ensuring complete data privacy with no external cloud API dependencies or paid subscription keys.

---

## Features

- **Bidirectional Translation**: Seamless conversion between Python 3 and JavaScript (ES6+).
- **Single-File Upload & Paste**: Upload `.py` or `.js` source files (up to 64 KB) or type directly in the editor.
- **Custom Instructions**: Provide fine-grained constraints (e.g., `"use async/await"`, `"prefer arrow functions"`, `"explain assumptions"`).
- **Explanation & Caveats**: Detailed walkthrough of language idiom differences, edge cases, and limitations.
- **Copy & Download**: One-click clipboard copy and file export.
- **Live Connection Indicators**: Instant visibility into FastAPI backend and local Ollama model readiness.
- **Safe & Private**: Runs completely on your machine. Untrusted code is never executed, and source code is never logged.
- **Modular Provider Architecture**: Easily swap between Ollama and mock/offline providers.

---

## Project Structure

```text
OCB/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── LanguageSelector.tsx
│   │   │   ├── InstructionsInput.tsx
│   │   │   ├── FileUploader.tsx
│   │   │   ├── CodeEditor.tsx
│   │   │   ├── OutputPanel.tsx
│   │   │   ├── ExplanationCard.tsx
│   │   │   └── ErrorBanner.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── translation.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env.example
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── translation.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── translation_service.py
│   │   │   └── translators/
│   │   │       ├── __init__.py
│   │   │       ├── base.py
│   │   │       ├── mock.py
│   │   │       └── ollama.py
│   │   ├── config.py
│   │   └── main.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── test_health.py
│   │   ├── test_mock_translation.py
│   │   ├── test_provider_status.py
│   │   └── test_translation_validation.py
│   ├── requirements.txt
│   └── .env.example
├── docs/
│   └── ARCHITECTURE.md
├── .gitignore
└── README.md
```

---

## Quickstart & Launch Guide (Windows)

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ (tested on Node.js v24)
- [Ollama](https://ollama.com) (optional for running the app, required for live AI translation)

---

### 1. Backend Setup

Open a PowerShell terminal in the project root:

```powershell
# Navigate to backend directory
cd backend

# (Optional) Create and activate a virtual environment:
python -m venv .venv
.venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

The backend will be available at:
- **API Health**: `http://localhost:8000/api/health`
- **Provider Status**: `http://localhost:8000/api/providers/status`
- **Interactive OpenAPI Docs**: `http://localhost:8000/docs`

---

### 2. Frontend Setup

In a separate PowerShell terminal:

```powershell
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will start at `http://localhost:5173`. Open this URL in your browser.

---

### 3. Setting Up Ollama (For Local AI Translation)

OCB defaults to the state-of-the-art coding model **`qwen2.5-coder:7b`** via Ollama:

1. **Download and Install Ollama**:
   Download installer from [https://ollama.com](https://ollama.com) and install it on Windows.

2. **Pull the Model**:
   Open a terminal and run:
   ```powershell
   ollama pull qwen2.5-coder:7b
   ```
   *(Alternatively, for lighter hardware: `ollama pull qwen2.5-coder:1.5b` or `ollama pull codellama`)*

3. **Configure Custom Model (Optional)**:
   If you wish to use a different model, set `OLLAMA_MODEL` in `backend/.env`:
   ```ini
   PROVIDER_TYPE=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=qwen2.5-coder:7b
   ```

*Note: The application starts and runs cleanly even if Ollama is not installed or running. The UI will display the offline status with instructions.*

---

## Running Automated Tests

### Backend Tests (Pytest)
```powershell
python -m pytest backend/tests -v
```

All 12 backend test cases run without needing Ollama:
- Endpoint health and root route verification
- Request schema validation (empty code, whitespace-only code, size bounds)
- Unsupported and identical language pair rejections
- Offline provider detection and graceful 503 response handling
- Full bidirectional Python <-> JavaScript translation via mock provider

### Frontend Typecheck & Build
```powershell
cd frontend
npm run build
```

---

## Security & Privacy Policy

- **No Code Execution**: Neither frontend nor backend ever evaluates, executes, or runs translated or uploaded code.
- **No Third-Party Transmission**: All AI inference executes locally via Ollama. Code is not transmitted to external cloud APIs.
- **Safe Logging**: User code and instructions are stripped from server log outputs.
- **Model Disclaimers**: Machine-generated translations may contain subtle semantic differences. Always review generated code prior to production use.
