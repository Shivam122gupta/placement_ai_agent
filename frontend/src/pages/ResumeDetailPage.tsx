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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-bold text-white">Resume not found</h2>
        <Link to="/resumes" className="mt-4 inline-flex items-center gap-1 text-xs text-brand-400">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Resumes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top action bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/resumes"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-850 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white line-clamp-1">{resume.filename}</h1>
            <span className="text-xs text-gray-400">
              Uploaded on {new Date(resume.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => resumeService.downloadResume(resume.id, resume.filename)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gray-850 px-3.5 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white border border-gray-700/50 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </button>

          <button
            onClick={() => setSyncModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-500/25 hover:from-brand-500 hover:to-brand-400 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sync to Active Profile</span>
          </button>

          <button
            onClick={handleDelete}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
            title="Delete Resume"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {syncSuccessMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-sm text-emerald-400">
          <CheckCircle className="h-5 w-5" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* Parsed Viewer */}
      {resume.parsed_data ? (
        <ResumeParsedViewer parsedData={resume.parsed_data} />
      ) : (
        <div className="rounded-2xl border border-gray-800 bg-[#111827]/80 p-8 text-center">
          <p className="text-sm text-gray-400">Resume is being processed or failed to parse.</p>
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
