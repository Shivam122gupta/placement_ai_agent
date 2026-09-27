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
    <div className="space-y-8 pb-12 text-[#FAF8F5]">
      {/* Editorial Welcome Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-[#FAF8F5]/20 bg-[#121214]/90 p-8 md:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-white/[0.02] blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FAF8F5]/10 border border-[#FAF8F5]/25 px-3.5 py-1 text-xs font-mono font-medium text-[#FAF8F5]">
            <span className="h-2 w-2 rounded-full bg-[#FAF8F5] animate-ping" />
            <span>Autonomous Career Intelligence Active</span>
          </div>

          <h1 className="mt-5 text-3xl md:text-5xl font-normal tracking-tight text-[#FAF8F5] font-serif">
            Welcome back, <span className="italic font-light text-[#FAF8F5] underline decoration-[#FAF8F5]/30">{candidateName}</span>
          </h1>

          <p className="mt-3 text-sm md:text-base text-[#E8E2D6] font-normal leading-relaxed max-w-2xl">
            Your personalized AI career workspace is synchronized. Real-time RAG memory is active across your resumes, portfolio projects, and targeted job opportunities.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              to="/resumes"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#FF6B6B]/25 transition-all cursor-pointer active:scale-95"
            >
              <FileText className="h-4 w-4 text-white" />
              <span>Upload / Sync Resume</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B6B]/10 px-5 py-2.5 text-xs font-medium text-[#FFA07A] hover:bg-[#FF6B6B]/20 hover:text-white border border-[#FF6B6B]/25 hover:border-[#FF6B6B]/50 transition-all cursor-pointer"
            >
              <Briefcase className="h-4 w-4 text-[#FFA07A]" />
              <span>Discover Matched Jobs</span>
            </Link>

            <Link
              to="/assistant"
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B6B]/10 px-5 py-2.5 text-xs font-medium text-[#FFA07A] hover:bg-[#FF6B6B]/20 hover:text-white border border-[#FF6B6B]/25 hover:border-[#FF6B6B]/50 transition-all cursor-pointer"
            >
              <Bot className="h-4 w-4 text-[#FFA07A]" />
              <span>Ask AI Copilot</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Profile Completion */}
        <div className="rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-5 shadow-lg backdrop-blur-md hover:border-[#FAF8F5]/35 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">Profile Readiness</span>
            <span className="text-xs font-mono font-bold text-[#FAF8F5] bg-[#FAF8F5]/15 px-2 py-0.5 rounded-md border border-[#FAF8F5]/25">{completionScore}%</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{completionScore}%</span>
            <span className="text-xs text-neutral-500 font-mono">completed</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[#FAF8F5] transition-all duration-700 shadow-[0_0_10px_rgba(250,248,245,0.4)]"
              style={{ width: `${completionScore}%` }}
            />
          </div>
        </div>

        {/* Skills Tagged */}
        <div className="rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-5 shadow-lg backdrop-blur-md hover:border-[#FAF8F5]/35 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">Verified Skills</span>
            <div className="p-1 rounded-md bg-[#FAF8F5]/10 border border-[#FAF8F5]/20">
              <Layers className="h-3.5 w-3.5 text-[#FAF8F5]" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{profile?.skills?.length || 0}</span>
            <span className="text-xs text-neutral-500 font-mono">skills cataloged</span>
          </div>
          <p className="mt-2 text-[10px] text-neutral-400 font-mono">Normalized taxonomy active</p>
        </div>

        {/* Projects */}
        <div className="rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-5 shadow-lg backdrop-blur-md hover:border-[#FAF8F5]/35 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">Portfolio Projects</span>
            <div className="p-1 rounded-md bg-[#FAF8F5]/10 border border-[#FAF8F5]/20">
              <TrendingUp className="h-3.5 w-3.5 text-[#FAF8F5]" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{profile?.projects?.length || 0}</span>
            <span className="text-xs text-neutral-500 font-mono">indexed projects</span>
          </div>
          <p className="mt-2 text-[10px] text-neutral-400 font-mono">Semantic RAG vector grounding</p>
        </div>

        {/* Target Roles */}
        <div className="rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-5 shadow-lg backdrop-blur-md hover:border-[#FAF8F5]/35 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">Target Track</span>
            <div className="p-1 rounded-md bg-[#FAF8F5]/10 border border-[#FAF8F5]/20">
              <Briefcase className="h-3.5 w-3.5 text-[#FAF8F5]" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-base font-semibold text-white truncate block">
              {profile?.target_roles?.[0] || 'Software Developer'}
            </span>
            <span className="text-xs font-mono text-neutral-400 mt-0.5 block">{profile?.experience_level || '0-1 years'}</span>
          </div>
          <p className="mt-2 text-[10px] text-neutral-500 font-mono">Discovery filter enabled</p>
        </div>
      </div>

      {/* Career Modules Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-normal text-white">Autonomous Career Pipeline</h2>
          <span className="text-xs font-mono text-[#FAF8F5]/70">9 Full-Stack Modules</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Module 1 */}
          <Link
            to="/resumes"
            className="group relative rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#FAF8F5]/40 hover:bg-[#FAF8F5]/[0.04] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.8),0_0_20px_-2px_rgba(250,248,245,0.08)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/20 group-hover:scale-105 group-hover:border-[#FAF8F5]/40 transition">
                <FileText className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-[#FAF8F5] group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">1. Resume Intelligence</h3>
            <p className="mt-1.5 text-xs text-[#E8E2D6]/75 leading-relaxed">
              Upload PDF or DOCX resumes. AI extracts structured skills, projects, and auto-syncs to your candidate profile.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5]/10 px-2 py-0.5 text-[10px] font-mono text-[#FAF8F5] border border-[#FAF8F5]/20">
                <CheckCircle2 className="h-3 w-3 text-[#FAF8F5]" />
                Zero Hallucination
              </span>
            </div>
          </Link>

          {/* Module 2 */}
          <Link
            to="/jobs"
            className="group relative rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#FAF8F5]/40 hover:bg-[#FAF8F5]/[0.04] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.8),0_0_20px_-2px_rgba(250,248,245,0.08)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/20 group-hover:scale-105 group-hover:border-[#FAF8F5]/40 transition">
                <Briefcase className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-[#FAF8F5] group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">2. Job Discovery & JD Analyzer</h3>
            <p className="mt-1.5 text-xs text-[#E8E2D6]/75 leading-relaxed">
              Discover real-time verified internships & jobs. Deconstruct job postings into required vs preferred skills.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5]/10 px-2 py-0.5 text-[10px] font-mono text-[#FAF8F5] border border-[#FAF8F5]/20">
                <Sparkles className="h-3 w-3 text-[#FAF8F5]" />
                AI JD Extraction
              </span>
            </div>
          </Link>

          {/* Module 3 */}
          <Link
            to="/skill-gaps"
            className="group relative rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#FAF8F5]/40 hover:bg-[#FAF8F5]/[0.04] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.8),0_0_20px_-2px_rgba(250,248,245,0.08)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/20 group-hover:scale-105 group-hover:border-[#FAF8F5]/40 transition">
                <GitCompare className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-[#FAF8F5] group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">3. Match Score & Study Roadmap</h3>
            <p className="mt-1.5 text-xs text-[#E8E2D6]/75 leading-relaxed">
              Hybrid deterministic & semantic matching algorithms pinpoint skill gaps and create custom 2-week learning roadmaps.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5]/10 px-2 py-0.5 text-[10px] font-mono text-[#FAF8F5] border border-[#FAF8F5]/20">
                <TrendingUp className="h-3 w-3 text-[#FAF8F5]" />
                70/30 Hybrid Algorithm
              </span>
            </div>
          </Link>

          {/* Module 4 */}
          <Link
            to="/interviews"
            className="group relative rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#FAF8F5]/40 hover:bg-[#FAF8F5]/[0.04] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.8),0_0_20px_-2px_rgba(250,248,245,0.08)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/20 group-hover:scale-105 group-hover:border-[#FAF8F5]/40 transition">
                <MessageSquare className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-[#FAF8F5] group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">4. Mock Interview Arena</h3>
            <p className="mt-1.5 text-xs text-[#E8E2D6]/75 leading-relaxed">
              Practice real-time technical & HR mock interviews. Receive rubric evaluations and question-by-question scoring.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5]/10 px-2 py-0.5 text-[10px] font-mono text-[#FAF8F5] border border-[#FAF8F5]/20">
                <Bot className="h-3 w-3 text-[#FAF8F5]" />
                AI Examiner
              </span>
            </div>
          </Link>

          {/* Module 5 */}
          <Link
            to="/memory"
            className="group relative rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#FAF8F5]/40 hover:bg-[#FAF8F5]/[0.04] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.8),0_0_20px_-2px_rgba(250,248,245,0.08)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/20 group-hover:scale-105 group-hover:border-[#FAF8F5]/40 transition">
                <Database className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-[#FAF8F5] group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">5. Semantic Memory (RAG)</h3>
            <p className="mt-1.5 text-xs text-[#E8E2D6]/75 leading-relaxed">
              Explore your vectorized candidate knowledge base. Perform natural-language searches over your projects & notes.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5]/10 px-2 py-0.5 text-[10px] font-mono text-[#FAF8F5] border border-[#FAF8F5]/20">
                <Database className="h-3 w-3 text-[#FAF8F5]" />
                Qdrant Cloud 384-d
              </span>
            </div>
          </Link>

          {/* Module 6 */}
          <Link
            to="/applications"
            className="group relative rounded-2xl border border-[#FAF8F5]/15 bg-[#121214] p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#FAF8F5]/40 hover:bg-[#FAF8F5]/[0.04] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.8),0_0_20px_-2px_rgba(250,248,245,0.08)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/20 group-hover:scale-105 group-hover:border-[#FAF8F5]/40 transition">
                <Send className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-[#FAF8F5] group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">6. Application Tracker</h3>
            <p className="mt-1.5 text-xs text-[#E8E2D6]/75 leading-relaxed">
              Track job submissions, interview stages, offer letters, and automatic calendar reminders across your pipeline.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5]/10 px-2 py-0.5 text-[10px] font-mono text-[#FAF8F5] border border-[#FAF8F5]/20">
                <Send className="h-3 w-3 text-[#FAF8F5]" />
                Pipeline Kanban
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
