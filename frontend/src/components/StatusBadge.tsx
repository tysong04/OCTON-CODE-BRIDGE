import React from 'react';
import { ProviderStatusResponse, HealthResponse, ProviderConfig } from '../types/translation';
import { Activity, Cpu, RotateCw, ShieldCheck, Cloud, FlaskConical, Settings } from 'lucide-react';

interface StatusBadgeProps {
  backendHealth: HealthResponse | null;
  providerStatus: ProviderStatusResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
  currentProviderConfig: ProviderConfig;
  onOpenSettings: () => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  backendHealth,
  providerStatus,
  isLoading,
  onRefresh,
  currentProviderConfig,
  onOpenSettings,
}) => {
  const isBackendOnline = backendHealth?.status === 'healthy';
  const provider = currentProviderConfig.provider;

  // Compute status pill display depending on active provider
  let providerPillClass = 'status-pill-offline';
  let providerLabel = 'Not Configured';

  if (!isBackendOnline) {
    providerPillClass = 'status-pill-offline';
    providerLabel = 'Backend Offline';
  } else if (provider === 'gemini') {
    const hasKey = Boolean(currentProviderConfig.api_key && currentProviderConfig.api_key.trim());
    if (hasKey) {
      providerPillClass = 'status-pill-cloud-active';
      providerLabel = currentProviderConfig.model || 'Gemini 1.5 Flash';
    } else {
      providerPillClass = 'status-pill-warning';
      providerLabel = 'Key Needed';
    }
  } else if (provider === 'mock') {
    providerPillClass = 'status-pill-online';
    providerLabel = 'Mock Translator';
  } else {
    // Ollama
    const isAvailable = providerStatus?.available === true;
    if (isAvailable) {
      providerPillClass = 'status-pill-online';
      providerLabel = providerStatus?.model || 'Ready';
    } else {
      providerPillClass = 'status-pill-warning';
      providerLabel = providerStatus?.model || 'Offline';
    }
  }

  return (
    <div className="header-status-group" role="region" aria-label="System Connectivity Status">
      {/* Dynamic Privacy Guarantee Badge */}
      {provider === 'gemini' ? (
        <div
          className="privacy-badge privacy-badge-cloud"
          title="Cloud Mode: Code is transmitted over HTTPS directly to Google Gemini. No code is permanently retained or executed."
        >
          <Cloud size={13} className="privacy-icon-cloud" />
          <span>Cloud AI &bull; Gemini</span>
        </div>
      ) : provider === 'mock' ? (
        <div
          className="privacy-badge"
          title="Local Mock Mode: Deterministic translation without external network calls or local daemons."
        >
          <FlaskConical size={13} color="var(--accent-emerald)" />
          <span>Local Mock &bull; Private</span>
        </div>
      ) : (
        <div
          className="privacy-badge"
          title="Local Mode: All processing occurs locally in memory and Ollama. Source code is never sent externally."
        >
          <ShieldCheck size={13} color="var(--accent-emerald)" />
          <span>Local &bull; Private</span>
        </div>
      )}

      {/* Provider Selector / Status Button */}
      <button
        type="button"
        onClick={onOpenSettings}
        className={`status-pill ${providerPillClass}`}
        title={`Active Provider: ${provider.toUpperCase()} (${providerLabel}). Click to configure providers or API keys.`}
        aria-label="Open AI Provider settings"
      >
        <span className="status-indicator-dot"></span>
        {provider === 'gemini' ? (
          <Cloud size={13} />
        ) : provider === 'mock' ? (
          <FlaskConical size={13} />
        ) : (
          <Cpu size={13} />
        )}
        <span className="provider-status-text">
          {provider === 'gemini' ? 'Gemini: ' : provider === 'mock' ? 'Mock: ' : 'Ollama: '}
          {providerLabel}
        </span>
        <Settings size={12} className="settings-cog-icon" />
      </button>

      {/* Quick Refresh (for Ollama) */}
      {provider === 'ollama' && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh Ollama connection"
          aria-label="Refresh Ollama status"
          className="btn-status-refresh"
        >
          <RotateCw size={12} className={`refresh-icon ${isLoading ? 'spinning' : ''}`} />
        </button>
      )}

      {/* Backend API status */}
      <div
        className={`status-pill ${isBackendOnline ? 'status-pill-online' : 'status-pill-offline'}`}
        title={`FastAPI backend: ${isBackendOnline ? 'Connected' : 'Unreachable'}`}
      >
        <span className="status-indicator-dot"></span>
        <Activity size={13} />
        <span>API {isBackendOnline ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  );
};
