import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

interface InstructionsInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export const InstructionsInput: React.FC<InstructionsInputProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="workspace-instructions-bar">
      <div className="instructions-inner">
        <SlidersHorizontal size={14} className="instructions-leading-icon" aria-hidden="true" />
        <input
          type="text"
          className="instructions-input-field"
          placeholder="Optional translation constraints (e.g. 'use async/await', 'prefer arrow functions', 'strict types')..."
          value={value}
          maxLength={1000}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Optional translation instructions"
        />
        {value && !disabled && (
          <button
            type="button"
            className="btn-clear-instructions"
            onClick={() => onChange('')}
            title="Clear instructions"
            aria-label="Clear instructions"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
};
