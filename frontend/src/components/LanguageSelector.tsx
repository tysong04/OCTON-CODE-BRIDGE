import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
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
    <div className="lang-selector-group">
      <div className="lang-select-box">
        <label htmlFor="source-lang-select">Source</label>
        <select
          id="source-lang-select"
          className="lang-dropdown"
          value={sourceLang}
          disabled={disabled}
          onChange={(e) => onSourceLangChange(e.target.value as Language)}
        >
          <option value="python">Python (.py)</option>
          <option value="javascript">JavaScript (.js)</option>
        </select>
      </div>

      <button
        type="button"
        className="swap-button"
        title="Swap Source and Target Languages"
        onClick={onSwapLanguages}
        disabled={disabled}
      >
        <ArrowLeftRight size={16} />
      </button>

      <div className="lang-select-box">
        <label htmlFor="target-lang-select">Target</label>
        <select
          id="target-lang-select"
          className="lang-dropdown"
          value={targetLang}
          disabled={disabled}
          onChange={(e) => onTargetLangChange(e.target.value as Language)}
        >
          <option value="javascript">JavaScript (.js)</option>
          <option value="python">Python (.py)</option>
        </select>
      </div>
    </div>
  );
};
