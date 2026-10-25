import React, { useState, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { Trash2, Sparkles, FileCode, UploadCloud } from 'lucide-react';
import { Language } from '../types/translation';
import { FileUploader, validateAndLoadFile, MAX_FILE_SIZE_BYTES } from './FileUploader';
import { getEditorExtensions } from './editorTheme';

interface CodeEditorProps {
  code: string;
  onChange: (val: string) => void;
  onClear: () => void;
  sourceLang: Language;
  filename: string | null;
  onFileLoaded: (content: string, name: string) => void;
  onError: (msg: string) => void;
  onTranslateShortcut?: () => void;
  disabled?: boolean;
}

const SAMPLE_PYTHON = `def calculate_stats(numbers: list[int | float]) -> dict:
    """Calculate basic summary statistics for a list of numbers."""
    if not numbers:
        return {"count": 0, "total": 0, "average": 0.0}
    
    total = sum(numbers)
    average = total / len(numbers)
    maximum = max(numbers)
    minimum = min(numbers)
    
    return {
        "count": len(numbers),
        "total": total,
        "average": round(average, 2),
        "max": maximum,
        "min": minimum,
    }

# Example data run
sample_data = [12, 45, 68, 23, 90, 5, 31]
summary = calculate_stats(sample_data)
print(f"Stats summary: {summary}")`;

const SAMPLE_JS = `function calculateStats(numbers) {
  // Calculate basic summary statistics for an array of numbers
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
    min,
  };
}

// Example data run
const sampleData = [12, 45, 68, 23, 90, 5, 31];
const summary = calculateStats(sampleData);
console.log("Stats summary:", summary);`;

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onClear,
  sourceLang,
  filename,
  onFileLoaded,
  onError,
  onTranslateShortcut,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const extensions = useMemo(() => {
    return getEditorExtensions(sourceLang, python(), javascript({ jsx: true, typescript: true }));
  }, [sourceLang]);

  const lineCount = useMemo(() => (code ? code.split('\n').length : 0), [code]);
  const byteCount = useMemo(() => new Blob([code]).size, [code]);

  const handleLoadSample = () => {
    onChange(sourceLang === 'python' ? SAMPLE_PYTHON : SAMPLE_JS);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndLoadFile(file, sourceLang, onFileLoaded, onError);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onTranslateShortcut?.();
    }
  };

  return (
    <div
      className={`editor-workspace-card ${isDragging ? 'drag-hover' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
    >
      {/* Editor Header Bar */}
      <div className="editor-card-header">
        <div className="editor-header-meta">
          <FileCode size={15} className="editor-icon" />
          <span className="editor-title">Source</span>
          <span className="editor-lang-badge">
            {sourceLang === 'python' ? 'Python' : 'JavaScript'}
          </span>
          {filename && (
            <span className="editor-filename-badge" title={`Loaded file: ${filename}`}>
              {filename}
            </span>
          )}
        </div>

        <div className="editor-actions">
          <button
            type="button"
            className="btn-panel-action"
            onClick={handleLoadSample}
            disabled={disabled}
            title="Load sample snippet"
            aria-label="Load sample snippet"
          >
            <Sparkles size={13} />
            <span>Sample</span>
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
              className="btn-panel-action danger"
              onClick={onClear}
              disabled={disabled}
              title="Clear source editor"
              aria-label="Clear source editor"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* CodeMirror Surface */}
      <div className="editor-surface">
        <CodeMirror
          value={code}
          height="100%"
          extensions={extensions}
          onChange={onChange}
          readOnly={disabled}
          placeholder={`// Paste or drop your ${sourceLang === 'python' ? 'Python' : 'JavaScript'} code here (Ctrl+Enter to translate)...`}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: false,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: false,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: false,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: false,
            lintKeymap: false,
          }}
        />

        {/* Drag and Drop Zone Overlay */}
        {isDragging && (
          <div className="drag-drop-overlay">
            <UploadCloud size={36} color="var(--accent-cyan)" />
            <p className="drag-drop-title">Drop code file to import</p>
            <p className="drag-drop-desc">
              Supports {sourceLang === 'python' ? '.py' : '.js, .ts'} (max {Math.round(MAX_FILE_SIZE_BYTES / 1024)} KB)
            </p>
          </div>
        )}
      </div>

      {/* Editor Footer Status Bar */}
      <div className="editor-card-footer">
        <div className="editor-footer-left">
          <span className="status-metric">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
          <span className="status-separator">&bull;</span>
          <span className="status-metric">
            {byteCount.toLocaleString()} bytes
          </span>
        </div>
        <div className="editor-footer-right">
          <span className="shortcut-tip">
            <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to translate
          </span>
        </div>
      </div>
    </div>
  );
};
