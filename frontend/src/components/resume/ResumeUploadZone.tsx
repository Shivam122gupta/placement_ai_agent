import React, { useState, useRef } from 'react';
import { UploadCloud, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export const ResumeUploadZone: React.FC<Props> = ({ onUpload, isUploading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndUpload = async (file: File) => {
    setError(null);
    const validExtensions = ['.pdf', '.docx'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(ext)) {
      setError('Please upload a PDF (.pdf) or Word (.docx) document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    try {
      await onUpload(file);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to upload and parse resume.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 transition cursor-pointer ${
          dragActive
            ? 'border-brand-400 bg-brand-500/10 shadow-xl shadow-brand-500/10'
            : 'border-gray-800 bg-[#111827]/70 hover:border-gray-700 hover:bg-[#111827]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-md">
          {isUploading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
          ) : (
            <UploadCloud className="h-7 w-7" />
          )}
        </div>

        <div className="mt-4 text-center">
          <h3 className="text-base font-bold text-white">
            {isUploading ? 'Extracting Resume Intelligence...' : 'Upload your Resume'}
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            Drag and drop your file here, or <span className="font-semibold text-brand-400">browse</span>
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-gray-500">
            <span>Supported: <strong>PDF, DOCX</strong></span>
            <span>•</span>
            <span>Max Size: <strong>10MB</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Sparkles className="h-3 w-3" />
              <span>Auto-Extraction</span>
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
