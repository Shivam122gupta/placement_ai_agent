import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { resumeService } from '../services/resumeService';
import { ResumeItem } from '../types/resume';
import { ResumeUploadZone } from '../components/resume/ResumeUploadZone';
import { FileText, Download, Trash2, ArrowRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export const ResumesPage: React.FC = () => {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const data = await resumeService.listResumes();
      setResumes(data);
    } catch (err) {
      console.error('Failed to load resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setSuccessMsg(null);
    try {
      const newResume = await resumeService.uploadResume(file);
      setResumes((prev) => [newResume, ...prev]);
      setSuccessMsg(`Resume "${file.name}" parsed & Candidate Profile auto-built! Name, Education, Experience, and Skills synchronized.`);
      setTimeout(() => setSuccessMsg(null), 7000);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeService.deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = async (id: string, filename: string) => {
    try {
      await resumeService.downloadResume(id, filename);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-12 text-[#FAF8F5]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-[#FAF8F5]/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-normal tracking-tight text-white">Resume Intelligence</h1>
          <p className="mt-1 text-xs text-[#E8E2D6]/75">
            Upload PDF/DOCX resumes. Deep LLM extractors auto-fill your candidate profile and vectorize memory in Qdrant.
          </p>
        </div>
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-xs font-semibold text-white transition shadow-lg shadow-[#FF6B6B]/25 active:scale-95"
        >
          <span>View Auto-Filled Profile</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {successMsg && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 p-4 text-xs text-[#FFA07A] shadow-xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FF6B6B]" />
            <span>{successMsg}</span>
          </div>
          <Link
            to="/profile"
            className="shrink-0 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white text-xs font-semibold transition shadow-md shadow-[#FF6B6B]/25 active:scale-95"
          >
            Check Profile →
          </Link>
        </div>
      )}

      {/* Upload Zone */}
      <ResumeUploadZone onUpload={handleUpload} isUploading={uploading} />

      {/* Resumes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-serif font-normal text-white">Uploaded Resumes ({resumes.length})</h2>
          <span className="text-[10px] font-mono text-[#FAF8F5]/70">Deterministic RAG Memory Chunker</span>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FAF8F5]/20 border-t-[#FAF8F5]" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="rounded-3xl border border-[#FAF8F5]/15 bg-[#121214] p-8 text-center backdrop-blur-xl">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-[#FAF8F5]/10 border border-[#FAF8F5]/20 text-[#FAF8F5]">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-white">No resumes uploaded yet</h3>
            <p className="mt-1 text-xs text-[#E8E2D6]/75">Upload your PDF or Word resume above to extract candidate data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="flex flex-col justify-between rounded-3xl border border-[#FAF8F5]/15 bg-[#121214] p-6 shadow-xl backdrop-blur-xl transition hover:border-[#FAF8F5]/35 hover:bg-[#FAF8F5]/[0.03]"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/20">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white line-clamp-1">{resume.filename}</h4>
                        <span className="text-[11px] font-mono text-neutral-400">
                          {(resume.file_size / 1024).toFixed(1)} KB • {new Date(resume.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {resume.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5]/10 px-2 py-0.5 text-[10px] font-mono font-medium text-[#FAF8F5] border border-[#FAF8F5]/20">
                          <CheckCircle2 className="h-3 w-3 text-[#FAF8F5]" />
                          <span>PARSED</span>
                        </span>
                      ) : resume.status === 'PROCESSING' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-mono font-medium text-neutral-300 border border-white/10">
                          <Clock className="h-3 w-3 text-neutral-400 animate-spin" />
                          <span>PARSING</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="h-3 w-3" />
                          <span>FAILED</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {resume.parsed_data && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {resume.parsed_data.skills?.slice(0, 4).map((s, idx) => (
                        <span key={idx} className="rounded-md bg-[#FAF8F5]/10 px-2 py-0.5 text-[10px] font-mono text-[#FAF8F5] border border-[#FAF8F5]/20">
                          {s.name}
                        </span>
                      ))}
                      {(resume.parsed_data.skills?.length || 0) > 4 && (
                        <span className="rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-mono text-neutral-400 border border-white/[0.06]">
                          +{(resume.parsed_data.skills?.length || 0) - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#FAF8F5]/10 pt-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownload(resume.id, resume.filename)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-neutral-400 hover:bg-white/[0.05] hover:text-white transition cursor-pointer"
                      title="Download file"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-neutral-400 hover:bg-white/[0.05] hover:text-rose-400 transition cursor-pointer"
                      title="Delete resume"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <Link
                    to={`/resumes/${resume.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#FAF8F5] hover:text-white transition underline decoration-white/30"
                  >
                    <span>View Intelligence</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
