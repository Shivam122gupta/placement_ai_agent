import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { resumeService } from '../services/resumeService';
import { ResumeItem, ProfileSyncOptions } from '../types/resume';
import { ResumeParsedViewer } from '../components/resume/ResumeParsedViewer';
import { ProfileSyncModal } from '../components/resume/ProfileSyncModal';
import { ArrowLeft, Download, CheckCircle, Sparkles, Trash2 } from 'lucide-react';

export const ResumeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [resume, setResume] = useState<ResumeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadResume(id);
    }
  }, [id]);

  const loadResume = async (resumeId: string) => {
    try {
      const data = await resumeService.getResume(resumeId);
      setResume(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToProfile = async (options: ProfileSyncOptions) => {
    if (!id) return;
    setSyncing(true);
    try {
      await resumeService.syncToProfile(id, options);
      setSyncSuccessMsg('Selected resume data synchronized to your active profile!');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Delete this resume?')) return;
    await resumeService.deleteResume(id);
    navigate('/resumes');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FAF8F5]/20 border-t-[#FAF8F5]" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="p-8 text-center text-[#FAF8F5]">
        <h2 className="text-lg font-bold text-white">Resume not found</h2>
        <Link to="/resumes" className="mt-4 inline-flex items-center gap-1 text-xs text-[#FAF8F5] hover:text-white underline decoration-white/30">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Resumes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 text-[#FAF8F5]">
      {/* Top action bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#FAF8F5]/10 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/resumes"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF8F5]/10 border border-[#FAF8F5]/20 text-[#FAF8F5] hover:text-white hover:bg-[#FAF8F5]/20 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-base md:text-lg font-semibold text-white line-clamp-1">{resume.filename}</h1>
            <span className="text-xs font-mono text-neutral-400">
              Uploaded on {new Date(resume.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => resumeService.downloadResume(resume.id, resume.filename)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B6B]/10 px-3.5 py-2 text-xs font-medium text-[#FFA07A] hover:bg-[#FF6B6B]/20 hover:text-white border border-[#FF6B6B]/25 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-[#FFA07A]" />
            <span>Download</span>
          </button>

          <button
            onClick={() => setSyncModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#FF6B6B]/25 transition cursor-pointer active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span>Sync to Active Profile</span>
          </button>

          <button
            onClick={handleDelete}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            title="Delete Resume"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {syncSuccessMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-[#FAF8F5]/10 border border-[#FAF8F5]/30 p-4 text-xs text-[#FAF8F5] shadow-xl">
          <CheckCircle className="h-4 w-4 text-[#FAF8F5]" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* Parsed Viewer */}
      {resume.parsed_data ? (
        <ResumeParsedViewer parsedData={resume.parsed_data} />
      ) : (
        <div className="rounded-3xl border border-[#FAF8F5]/15 bg-[#121214] p-8 text-center backdrop-blur-xl">
          <p className="text-xs font-mono text-neutral-400">Resume is being processed or failed to parse.</p>
        </div>
      )}

      {/* Sync Modal */}
      <ProfileSyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        onConfirm={handleSyncToProfile}
        parsedData={resume.parsed_data}
        isSyncing={syncing}
      />
    </div>
  );
};
