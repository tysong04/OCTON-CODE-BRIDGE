import React from 'react';
import { ProviderStatusResponse, HealthResponse } from '../types/translation';
import { Activity, Cpu } from 'lucide-react';

interface StatusBadgeProps {
  backendHealth: HealthResponse | null;
  providerStatus: ProviderStatusResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  backendHealth,
  providerStatus,
  isLoading,
  onRefresh,
}) => {
  const isBackendOnline = backendHealth?.status === 'healthy';
  const isProviderAvailable = providerStatus?.available === true;

  let pillClass = 'offline';
  let label = 'Backend Offline';

  if (isBackendOnline) {
    if (isProviderAvailable) {
      pillClass = 'online';
      label = `${providerStatus?.provider || 'Ollama'}: ${providerStatus?.model || 'Ready'}`;
    } else {
      pillClass = 'warning';
      label = `${providerStatus?.provider || 'Ollama'}: Offline`;
    }
  }

  return (
    <div className="header-status-area">
      <button
        onClick={onRefresh}
        disabled={isLoading}
        title="Click to check backend and Ollama status"
        className={`status-pill ${pillClass}`}
      >
        <span className="status-dot"></span>
        <Cpu size={14} />
        <span>{label}</span>
      </button>

      <span
        className={`status-pill ${isBackendOnline ? 'online' : 'offline'}`}
        title={`Backend status: ${isBackendOnline ? 'Online' : 'Offline'}`}
      >
        <span className="status-dot"></span>
        <Activity size={14} />
        <span>API {isBackendOnline ? 'Online' : 'Offline'}</span>
      </span>
    </div>
  );
};
