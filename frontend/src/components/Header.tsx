import React from 'react';
import { Code2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { HealthResponse, ProviderStatusResponse } from '../types/translation';

interface HeaderProps {
  backendHealth: HealthResponse | null;
  providerStatus: ProviderStatusResponse | null;
  isLoadingStatus: boolean;
  onRefreshStatus: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  backendHealth,
  providerStatus,
  isLoadingStatus,
  onRefreshStatus,
}) => {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">
          <Code2 size={24} />
        </div>
        <div>
          <div className="brand-title">
            OCB <span className="brand-badge">Octon Code Bridge</span>
          </div>
          <p className="brand-description">
            Private, local AI-powered code translator between Python and JavaScript
          </p>
        </div>
      </div>

      <StatusBadge
        backendHealth={backendHealth}
        providerStatus={providerStatus}
        isLoading={isLoadingStatus}
        onRefresh={onRefreshStatus}
      />
    </header>
  );
};
