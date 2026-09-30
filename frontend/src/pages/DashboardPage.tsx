import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { Profile } from '../types/profile';
import {
  Sparkles,
  Briefcase,
  GitCompare,
  ArrowRight,
  TrendingUp,
  FileText,
  Bot,
  MessageSquare,
  Send,
  Database,
  CheckCircle2,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileService.getProfile();
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const completionScore = profile?.completion_score || 0;
  const candidateName = profile?.full_name || user?.email?.split('@')[0] || 'Candidate';

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 text-[#FAF8F5] max-w-full">
      <SEO
        title="Dashboard — Hirxora Career Intelligence"
        description="Overview of candidate readiness, resume ATS score, active job matches, skill gaps, and mock interview analytics."
      />
      {/* Editorial Welcome Hero */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#FAF8F5]/20 bg-[#121214]/90 p-5 sm:p-7 md:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-white/[0.02] blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FAF8F5]/10 border border-[#FAF8F5]/25 px-3 py-1 text-[11px] sm:text-xs font-mono font-medium text-[#FAF8F5]">
            <span className="h-2 w-2 rounded-full bg-[#FAF8F5] animate-ping" />
            <span>AI Placement & Career Assistant Active</span>
          </div>

          <h1 className="mt-4 sm:mt-5 text-2xl sm:text-4xl md:text-5xl font-normal tracking-tight text-[#FAF8F5] font-serif break-words">
            Welcome back, <span className="italic font-light text-[#FAF8F5] underline decoration-[#FAF8F5]/30">{candidateName}</span>
          </h1>

          <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base text-[#E8E2D6] font-normal leading-relaxed max-w-2xl">
            Your all-in-one career command center. Optimize your resume for ATS, find matching job openings, bridge your skill gaps, and practice AI mock interviews to land your dream role.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3.5">
            <Link
              to="/resumes"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] px-5 py-3 sm:py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#FF6B6B]/25 transition-all cursor-pointer active:scale-95"
            >
              <FileText className="h-4 w-4 text-white shrink-0" />
              <span>Upload & Scan Resume</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
            
            <Link
              to="/jobs"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B6B]/10 px-5 py-3 sm:py-2.5 text-xs font-medium text-[#FFA07A] hover:bg-[#FF6B6B]/20 hover:text-white border border-[#FF6B6B]/25 hover:border-[#FF6B6B]/50 transition-all cursor-pointer"
            >
              <Briefcase className="h-4 w-4 text-[#FFA07A] shrink-0" />
              <span>Find Matching Jobs</span>
            </Link>

            <Link
              to="/assistant"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B6B]/10 px-5 py-3 sm:py-2.5 text-xs font-medium text-[#FFA07A] hover:bg-[#FF6B6B]/20 hover:text-white border border-[#FF6B6B]/25 hover:border-[#FF6B6B]/50 transition-all cursor-pointer"
            >
              <Bot className="h-4 w-4 text-[#FFA07A] shrink-0" />
              <span>Ask Career AI Copilot</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Profile Completion */}
        <div className="rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-4 sm:p-5 shadow-lg backdrop-blur-md hover:border-[#FAF8F5]/35 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">Profile Strength</span>
            <span className="text-xs font-mono font-bold text-[#FAF8F5] bg-[#FAF8F5]/15 px-2 py-0.5 rounded-md border border-[#FAF8F5]/25">{completionScore}%</span>
          </div>
          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono">{completionScore}%</span>
            <span className="text-xs text-neutral-400 font-mono">profile completed</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[#FAF8F5] transition-all duration-700 shadow-[0_0_10px_rgba(250,248,245,0.4)]"
              style={{ width: `${completionScore}%` }}
            />
          </div>
        </div>

        {/* Skills Tagged */}
        <div className="rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-4 sm:p-5 shadow-lg backdrop-blur-md hover:border-[#FAF8F5]/35 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">Your Verified Skills</span>
            <div className="p-1 rounded-md bg-[#FAF8F5]/10 border border-[#FAF8F5]/20">
              <Layers className="h-3.5 w-3.5 text-[#FAF8F5]" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono">{profile?.skills?.length || 0}</span>
            <span className="text-xs text-neutral-400 font-mono">skills detected</span>
          </div>
          <p className="mt-2 text-[10px] text-neutral-400 font-mono truncate">Extracted from your resume & profile</p>
        </div>

        {/* Projects */}
        <div className="rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-4 sm:p-5 shadow-lg backdrop-blur-md hover:border-[#FAF8F5]/35 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">Portfolio Projects</span>
            <div className="p-1 rounded-md bg-[#FAF8F5]/10 border border-[#FAF8F5]/20">
              <TrendingUp className="h-3.5 w-3.5 text-[#FAF8F5]" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono">{profile?.projects?.length || 0}</span>
            <span className="text-xs text-neutral-400 font-mono">projects indexed</span>
          </div>
          <p className="mt-2 text-[10px] text-neutral-400 font-mono truncate">Used to personalize AI interviews & jobs</p>
        </div>

        {/* Target Roles */}
        <div className="rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-4 sm:p-5 shadow-lg backdrop-blur-md hover:border-[#FAF8F5]/35 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">Target Career Track</span>
            <div className="p-1 rounded-md bg-[#FAF8F5]/10 border border-[#FAF8F5]/20">
              <Briefcase className="h-3.5 w-3.5 text-[#FAF8F5]" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <span className="text-sm sm:text-base font-semibold text-white truncate block">
              {profile?.target_roles?.[0] || 'Software Developer'}
            </span>
            <span className="text-xs font-mono text-neutral-400 mt-0.5 block truncate">Exp Level: {profile?.experience_level || '0-1 years'}</span>
          </div>
          <p className="mt-2 text-[10px] text-neutral-500 font-mono truncate">Job recommendations tailored to this role</p>
        </div>
      </div>

      {/* Career Modules Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-serif font-normal text-white">Placement Preparation Tools</h2>
          <span className="text-[11px] sm:text-xs font-mono text-[#FAF8F5]/70">6 Step-by-Step AI Modules</span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Module 1 */}
          <Link
            to="/resumes"
            className="group relative rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-4 sm:p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#FAF8F5]/40 hover:bg-[#FAF8F5]/[0.04] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.8),0_0_20px_-2px_rgba(250,248,245,0.08)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/20 group-hover:scale-105 group-hover:border-[#FAF8F5]/40 transition shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-[#FAF8F5] group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold text-white">1. Resume Intelligence & ATS Scanner</h3>
            <p className="mt-1.5 text-xs text-[#E8E2D6]/75 leading-relaxed">
              Upload your resume in PDF or DOCX format. Our AI extracts your skills, scores ATS compliance, and gives instant fix suggestions.
            </p>
            <div className="mt-3 sm:mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5]/10 px-2 py-0.5 text-[10px] font-mono text-[#FAF8F5] border border-[#FAF8F5]/20">
                <CheckCircle2 className="h-3 w-3 text-[#FAF8F5]" />
                Instant ATS Scoring
              </span>
            </div>
          </Link>

          {/* Module 2 */}
          <Link
            to="/jobs"
            className="group relative rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-4 sm:p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#FAF8F5]/40 hover:bg-[#FAF8F5]/[0.04] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.8),0_0_20px_-2px_rgba(250,248,245,0.08)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/20 group-hover:scale-105 group-hover:border-[#FAF8F5]/40 transition shrink-0">
                <Briefcase className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-[#FAF8F5] group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold text-white">2. Job Discovery & JD Analyzer</h3>
            <p className="mt-1.5 text-xs text-[#E8E2D6]/75 leading-relaxed">
              Explore verified job openings matching your profile, or paste any Job Description to extract essential requirements and required skills.
            </p>
            <div className="mt-3 sm:mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5]/10 px-2 py-0.5 text-[10px] font-mono text-[#FAF8F5] border border-[#FAF8F5]/20">
                <Sparkles className="h-3 w-3 text-[#FAF8F5]" />
                Job Matching & Extraction
              </span>
            </div>
          </Link>

          {/* Module 3 */}
          <Link
            to="/skill-gaps"
            className="group relative rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-4 sm:p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#FAF8F5]/40 hover:bg-[#FAF8F5]/[0.04] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.8),0_0_20px_-2px_rgba(250,248,245,0.08)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/20 group-hover:scale-105 group-hover:border-[#FAF8F5]/40 transition shrink-0">
                <GitCompare className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-[#FAF8F5] group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold text-white">3. Skill Gap Analysis & Study Plan</h3>
            <p className="mt-1.5 text-xs text-[#E8E2D6]/75 leading-relaxed">
              Compare your profile against any job description. Find missing skills and generate a personalized 2-week step-by-step study roadmap.
            </p>
            <div className="mt-3 sm:mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5]/10 px-2 py-0.5 text-[10px] font-mono text-[#FAF8F5] border border-[#FAF8F5]/20">
                <TrendingUp className="h-3 w-3 text-[#FAF8F5]" />
                Personalized 14-Day Roadmap
              </span>
            </div>
          </Link>

          {/* Module 4 */}
          <Link
            to="/interviews"
            className="group relative rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-4 sm:p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#FAF8F5]/40 hover:bg-[#FAF8F5]/[0.04] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.8),0_0_20px_-2px_rgba(250,248,245,0.08)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/20 group-hover:scale-105 group-hover:border-[#FAF8F5]/40 transition shrink-0">
                <MessageSquare className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-[#FAF8F5] group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold text-white">4. AI Mock Interview Practice</h3>
            <p className="mt-1.5 text-xs text-[#E8E2D6]/75 leading-relaxed">
              Practice realistic technical, system design, and HR interviews. Receive instant feedback, sample ideal answers, and performance scores.
            </p>
            <div className="mt-3 sm:mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5]/10 px-2 py-0.5 text-[10px] font-mono text-[#FAF8F5] border border-[#FAF8F5]/20">
                <Bot className="h-3 w-3 text-[#FAF8F5]" />
                Real-Time AI Interviewer
              </span>
            </div>
          </Link>

          {/* Module 5 */}
          <Link
            to="/memory"
            className="group relative rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-4 sm:p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#FAF8F5]/40 hover:bg-[#FAF8F5]/[0.04] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.8),0_0_20px_-2px_rgba(250,248,245,0.08)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/20 group-hover:scale-105 group-hover:border-[#FAF8F5]/40 transition shrink-0">
                <Database className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-[#FAF8F5] group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold text-white">5. Career Memory & Project Base</h3>
            <p className="mt-1.5 text-xs text-[#E8E2D6]/75 leading-relaxed">
              Search and manage your indexed projects, technical experiences, and interview notes to power personalized AI suggestions across the app.
            </p>
            <div className="mt-3 sm:mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5]/10 px-2 py-0.5 text-[10px] font-mono text-[#FAF8F5] border border-[#FAF8F5]/20">
                <Database className="h-3 w-3 text-[#FAF8F5]" />
                Indexed Career Knowledge
              </span>
            </div>
          </Link>

          {/* Module 6 */}
          <Link
            to="/applications"
            className="group relative rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-4 sm:p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#FAF8F5]/40 hover:bg-[#FAF8F5]/[0.04] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.8),0_0_20px_-2px_rgba(250,248,245,0.08)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/20 group-hover:scale-105 group-hover:border-[#FAF8F5]/40 transition shrink-0">
                <Send className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-[#FAF8F5] group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold text-white">6. Job Application Tracker</h3>
            <p className="mt-1.5 text-xs text-[#E8E2D6]/75 leading-relaxed">
              Track and organize all your job submissions, interview stages, follow-ups, and offer letters in an easy-to-use visual pipeline board.
            </p>
            <div className="mt-3 sm:mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5]/10 px-2 py-0.5 text-[10px] font-mono text-[#FAF8F5] border border-[#FAF8F5]/20">
                <Send className="h-3 w-3 text-[#FAF8F5]" />
                Interactive Pipeline Board
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
