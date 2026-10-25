import React from 'react';
import { AlertCircle, Terminal, X, Copy, Check } from 'lucide-react';
import { ApiError } from '../types/translation';

interface ErrorBannerProps {
  error: ApiError | null;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, onDismiss }) => {
  const [copied, setCopied] = React.useState(false);

  if (!error) return null;

  const handleCopyInstructions = () => {
    if (!error.setup_instructions) return;
    navigator.clipboard.writeText(error.setup_instructions);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="system-callout-banner banner-danger" role="alert">
      <div className="banner-top-row">
        <div className="banner-title-group">
          <AlertCircle size={15} className="banner-leading-icon" />
          <span className="banner-title">{error.error_type || 'Translation Error'}</span>
        </div>
        <button
          onClick={onDismiss}
          className="btn-banner-close"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>

      <p className="banner-message">{error.message}</p>

      {error.setup_instructions && (
        <div className="banner-setup-guide">
          <div className="setup-guide-header">
            <Terminal size={13} />
            <span>Setup Guide</span>
            <button
              type="button"
              className="btn-copy-instructions"
              onClick={handleCopyInstructions}
              title="Copy setup commands"
            >
              {copied ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
              <span>{copied ? 'Copied' : 'Copy Commands'}</span>
            </button>
          </div>
          <pre className="banner-code-block">
            <code>{error.setup_instructions}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
