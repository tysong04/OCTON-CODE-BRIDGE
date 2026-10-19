import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, AlertTriangle, Shield, Terminal, X } from 'lucide-react';
import { Header } from './components/Header';
import { LanguageSelector } from './components/LanguageSelector';
import { InstructionsInput } from './components/InstructionsInput';
import { CodeEditor } from './components/CodeEditor';
import { OutputPanel } from './components/OutputPanel';
import { ExplanationCard } from './components/ExplanationCard';
import { ErrorBanner } from './components/ErrorBanner';
import {
  Language,
  HealthResponse,
  ProviderStatusResponse,
  ProviderInfo,
  ApiError,
} from './types/translation';
import { checkHealth, getProviderStatus, translateCode, TranslationApiError } from './services/api';
import './App.css';

export const App: React.FC = () => {
  const [sourceLang, setSourceLang] = useState<Language>('python');
  const [targetLang, setTargetLang] = useState<Language>('javascript');
  const [code, setCode] = useState<string>('');
  const [filename, setFilename] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string>('');

  const [translatedCode, setTranslatedCode] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | undefined>(undefined);

  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [backendHealth, setBackendHealth] = useState<HealthResponse | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [dismissedOfflineWarning, setDismissedOfflineWarning] = useState<boolean>(false);

  // Refresh status
  const refreshStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    setDismissedOfflineWarning(false);
    try {
      const [health, provider] = await Promise.allSettled([
        checkHealth(),
        getProviderStatus(),
      ]);

      if (health.status === 'fulfilled') {
        setBackendHealth(health.value);
      } else {
        setBackendHealth(null);
      }

      if (provider.status === 'fulfilled') {
        setProviderStatus(provider.value);
      } else {
        setProviderStatus(null);
      }
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Swap source & target languages
  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    // If output exists, move translated code to input for roundtrip translation
    if (translatedCode) {
      setCode(translatedCode);
      setTranslatedCode('');
      setFilename(null);
      setExplanation('');
      setWarnings([]);
    }
  };

  // Clear all
  const handleClear = () => {
    setCode('');
    setFilename(null);
    setTranslatedCode('');
    setExplanation('');
    setWarnings([]);
    setError(null);
  };

  // File loaded
  const handleFileLoaded = (fileContent: string, name: string) => {
    setCode(fileContent);
    setFilename(name);
    setError(null);
  };

  // Perform translation
  const handleTranslate = async () => {
    if (!code || !code.trim()) {
      setError({
        message: 'Please paste code or upload a source file before translating.',
        error_type: 'Validation Warning',
      });
      return;
    }

    if (sourceLang === targetLang) {
      setError({
        message: 'Source and target languages must be different.',
        error_type: 'Configuration Warning',
      });
      return;
    }

    setError(null);
    setIsTranslating(true);
    setTranslatedCode('');
    setExplanation('');
    setWarnings([]);

    try {
      const result = await translateCode({
        source_lang: sourceLang,
        target_lang: targetLang,
        code,
        instructions: instructions.trim() ? instructions.trim() : undefined,
      });

      setTranslatedCode(result.translated_code);
      setExplanation(result.explanation);
      setWarnings(result.warnings || []);
      setProviderInfo(result.provider_info);
    } catch (err: unknown) {
      if (err instanceof TranslationApiError) {
        setError({
          message: err.message,
          setup_instructions: err.setup_instructions,
          error_type: err.error_type || 'Translation Error',
        });
      } else {
        setError({
          message: err instanceof Error ? err.message : 'An unexpected error occurred.',
          error_type: 'Application Error',
        });
      }
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="app-container">
      <Header
        backendHealth={backendHealth}
        providerStatus={providerStatus}
        isLoadingStatus={isLoadingStatus}
        onRefreshStatus={refreshStatus}
      />

      {/* Control Toolbar */}
      <div className="control-toolbar">
        <LanguageSelector
          sourceLang={sourceLang}
          targetLang={targetLang}
          onSourceLangChange={(lang) => {
            setSourceLang(lang);
            if (lang === targetLang) {
              setTargetLang(lang === 'python' ? 'javascript' : 'python');
            }
          }}
          onTargetLangChange={(lang) => {
            setTargetLang(lang);
            if (lang === sourceLang) {
              setSourceLang(lang === 'python' ? 'javascript' : 'python');
            }
          }}
          onSwapLanguages={handleSwapLanguages}
          disabled={isTranslating}
        />

        <div className="toolbar-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClear}
            disabled={isTranslating || (!code && !translatedCode)}
            title="Reset editor and translations"
          >
            <RotateCcw size={15} />
            <span>Reset All</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={handleTranslate}
            disabled={isTranslating || !code.trim()}
          >
            <Play size={16} fill="currentColor" />
            <span>{isTranslating ? 'Translating...' : 'Translate Code'}</span>
          </button>
        </div>
      </div>

      {/* Optional Instructions */}
      <InstructionsInput
        value={instructions}
        onChange={setInstructions}
        disabled={isTranslating}
      />

      {/* Error / Alert Display */}
      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {/* Provider Offline Notice if Ollama not ready */}
      {backendHealth && providerStatus && !providerStatus.available && !error && !dismissedOfflineWarning && (
        <div className="banner warning">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="banner-header">
              <AlertTriangle size={18} />
              <span>Local AI Model Offline ({providerStatus.provider}: {providerStatus.model})</span>
            </div>
            <button
              onClick={() => setDismissedOfflineWarning(true)}
              style={{ color: 'inherit', padding: '0.2rem', opacity: 0.8 }}
              title="Dismiss banner"
            >
              <X size={16} />
            </button>
          </div>
          <div>{providerStatus.details}</div>
          {providerStatus.setup_instructions && (
            <div style={{ marginTop: '0.4rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                <Terminal size={14} />
                <span>To enable translation:</span>
              </div>
              <div className="banner-code">{providerStatus.setup_instructions}</div>
            </div>
          )}
        </div>
      )}

      {/* Side-by-side or Stacked Editor Grid */}
      <div className="translator-grid">
        <CodeEditor
          code={code}
          onChange={(newCode) => {
            setCode(newCode);
            if (error) setError(null);
          }}
          onClear={() => {
            setCode('');
            setFilename(null);
          }}
          sourceLang={sourceLang}
          filename={filename}
          onFileLoaded={handleFileLoaded}
          onError={(msg) => setError({ message: msg, error_type: 'File Upload Error' })}
          disabled={isTranslating}
        />

        <OutputPanel
          translatedCode={translatedCode}
          targetLang={targetLang}
          providerInfo={providerInfo}
          isTranslating={isTranslating}
        />
      </div>

      {/* Explanation, Assumptions and Warnings */}
      <ExplanationCard explanation={explanation} warnings={warnings} />

      {/* Footer */}
      <footer className="app-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={14} color="#34d399" />
          <span>Local execution &bull; No code transmitted externally &bull; Privacy preserved</span>
        </div>
        <div>
          <span>OCB v0.1.0 &bull; AI outputs require developer review</span>
        </div>
      </footer>
    </div>
  );
};
