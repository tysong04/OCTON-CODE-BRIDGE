import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Language } from '../types/translation';

interface FileUploaderProps {
  sourceLang: Language;
  onFileLoaded: (content: string, filename: string) => void;
  onError: (errorMsg: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 65536; // 64 KB

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

    // Size check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      onError(`File is too large (${Math.round(file.size / 1024)} KB). Maximum allowed size is 64 KB.`);
      return;
    }

    // Extension check
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const validPyExtensions = ['.py'];
    const validJsExtensions = ['.js', '.mjs', '.cjs', '.jsx'];

    if (sourceLang === 'python' && !validPyExtensions.includes(extension) && extension !== '.txt') {
      onError(`Selected file '${file.name}' is not a Python source file (.py).`);
      return;
    } else if (sourceLang === 'javascript' && !validJsExtensions.includes(extension) && extension !== '.txt') {
      onError(`Selected file '${file.name}' is not a JavaScript source file (.js, .mjs, .cjs).`);
      return;
    }

    // Safe client-side read
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
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="file-upload-input"
        accept={sourceLang === 'python' ? '.py,.txt' : '.js,.mjs,.cjs,.jsx,.txt'}
        onChange={handleFileChange}
        disabled={disabled}
      />
      <button
        type="button"
        className="panel-action-btn"
        onClick={handleClick}
        disabled={disabled}
        title="Upload single source code file (.py or .js)"
      >
        <Upload size={14} />
        <span>Upload File</span>
      </button>
    </>
  );
};
