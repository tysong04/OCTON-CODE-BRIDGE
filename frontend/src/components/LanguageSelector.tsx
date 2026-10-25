import React from 'react';
import { ArrowLeftRight, ChevronDown } from 'lucide-react';
import { Language } from '../types/translation';

interface LanguageSelectorProps {
  sourceLang: Language;
  targetLang: Language;
  onSourceLangChange: (lang: Language) => void;
  onTargetLangChange: (lang: Language) => void;
  onSwapLanguages: () => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  sourceLang,
  targetLang,
  onSourceLangChange,
  onTargetLangChange,
  onSwapLanguages,
  disabled = false,
}) => {
  return (
    <div className="workspace-lang-control" role="group" aria-label="Language Direction">
      {/* Source Language Picker */}
      <div className="lang-field">
        <span className="lang-field-tag">From</span>
        <div className="select-container">
          <select
            id="source-lang-select"
            className="lang-select-input"
            value={sourceLang}
            disabled={disabled}
            onChange={(e) => onSourceLangChange(e.target.value as Language)}
            aria-label="Source Language"
          >
            <option value="python">Python 3 (.py)</option>
            <option value="javascript">JavaScript (.js)</option>
          </select>
          <ChevronDown size={13} className="select-chevron" aria-hidden="true" />
        </div>
      </div>

      {/* Swap Direction Button */}
      <button
        type="button"
        className="btn-swap-direction"
        title="Swap Source and Target Languages"
        aria-label="Swap source and target languages"
        onClick={onSwapLanguages}
        disabled={disabled}
      >
        <ArrowLeftRight size={14} />
      </button>

      {/* Target Language Picker */}
      <div className="lang-field">
        <span className="lang-field-tag">To</span>
        <div className="select-container">
          <select
            id="target-lang-select"
            className="lang-select-input"
            value={targetLang}
            disabled={disabled}
            onChange={(e) => onTargetLangChange(e.target.value as Language)}
            aria-label="Target Language"
          >
            <option value="javascript">JavaScript (.js)</option>
            <option value="python">Python 3 (.py)</option>
          </select>
          <ChevronDown size={13} className="select-chevron" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};
