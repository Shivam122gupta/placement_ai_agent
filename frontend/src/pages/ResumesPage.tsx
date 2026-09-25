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
      setSuccessMsg(`Resume "${file.name}" uploaded and parsed successfully!`);
      setTimeout(() => setSuccessMsg(null), 4000);
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
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Resume Intelligence</h1>
        <p className="mt-1 text-xs text-gray-400">
          Upload PDF/DOCX resumes. AI extracts verified skills, projects, and syncs them directly to your active profile.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-sm text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Zone */}
      <ResumeUploadZone onUpload={handleUpload} isUploading={uploading} />

      {/* Resumes List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Uploaded Resumes ({resumes.length})</h2>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-[#111827]/60 p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-gray-600" />
            <h3 className="mt-2 text-sm font-semibold text-gray-300">No resumes uploaded yet</h3>
            <p className="mt-1 text-xs text-gray-500">Upload your PDF or Word resume above to extract candidate data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="flex flex-col justify-between rounded-2xl border border-gray-800 bg-[#111827]/80 p-5 shadow-lg backdrop-blur-md transition hover:border-gray-700"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{resume.filename}</h4>
                        <span className="text-[11px] text-gray-400">
                          {(resume.file_size / 1024).toFixed(1)} KB • {new Date(resume.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {resume.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>PARSED</span>
                        </span>
                      ) : resume.status === 'PROCESSING' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                          <Clock className="h-3 w-3" />
                          <span>PARSING</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/20">
                          <AlertTriangle className="h-3 w-3" />
                          <span>FAILED</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {resume.parsed_data && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {resume.parsed_data.skills?.slice(0, 4).map((s, idx) => (
                        <span key={idx} className="rounded bg-gray-800/80 px-2 py-0.5 text-[10px] font-medium text-gray-300">
                          {s.name}
                        </span>
                      ))}
                      {(resume.parsed_data.skills?.length || 0) > 4 && (
                        <span className="rounded bg-gray-800/80 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                          +{(resume.parsed_data.skills?.length || 0) - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-gray-800/80 pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(resume.id, resume.filename)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-white transition"
                      title="Download file"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition"
                      title="Delete resume"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <Link
                    to={`/resumes/${resume.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
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
