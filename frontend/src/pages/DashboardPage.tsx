import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { Profile } from '../types/profile';
import {
  Sparkles,
  Briefcase,
  GitCompare,
  Award,
  ArrowRight,
  TrendingUp,
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

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-r from-brand-950/80 via-gray-900 to-gray-900 p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 border border-brand-500/30 px-3 py-1 text-xs font-semibold text-brand-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Autonomous Placement Agent Active</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Welcome back, {profile?.full_name || user?.email?.split('@')[0]} 👋
          </h1>
          <p className="mt-2 text-sm text-gray-300">
            Your personal AI career agent is ready to parse your resume, match job descriptions, analyze skill gaps, and run mock interviews.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 transition"
            >
              <span>Manage Profile</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-800/80 px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-gray-800 border border-gray-700/60 transition"
            >
              <Briefcase className="h-4 w-4 text-brand-400" />
              <span>Explore Jobs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Profile Completion */}
        <div className="rounded-2xl border border-gray-800 bg-[#111827]/80 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Profile Readiness</span>
            <span className="text-xs font-bold text-brand-400">{completionScore}%</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{completionScore}%</span>
            <span className="text-xs text-gray-400">completed</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${completionScore}%` }}
            />
          </div>
        </div>

        {/* Skills Tagged */}
        <div className="rounded-2xl border border-gray-800 bg-[#111827]/80 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Verified Skills</span>
            <Award className="h-4 w-4 text-yellow-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{profile?.skills?.length || 0}</span>
            <span className="text-xs text-gray-400">skills cataloged</span>
          </div>
          <p className="mt-2 text-xs text-gray-400">Used for deterministic matching</p>
        </div>

        {/* Projects */}
        <div className="rounded-2xl border border-gray-800 bg-[#111827]/80 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Projects Added</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{profile?.projects?.length || 0}</span>
            <span className="text-xs text-gray-400">portfolio projects</span>
          </div>
          <p className="mt-2 text-xs text-gray-400">Grounded in semantic RAG memory</p>
        </div>

        {/* Target Roles */}
        <div className="rounded-2xl border border-gray-800 bg-[#111827]/80 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Target Track</span>
            <Briefcase className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-4">
            <span className="text-lg font-bold text-white line-clamp-1">
              {profile?.target_roles?.[0] || 'Software Developer'}
            </span>
            <span className="text-xs text-gray-400">{profile?.experience_level || '0-1 years'}</span>
          </div>
          <p className="mt-2 text-xs text-gray-400">Discovery filter active</p>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Career Intelligence Pipeline</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Link
            to="/resumes"
            className="group rounded-2xl border border-gray-800 bg-[#111827]/70 p-6 shadow-md transition hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-brand-500/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 group-hover:scale-110 transition">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">1. Resume Intelligence</h3>
            <p className="mt-1 text-xs text-gray-400 leading-relaxed">
              Upload PDF or DOCX resumes. AI extracts structured skills, projects, and populates your profile automatically.
            </p>
          </Link>

          <Link
            to="/jobs"
            className="group rounded-2xl border border-gray-800 bg-[#111827]/70 p-6 shadow-md transition hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-cyan-500/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">2. Job Discovery & JD Analyzer</h3>
            <p className="mt-1 text-xs text-gray-400 leading-relaxed">
              Discover real-time verified internships & developer roles. Analyze JDs to separate required vs preferred skills.
            </p>
          </Link>

          <Link
            to="/skill-gaps"
            className="group rounded-2xl border border-gray-800 bg-[#111827]/70 p-6 shadow-md transition hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-purple-500/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition">
              <GitCompare className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">3. Hybrid Match & Study Roadmap</h3>
            <p className="mt-1 text-xs text-gray-400 leading-relaxed">
              Get fact-grounded match percentages, identify skill gaps, and generate customized 2-week preparation roadmaps.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};
