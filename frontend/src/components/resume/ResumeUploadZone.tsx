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
        className={`relative flex flex-col items-center justify-center rounded-3xl border border-dashed p-8 md:p-10 transition-all duration-300 cursor-pointer ${
          dragActive
            ? 'border-[#FAF8F5] bg-white/10 shadow-2xl shadow-white/10 scale-[1.01]'
            : 'border-[#FAF8F5]/20 bg-[#121214] hover:border-[#FAF8F5]/40 hover:bg-white/[0.03] backdrop-blur-xl'
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

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-[#FAF8F5] border border-white/15 shadow-lg shadow-white/5">
          {isUploading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-[#FAF8F5]" />
          ) : (
            <UploadCloud className="h-7 w-7 text-[#FAF8F5]" />
          )}
        </div>

        <div className="mt-5 text-center">
          <h3 className="text-sm md:text-base font-semibold text-white">
            {isUploading ? 'Extracting Resume Intelligence...' : 'Upload your Candidate Resume'}
          </h3>
          <p className="mt-1.5 text-xs text-neutral-300">
            Drag & drop PDF / DOCX here, or <span className="font-semibold text-[#FAF8F5] underline underline-offset-4">browse files</span>
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono text-neutral-400">
            <span className="rounded-md bg-white/10 px-2 py-0.5 border border-white/15 text-[#FAF8F5]">PDF, DOCX</span>
            <span>•</span>
            <span className="rounded-md bg-white/10 px-2 py-0.5 border border-white/15 text-[#FAF8F5]">Max 10MB</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-white">
              <Sparkles className="h-3 w-3 text-[#FAF8F5]" />
              <span>Auto-Profile Sync</span>
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

