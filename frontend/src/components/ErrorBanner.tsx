import React from 'react';
import { AlertCircle, Terminal, X } from 'lucide-react';
import { ApiError } from '../types/translation';

interface ErrorBannerProps {
  error: ApiError | null;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="banner error">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="banner-header">
          <AlertCircle size={18} />
          <span>{error.error_type || 'Translation Error'}</span>
        </div>
        <button
          onClick={onDismiss}
          style={{ color: 'inherit', padding: '0.2rem', opacity: 0.8 }}
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>

      <div>{error.message}</div>

      {error.setup_instructions && (
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
            <Terminal size={14} />
            <span>Setup Instructions:</span>
          </div>
          <div className="banner-code">{error.setup_instructions}</div>
        </div>
      )}
    </div>
  );
};
