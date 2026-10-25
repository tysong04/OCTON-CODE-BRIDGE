import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  AlertTriangle,
  AlertCircle,
  Key,
  Eye,
  EyeOff,
  Cpu,
  Cloud,
  FlaskConical,
  RotateCw,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { ProviderConfig, ProviderTestResponse, ProviderType, ModelOption } from '../types/translation';
import { testProvider } from '../services/api';

interface ProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ProviderConfig;
  onSaveConfig: (newConfig: ProviderConfig) => void;
  onClearKey: () => void;
}

const DEFAULT_GEMINI_MODELS: ModelOption[] = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Recommended - Advanced Coding & High Speed)' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (High Throughput & Efficiency)' },
  { id: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro (Deep Logical & Architectural Reasoning)' },
  { id: 'gemini-flash-latest', label: 'Gemini Flash Latest (Dynamic Alias)' },
];

export const ProviderSettingsModal: React.FC<ProviderSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onClearKey,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>(config.provider);
  const [apiKey, setApiKey] = useState<string>(config.api_key || '');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [geminiModels, setGeminiModels] = useState<ModelOption[]>(DEFAULT_GEMINI_MODELS);
  const [geminiModel, setGeminiModel] = useState<string>(
    config.provider === 'gemini' && config.model ? config.model : 'gemini-3.8-flash'
  );
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState<string>(
    config.base_url || 'http://localhost:11434'
  );
  const [ollamaModel, setOllamaModel] = useState<string>(
    config.provider === 'ollama' && config.model ? config.model : 'qwen2.5-coder:7b'
  );
  const [consentGranted, setConsentGranted] = useState<boolean>(config.consent_granted);

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<ProviderTestResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state whenever modal opens or parent config changes
  useEffect(() => {
    if (isOpen) {
      setSelectedProvider(config.provider);
      setApiKey(config.api_key || '');
      setConsentGranted(config.consent_granted);
      if (config.provider === 'gemini' && config.model) {
        setGeminiModel(config.model);
      } else if (config.provider === 'ollama' && config.model) {
        setOllamaModel(config.model);
      }
      if (config.base_url) {
        setOllamaBaseUrl(config.base_url);
      }
      setTestResult(null);
      setValidationError(null);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setValidationError(null);
    setIsTesting(true);
    setTestResult(null);

    try {
      let model = geminiModel;
      let baseUrl = undefined;

      if (selectedProvider === 'ollama') {
        model = ollamaModel;
        baseUrl = ollamaBaseUrl;
      } else if (selectedProvider === 'mock') {
        model = 'mock-translator';
      }

      if (selectedProvider === 'gemini' && !apiKey.trim()) {
        setValidationError('Please enter a Gemini API key before testing connection.');
        setIsTesting(false);
        return;
      }

      const res = await testProvider({
        provider: selectedProvider,
        api_key: selectedProvider === 'gemini' ? apiKey.trim() : undefined,
        model,
        base_url: baseUrl,
      });

      setTestResult(res);

      if (selectedProvider === 'gemini' && res.available_models && res.available_models.length > 0) {
        setGeminiModels(res.available_models);
        const isCurrentAvailable = res.available_models.some((m) => m.id === geminiModel);
        if (!isCurrentAvailable || res.error_type === 'ModelUnavailable') {
          const has38Flash = res.available_models.some((m) => m.id === 'gemini-3.8-flash');
          const autoModel = has38Flash ? 'gemini-3.8-flash' : res.available_models[0].id;
          setGeminiModel(autoModel);
        }
      }
    } catch (err: unknown) {
      setTestResult({
        valid: false,
        provider: selectedProvider,
        model: selectedProvider === 'gemini' ? geminiModel : ollamaModel,
        message: err instanceof Error ? err.message : 'Connection test failed',
        error_type: 'TestConnectionError',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    setValidationError(null);

    if (selectedProvider === 'gemini') {
      if (!apiKey.trim()) {
        setValidationError('A Google Gemini API key is required when using the Gemini provider.');
        return;
      }
      if (!consentGranted) {
        setValidationError(
          'Cloud translation requires your explicit consent for transmitting code to Google Gemini.'
        );
        return;
      }
    }

    const newConfig: ProviderConfig = {
      provider: selectedProvider,
      api_key: selectedProvider === 'gemini' ? apiKey.trim() : undefined,
      model: selectedProvider === 'gemini' ? geminiModel : selectedProvider === 'ollama' ? ollamaModel : 'mock-translator',
      base_url: selectedProvider === 'ollama' ? ollamaBaseUrl.trim() : undefined,
      consent_granted: selectedProvider === 'gemini' ? consentGranted : false,
    };

    onSaveConfig(newConfig);
    onClose();
  };

  const handleClearKey = () => {
    setApiKey('');
    setConsentGranted(false);
    setTestResult(null);
    onClearKey();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="provider-modal-title">
      <div className="modal-container">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Radio size={16} className="modal-icon" />
            <h2 id="provider-modal-title" className="modal-title">
              AI Translation Provider Settings
            </h2>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close provider settings"
          >
            <X size={16} />
          </button>
        </div>

        {/* Provider Tabs */}
        <div className="modal-provider-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={selectedProvider === 'gemini'}
            className={`provider-tab ${selectedProvider === 'gemini' ? 'active' : ''}`}
            onClick={() => {
              setSelectedProvider('gemini');
              setTestResult(null);
              setValidationError(null);
            }}
          >
            <Cloud size={15} />
            <div className="tab-text">
              <span className="tab-name">Google Gemini</span>
              <span className="tab-pill tab-pill-cloud">Cloud AI</span>
            </div>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedProvider === 'ollama'}
            className={`provider-tab ${selectedProvider === 'ollama' ? 'active' : ''}`}
            onClick={() => {
              setSelectedProvider('ollama');
              setTestResult(null);
              setValidationError(null);
            }}
          >
            <Cpu size={15} />
            <div className="tab-text">
              <span className="tab-name">Local Ollama</span>
              <span className="tab-pill tab-pill-local">Local / Offline</span>
            </div>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedProvider === 'mock'}
            className={`provider-tab ${selectedProvider === 'mock' ? 'active' : ''}`}
            onClick={() => {
              setSelectedProvider('mock');
              setTestResult(null);
              setValidationError(null);
            }}
          >
            <FlaskConical size={15} />
            <div className="tab-text">
              <span className="tab-name">Mock Engine</span>
              <span className="tab-pill tab-pill-test">Testing / Demo</span>
            </div>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Validation Alert */}
          {validationError && (
            <div className="modal-alert modal-alert-error" role="alert">
              <AlertCircle size={15} />
              <span>{validationError}</span>
            </div>
          )}

          {/* GEMINI PROVIDER PANEL */}
          {selectedProvider === 'gemini' && (
            <div className="provider-config-panel">
              <div className="provider-notice provider-notice-cloud">
                <Cloud size={16} />
                <div className="notice-body">
                  <div className="notice-heading">Direct Cloud AI Translation via Google Gemini</div>
                  <p className="notice-desc">
                    Allows instant high-quality translation without installing Ollama or downloading heavy models.
                    Your API key is stored only in memory for this session and is never persisted to disk or browser storage.
                  </p>
                </div>
              </div>

              {/* API Key Input */}
              <div className="form-group">
                <label htmlFor="gemini-api-key" className="form-label">
                  <span className="label-text">Gemini API Key</span>
                  <span className="label-required">*</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="label-link"
                  >
                    <span>Get free key</span>
                    <ExternalLink size={11} />
                  </a>
                </label>
                <div className="input-with-actions">
                  <div className="input-leading-icon">
                    <Key size={14} />
                  </div>
                  <input
                    id="gemini-api-key"
                    type={showApiKey ? 'text' : 'password'}
                    className="form-input has-leading-icon"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <button
                    type="button"
                    className="btn-input-action"
                    onClick={() => setShowApiKey(!showApiKey)}
                    title={showApiKey ? 'Mask API key' : 'Show API key'}
                    aria-label={showApiKey ? 'Mask API key' : 'Show API key'}
                  >
                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {apiKey && (
                    <button
                      type="button"
                      className="btn-input-action btn-danger"
                      onClick={handleClearKey}
                      title="Clear API key from memory immediately"
                      aria-label="Clear API key"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <span className="form-help">
                  Held strictly in runtime memory. Never saved to localStorage, cookies, or backend database.
                </span>
              </div>

              {/* Model Selection */}
              <div className="form-group">
                <label htmlFor="gemini-model-select" className="form-label">
                  <span className="label-text">Gemini Model</span>
                  <span className="form-help">
                    {testResult?.available_models && testResult.available_models.length > 0
                      ? `${testResult.available_models.length} active models discovered for key`
                      : 'Supports dynamic model discovery on test'}
                  </span>
                </label>
                <select
                  id="gemini-model-select"
                  className="form-select"
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                >
                  {!geminiModels.some((m) => m.id === geminiModel) && (
                    <option value={geminiModel}>
                      {geminiModel} (Custom / Configured)
                    </option>
                  )}
                  {geminiModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data Transmission Disclosure & Mandatory Consent */}
              <div className="consent-box">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={consentGranted}
                    onChange={(e) => {
                      setConsentGranted(e.target.checked);
                      if (validationError) setValidationError(null);
                    }}
                    className="form-checkbox"
                  />
                  <div className="checkbox-text">
                    <span className="checkbox-title">
                      I consent to transmitting code snippets to Google Gemini APIs
                    </span>
                    <span className="checkbox-desc">
                      Source code will be sent over HTTPS directly to Google's generative language API for translation.
                      Untrusted code is never executed locally or remotely.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* OLLAMA PROVIDER PANEL */}
          {selectedProvider === 'ollama' && (
            <div className="provider-config-panel">
              <div className="provider-notice provider-notice-local">
                <ShieldCheck size={16} />
                <div className="notice-body">
                  <div className="notice-heading">Local, Private AI Inference with Ollama</div>
                  <p className="notice-desc">
                    100% private and offline. Your source code never leaves your local machine.
                    Requires Ollama daemon running on your computer.
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="ollama-base-url" className="form-label">
                  <span className="label-text">Ollama Server Base URL</span>
                </label>
                <input
                  id="ollama-base-url"
                  type="text"
                  className="form-input"
                  value={ollamaBaseUrl}
                  onChange={(e) => setOllamaBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  spellCheck="false"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ollama-model" className="form-label">
                  <span className="label-text">Model Tag</span>
                </label>
                <input
                  id="ollama-model"
                  type="text"
                  className="form-input"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  placeholder="qwen2.5-coder:7b"
                  spellCheck="false"
                />
                <span className="form-help">
                  Recommended: <code>qwen2.5-coder:7b</code> or <code>qwen2.5-coder:1.5b</code>.
                </span>
              </div>
            </div>
          )}

          {/* MOCK PROVIDER PANEL */}
          {selectedProvider === 'mock' && (
            <div className="provider-config-panel">
              <div className="provider-notice provider-notice-mock">
                <FlaskConical size={16} />
                <div className="notice-body">
                  <div className="notice-heading">Deterministic Mock Translation Engine</div>
                  <p className="notice-desc">
                    Instant structural translation using AST/heuristic template rules without any AI inference,
                    external API calls, or Ollama requirements. Ideal for UI testing and verification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Test Result Feedback */}
          {testResult && (
            <div
              className={`test-result-box ${testResult.valid ? 'test-result-success' : 'test-result-error'}`}
            >
              <div className="test-result-header">
                {testResult.valid ? (
                  <Check size={15} className="test-result-icon" />
                ) : (
                  <AlertTriangle size={15} className="test-result-icon" />
                )}
                <span className="test-result-title">
                  {testResult.valid ? 'Connection Verified' : 'Connection Failed'}
                </span>
                {testResult.model && (
                  <span className="test-result-model">Model: {testResult.model}</span>
                )}
              </div>
              <p className="test-result-message">{testResult.message}</p>
              {testResult.details && (
                <div className="test-result-details">
                  <pre>{testResult.details}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="footer-left">
            <button
              type="button"
              className={`btn-modal-test ${isTesting ? 'loading' : ''}`}
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              <RotateCw size={13} className={isTesting ? 'spinning' : ''} />
              <span>{isTesting ? 'Testing Connection...' : 'Test Connection'}</span>
            </button>
          </div>

          <div className="footer-right">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-modal-save" onClick={handleSave}>
              Apply &amp; Use Provider
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
