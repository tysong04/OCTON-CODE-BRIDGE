import React from 'react';
import { Sliders } from 'lucide-react';

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
    <div className="instructions-bar">
      <div className="instructions-input-wrapper">
        <Sliders size={16} />
        <input
          type="text"
          className="instructions-input"
          placeholder="Optional translation instructions (e.g., 'use async/await', 'prefer arrow functions', 'explain any assumptions')..."
          value={value}
          maxLength={1000}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};
