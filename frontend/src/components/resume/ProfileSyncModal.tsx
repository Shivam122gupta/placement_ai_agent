import React, { useState } from 'react';
import { ProfileSyncOptions, ParsedResumeData } from '../../types/resume';
import { Sparkles, CheckSquare, Square, X, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: ProfileSyncOptions) => Promise<void>;
  parsedData?: ParsedResumeData;
  isSyncing: boolean;
}

export const ProfileSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  parsedData,
  isSyncing,
}) => {
  const [options, setOptions] = useState<ProfileSyncOptions>({
    sync_personal: true,
    sync_education: true,
    sync_skills: true,
    sync_projects: true,
    sync_certifications: true,
  });

  if (!isOpen || !parsedData) return null;

  const toggleOption = (key: keyof ProfileSyncOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSync = async () => {
    await onConfirm(options);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-gray-800 bg-[#111827] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sync Resume to Profile</h3>
              <p className="text-xs text-gray-400">Select which extracted sections to merge</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {/* Personal */}
          <div
            onClick={() => toggleOption('sync_personal')}
            className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/60 p-3.5 cursor-pointer hover:border-gray-700 transition"
          >
            <div className="flex items-center gap-3">
              {options.sync_personal ? (
                <CheckSquare className="h-4 w-4 text-brand-400" />
              ) : (
                <Square className="h-4 w-4 text-gray-500" />
              )}
              <div>
                <span className="text-xs font-bold text-white">Personal Information</span>
                <p className="text-[11px] text-gray-400">
                  {parsedData.full_name} {parsedData.location ? `• ${parsedData.location}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div
            onClick={() => toggleOption('sync_skills')}
            className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/60 p-3.5 cursor-pointer hover:border-gray-700 transition"
          >
            <div className="flex items-center gap-3">
              {options.sync_skills ? (
                <CheckSquare className="h-4 w-4 text-brand-400" />
              ) : (
                <Square className="h-4 w-4 text-gray-500" />
              )}
              <div>
                <span className="text-xs font-bold text-white">
                  Technical Skills ({parsedData.skills?.length || 0})
                </span>
                <p className="text-[11px] text-gray-400 line-clamp-1">
                  {parsedData.skills?.map((s) => s.name).join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Projects */}
          <div
            onClick={() => toggleOption('sync_projects')}
            className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/60 p-3.5 cursor-pointer hover:border-gray-700 transition"
          >
            <div className="flex items-center gap-3">
              {options.sync_projects ? (
                <CheckSquare className="h-4 w-4 text-brand-400" />
              ) : (
                <Square className="h-4 w-4 text-gray-500" />
              )}
              <div>
                <span className="text-xs font-bold text-white">
                  Portfolio Projects ({parsedData.projects?.length || 0})
                </span>
                <p className="text-[11px] text-gray-400 line-clamp-1">
                  {parsedData.projects?.map((p) => p.name).join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Education */}
          <div
            onClick={() => toggleOption('sync_education')}
            className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/60 p-3.5 cursor-pointer hover:border-gray-700 transition"
          >
            <div className="flex items-center gap-3">
              {options.sync_education ? (
                <CheckSquare className="h-4 w-4 text-brand-400" />
              ) : (
                <Square className="h-4 w-4 text-gray-500" />
              )}
              <div>
                <span className="text-xs font-bold text-white">
                  Education ({parsedData.education?.length || 0})
                </span>
                <p className="text-[11px] text-gray-400 line-clamp-1">
                  {parsedData.education?.map((e) => e.degree).join(', ')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 transition disabled:opacity-50"
          >
            <span>{isSyncing ? 'Synchronizing...' : 'Confirm & Sync'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
