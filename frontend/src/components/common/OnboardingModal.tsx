import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  Briefcase,
  Bot,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Target,
  Compass,
} from 'lucide-react';
import { profileService } from '../../services/profileService';
import { analytics } from '../../utils/analytics';

interface OnboardingModalProps {
  isOpen?: boolean;
  onClose: () => void;
  candidateName?: string;
  initialRole?: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen = true,
  onClose,
  candidateName = 'Candidate',
  initialRole = '',
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [targetRole, setTargetRole] = useState(initialRole || 'Full Stack Engineer');
  const [targetLevel, setTargetLevel] = useState('Entry-Level / College Graduate');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialRole) setTargetRole(initialRole);
  }, [initialRole]);

  if (!isOpen) return null;

  const popularRoles = [
    'Full Stack Engineer',
    'Backend Engineer (Python / FastAPI)',
    'Frontend Engineer (React / TypeScript)',
    'AI / Machine Learning Engineer',
    'Cloud & DevOps Engineer',
    'Data Analyst / Scientist',
  ];

  const levels = [
    'Student / Fresh Graduate',
    'Entry-Level (0 - 2 years)',
    'Mid-Level (2 - 5 years)',
    'Senior (5+ years)',
  ];

  const handleFinish = async (redirectPath?: string) => {
    setIsSaving(true);
    try {
      if (targetRole) {
        await profileService.updateProfile({
          target_roles: [targetRole],
        });
      }
      analytics.trackEvent('feature', 'onboarding_completed', targetRole);
    } catch {
      // Continue even if profile update fails
    } finally {
      setIsSaving(false);
      localStorage.setItem('hirxora_onboarding_completed', 'true');
      onClose();
      if (redirectPath) {
        navigate(redirectPath);
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('hirxora_onboarding_completed', 'true');
    analytics.trackEvent('feature', 'onboarding_dismissed');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#FAF8F5]/20 bg-[#100E11] p-6 sm:p-8 md:p-10 shadow-2xl text-[#FAF8F5] overflow-hidden space-y-6">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-16 h-48 w-96 rounded-full bg-[#FF6B6B]/15 blur-3xl pointer-events-none" />

        {/* Header & Steps Indicator */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep === step
                    ? 'w-8 bg-[#FF6B6B]'
                    : currentStep > step
                    ? 'w-4 bg-[#FF6B6B]/50'
                    : 'w-4 bg-white/10'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleDismiss}
            className="rounded-full p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close Tour"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step 1: Welcome & Overview */}
        {currentStep === 1 && (
          <div className="space-y-6 py-2 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 px-3 py-1 text-xs font-mono text-[#FFA07A]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Welcome to Hirxora</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-normal text-white">
                Hello, {candidateName}! Let's launch your career.
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans max-w-xl">
                Hirxora is your intelligent career co-pilot designed to guide you from resume optimization to landing high-paying software and engineering offers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                <div className="rounded-xl bg-[#FF6B6B]/15 text-[#FFA07A] p-2.5 w-fit">
                  <FileText className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-semibold text-white">ATS Resume Engine</h4>
                <p className="text-[11px] text-neutral-400">
                  Instant ATS parse, keyword gap scoring, and AI suggestions.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                <div className="rounded-xl bg-[#FA7268]/15 text-[#FA7268] p-2.5 w-fit">
                  <Bot className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-semibold text-white">AI Mock Interview</h4>
                <p className="text-[11px] text-neutral-400">
                  Practice behavioral & technical rounds with audio & live scorecards.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                <div className="rounded-xl bg-[#FFA07A]/15 text-[#FFA07A] p-2.5 w-fit">
                  <Briefcase className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-semibold text-white">Smart Match & Pipeline</h4>
                <p className="text-[11px] text-neutral-400">
                  Match real openings and track applications in a unified Kanban.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Target Role & Preferences */}
        {currentStep === 2 && (
          <div className="space-y-6 py-2 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 px-3 py-1 text-xs font-mono text-[#FFA07A]">
              <Target className="h-3.5 w-3.5" />
              <span>Step 2 of 3 • Career Focus</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-normal text-white">
                What is your target role?
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
                We'll tailor your resume scoring, mock interview questions, and job recommendations to this career track.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                Select or customize target role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {popularRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      targetRole === role
                        ? 'border-[#FF6B6B] bg-[#FF6B6B]/15 text-white font-semibold'
                        : 'border-white/10 bg-white/[0.02] text-neutral-300 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Or type custom role (e.g. iOS Developer, Blockchain Engineer)"
                className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-[#FF6B6B] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                Current Experience Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {levels.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setTargetLevel(lvl)}
                    className={`p-2.5 rounded-xl border text-[11px] text-center transition cursor-pointer ${
                      targetLevel === lvl
                        ? 'border-[#FF6B6B] bg-[#FF6B6B]/15 text-white font-semibold'
                        : 'border-white/10 bg-white/[0.02] text-neutral-300 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Quick Start Options */}
        {currentStep === 3 && (
          <div className="space-y-6 py-2 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 px-3 py-1 text-xs font-mono text-[#FFA07A]">
              <Compass className="h-3.5 w-3.5" />
              <span>Step 3 of 3 • Ready for Lift-off</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-normal text-white">
                How would you like to begin?
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
                Choose an action below to kickstart your preparation, or jump straight into your dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleFinish('/resumes')}
                className="group flex flex-col items-center justify-center p-5 rounded-2xl border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 text-center space-y-2 transition cursor-pointer hover:scale-105 active:scale-95"
              >
                <div className="rounded-xl bg-[#FF6B6B] p-3 text-white shadow-lg shadow-[#FF6B6B]/30 group-hover:scale-110 transition">
                  <FileText className="h-6 w-6" />
                </div>
                <h4 className="text-xs font-semibold text-white">Upload Resume</h4>
                <p className="text-[11px] text-neutral-300">Run ATS scan & skill breakdown</p>
              </button>

              <button
                type="button"
                onClick={() => handleFinish('/interviews')}
                className="group flex flex-col items-center justify-center p-5 rounded-2xl border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] text-center space-y-2 transition cursor-pointer hover:scale-105 active:scale-95"
              >
                <div className="rounded-xl bg-neutral-800 p-3 text-[#FFA07A] group-hover:scale-110 transition">
                  <Bot className="h-6 w-6" />
                </div>
                <h4 className="text-xs font-semibold text-white">Mock Interview</h4>
                <p className="text-[11px] text-neutral-400">Practice questions with AI coach</p>
              </button>

              <button
                type="button"
                onClick={() => handleFinish('/jobs')}
                className="group flex flex-col items-center justify-center p-5 rounded-2xl border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] text-center space-y-2 transition cursor-pointer hover:scale-105 active:scale-95"
              >
                <div className="rounded-xl bg-neutral-800 p-3 text-white group-hover:scale-110 transition">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h4 className="text-xs font-semibold text-white">Explore Jobs</h4>
                <p className="text-[11px] text-neutral-400">Find active matching openings</p>
              </button>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-neutral-400 hover:text-white transition cursor-pointer"
            >
              Skip Tour
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-[#FF6B6B]/25 transition active:scale-95 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleFinish()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-[#FF6B6B]/25 transition active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Saving...' : 'Enter Dashboard'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default OnboardingModal;
