import React, { useState } from 'react';
import { Copy, Check, Download, Code, Loader2 } from 'lucide-react';
import { Language, ProviderInfo } from '../types/translation';

interface OutputPanelProps {
  translatedCode: string;
  targetLang: Language;
  providerInfo?: ProviderInfo;
  isTranslating: boolean;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  translatedCode,
  targetLang,
  providerInfo,
  isTranslating,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!translatedCode) return;
    try {
      await navigator.clipboard.writeText(translatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = translatedCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!translatedCode) return;
    const extension = targetLang === 'python' ? '.py' : '.js';
    const filename = `translated_code${extension}`;
    const blob = new Blob([translatedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const lineCount = translatedCode ? translatedCode.split('\n').length : 0;
  const byteCount = new Blob([translatedCode]).size;

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <Code size={16} />
          <span>Translated Code</span>
        </div>

        <div className="panel-actions">
          {translatedCode && (
            <>
              <button
                type="button"
                className="panel-action-btn"
                onClick={handleCopy}
                title="Copy translated code to clipboard"
              >
                {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                className="panel-action-btn"
                onClick={handleDownload}
                title={`Download as ${targetLang === 'python' ? '.py' : '.js'} file`}
              >
                <Download size={14} />
                <span>Download</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="editor-body">
        {isTranslating ? (
          <div className="empty-output-state">
            <Loader2 className="spinner" size={32} color="var(--accent-cyan)" />
            <p>Translating code with local AI model...</p>
          </div>
        ) : translatedCode ? (
          <pre className="code-output">
            <code>{translatedCode}</code>
          </pre>
        ) : (
          <div className="empty-output-state">
            <p>Click "Translate Code" to generate {targetLang === 'python' ? 'Python' : 'JavaScript'} output</p>
          </div>
        )}
      </div>

      <div className="panel-footer">
        <div>
          {providerInfo ? (
            <span>
              Provider: <strong>{providerInfo.provider}</strong> ({providerInfo.model}) &bull;{' '}
              {providerInfo.execution_time_ms ? `${providerInfo.execution_time_ms}ms` : ''}
            </span>
          ) : (
            <span>Ready for translation</span>
          )}
        </div>
        <div>
          {translatedCode && (
            <span>
              {lineCount} lines &bull; {byteCount} bytes
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
