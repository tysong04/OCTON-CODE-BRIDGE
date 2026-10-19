import React from 'react';
import { Trash2, Sparkles } from 'lucide-react';
import { Language } from '../types/translation';
import { FileUploader } from './FileUploader';

interface CodeEditorProps {
  code: string;
  onChange: (val: string) => void;
  onClear: () => void;
  sourceLang: Language;
  filename: string | null;
  onFileLoaded: (content: string, name: string) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
}

const SAMPLE_PYTHON = `def calculate_stats(numbers):
    """Calculate basic statistics for a list of numbers."""
    if not numbers:
        return {"count": 0, "total": 0, "average": 0}
    
    total = sum(numbers)
    average = total / len(numbers)
    maximum = max(numbers)
    minimum = min(numbers)
    
    return {
        "count": len(numbers),
        "total": total,
        "average": round(average, 2),
        "max": maximum,
        "min": minimum
    }

# Example usage
sample_data = [12, 45, 68, 23, 90, 5, 31]
result = calculate_stats(sample_data)
print(f"Stats summary: {result}")`;

const SAMPLE_JS = `function calculateStats(numbers) {
  // Calculate basic statistics for an array of numbers
  if (!numbers || numbers.length === 0) {
    return { count: 0, total: 0, average: 0 };
  }

  const total = numbers.reduce((acc, curr) => acc + curr, 0);
  const average = total / numbers.length;
  const max = Math.max(...numbers);
  const min = Math.min(...numbers);

  return {
    count: numbers.length,
    total,
    average: Number(average.toFixed(2)),
    max,
    min
  };
}

// Example usage
const sampleData = [12, 45, 68, 23, 90, 5, 31];
const result = calculateStats(sampleData);
console.log("Stats summary:", result);`;

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onClear,
  sourceLang,
  filename,
  onFileLoaded,
  onError,
  disabled = false,
}) => {
  const lineCount = code ? code.split('\n').length : 0;
  const byteCount = new Blob([code]).size;

  const handleLoadSample = () => {
    if (sourceLang === 'python') {
      onChange(SAMPLE_PYTHON);
    } else {
      onChange(SAMPLE_JS);
    }
  };

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <span>Source Code</span>
          {filename && (
            <span style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem' }}>
              ({filename})
            </span>
          )}
        </div>

        <div className="panel-actions">
          <button
            type="button"
            className="panel-action-btn"
            onClick={handleLoadSample}
            disabled={disabled}
            title="Load an example snippet for testing"
          >
            <Sparkles size={14} />
            <span>Load Sample</span>
          </button>

          <FileUploader
            sourceLang={sourceLang}
            onFileLoaded={onFileLoaded}
            onError={onError}
            disabled={disabled}
          />

          {code && (
            <button
              type="button"
              className="panel-action-btn"
              onClick={onClear}
              disabled={disabled}
              title="Clear editor"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <div className="editor-body">
        <textarea
          className="code-textarea"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`// Paste your ${sourceLang === 'python' ? 'Python' : 'JavaScript'} code here or upload a file...`}
          disabled={disabled}
          spellCheck={false}
        />
      </div>

      <div className="panel-footer">
        <span>Language: {sourceLang === 'python' ? 'Python 3' : 'JavaScript (ES6+)'}</span>
        <span>
          {lineCount} lines &bull; {byteCount} bytes / 64 KB max
        </span>
      </div>
    </div>
  );
};
