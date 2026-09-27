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
    sync_experience: true,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-[#FAF8F5]/20 bg-[#121214] p-6 shadow-2xl text-[#FAF8F5]">
        <div className="flex items-center justify-between border-b border-[#FAF8F5]/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#FAF8F5] border border-white/15">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-normal text-white">Sync Resume to Profile</h3>
              <p className="text-xs text-neutral-400">Select which extracted sections to merge</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-white/10 hover:text-white transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {/* Personal */}
          <div
            onClick={() => toggleOption('sync_personal')}
            className="flex items-center justify-between rounded-2xl border border-[#FAF8F5]/15 bg-[#18181B] p-3.5 cursor-pointer hover:border-[#FAF8F5]/35 transition"
          >
            <div className="flex items-center gap-3">
              {options.sync_personal ? (
                <CheckSquare className="h-4 w-4 text-[#FF6B6B]" />
              ) : (
                <Square className="h-4 w-4 text-neutral-500" />
              )}
              <div>
                <span className="text-xs font-semibold text-white">Personal Information</span>
                <p className="text-[11px] text-neutral-400">
                  {parsedData.full_name} {parsedData.location ? `• ${parsedData.location}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div
            onClick={() => toggleOption('sync_skills')}
            className="flex items-center justify-between rounded-2xl border border-[#FAF8F5]/15 bg-[#18181B] p-3.5 cursor-pointer hover:border-[#FAF8F5]/35 transition"
          >
            <div className="flex items-center gap-3">
              {options.sync_skills ? (
                <CheckSquare className="h-4 w-4 text-[#FF6B6B]" />
              ) : (
                <Square className="h-4 w-4 text-neutral-500" />
              )}
              <div>
                <span className="text-xs font-semibold text-white">
                  Technical Skills ({parsedData.skills?.length || 0})
                </span>
                <p className="text-[11px] text-neutral-400 line-clamp-1">
                  {parsedData.skills?.map((s) => s.name).join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Projects */}
          <div
            onClick={() => toggleOption('sync_projects')}
            className="flex items-center justify-between rounded-2xl border border-[#FAF8F5]/15 bg-[#18181B] p-3.5 cursor-pointer hover:border-[#FAF8F5]/35 transition"
          >
            <div className="flex items-center gap-3">
              {options.sync_projects ? (
                <CheckSquare className="h-4 w-4 text-[#FF6B6B]" />
              ) : (
                <Square className="h-4 w-4 text-neutral-500" />
              )}
              <div>
                <span className="text-xs font-semibold text-white">
                  Portfolio Projects ({parsedData.projects?.length || 0})
                </span>
                <p className="text-[11px] text-neutral-400 line-clamp-1">
                  {parsedData.projects?.map((p) => p.name).join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Experience */}
          <div
            onClick={() => toggleOption('sync_experience')}
            className="flex items-center justify-between rounded-2xl border border-[#FAF8F5]/15 bg-[#18181B] p-3.5 cursor-pointer hover:border-[#FAF8F5]/35 transition"
          >
            <div className="flex items-center gap-3">
              {options.sync_experience ? (
                <CheckSquare className="h-4 w-4 text-[#FF6B6B]" />
              ) : (
                <Square className="h-4 w-4 text-neutral-500" />
              )}
              <div>
                <span className="text-xs font-semibold text-white">
                  Work Experience & Internships ({parsedData.experience?.length || 0})
                </span>
                <p className="text-[11px] text-neutral-400 line-clamp-1">
                  {parsedData.experience?.map((e) => `${e.role} @ ${e.company}`).join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Education */}
          <div
            onClick={() => toggleOption('sync_education')}
            className="flex items-center justify-between rounded-2xl border border-[#FAF8F5]/15 bg-[#18181B] p-3.5 cursor-pointer hover:border-[#FAF8F5]/35 transition"
          >
            <div className="flex items-center gap-3">
              {options.sync_education ? (
                <CheckSquare className="h-4 w-4 text-[#FF6B6B]" />
              ) : (
                <Square className="h-4 w-4 text-neutral-500" />
              )}
              <div>
                <span className="text-xs font-semibold text-white">
                  Education ({parsedData.education?.length || 0})
                </span>
                <p className="text-[11px] text-neutral-400 line-clamp-1">
                  {parsedData.education?.map((e) => e.degree).join(', ')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#FAF8F5]/10 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#FF6B6B]/25 transition disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <span>{isSyncing ? 'Synchronizing...' : 'Confirm & Sync'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

