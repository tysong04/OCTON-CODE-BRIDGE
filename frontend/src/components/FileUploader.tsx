import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Language } from '../types/translation';

export const MAX_FILE_SIZE_BYTES = 65536; // 64 KB

export function validateAndLoadFile(
  file: File,
  sourceLang: Language,
  onFileLoaded: (content: string, filename: string) => void,
  onError: (errorMsg: string) => void
): void {
  // Size check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    onError(`File is too large (${Math.round(file.size / 1024)} KB). Maximum allowed size is 64 KB.`);
    return;
  }

  // Extension check
  const extension = '.' + (file.name.split('.').pop() || '').toLowerCase();
  const validPyExtensions = ['.py'];
  const validJsExtensions = ['.js', '.mjs', '.cjs', '.jsx', '.ts'];

  if (sourceLang === 'python' && !validPyExtensions.includes(extension) && extension !== '.txt') {
    onError(`Selected file '${file.name}' is not a Python source file (.py).`);
    return;
  } else if (sourceLang === 'javascript' && !validJsExtensions.includes(extension) && extension !== '.txt') {
    onError(`Selected file '${file.name}' is not a JavaScript source file (.js, .mjs, .cjs).`);
    return;
  }

  // Safe client-side text extraction (never executed)
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target?.result;
    if (typeof text === 'string') {
      if (!text.trim()) {
        onError(`The selected file '${file.name}' is empty.`);
        return;
      }
      onFileLoaded(text, file.name);
    }
  };
  reader.onerror = () => {
    onError(`Failed to read file '${file.name}'.`);
  };
  reader.readAsText(file);
}

interface FileUploaderProps {
  sourceLang: Language;
  onFileLoaded: (content: string, filename: string) => void;
  onError: (errorMsg: string) => void;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  sourceLang,
  onFileLoaded,
  onError,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndLoadFile(file, sourceLang, onFileLoaded, onError);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="file-upload-input"
        accept={sourceLang === 'python' ? '.py,.txt' : '.js,.mjs,.cjs,.jsx,.ts,.txt'}
        onChange={handleFileChange}
        disabled={disabled}
      />
      <button
        type="button"
        className="btn-panel-action"
        onClick={handleClick}
        disabled={disabled}
        title="Upload source file (.py or .js, max 64 KB)"
        aria-label="Upload source file"
      >
        <Upload size={13} />
        <span>Upload</span>
      </button>
    </>
  );
};
