import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Briefcase,
  Calendar,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { jobService } from '../services/jobService';
import { matchingService } from '../services/matchingService';
import { Job } from '../types/job';
import { JobMatch } from '../types/matching';
import { MatchBreakdownCard } from '../components/matching/MatchBreakdownCard';

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [match, setMatch] = useState<JobMatch | null>(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobAndMatch = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await jobService.getJobById(id);
        setJob(data);

        // Fetch or calculate live candidate match
        setMatchingLoading(true);
        try {
          const matchData = await matchingService.getJobMatch(id);
          setMatch(matchData);
        } catch (mErr) {
          console.warn('Could not compute live match:', mErr);
        } finally {
          setMatchingLoading(false);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJobAndMatch();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <div className="h-96 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <p className="text-red-400 mb-4">{error || 'Job not found'}</p>
        <button
          onClick={() => navigate('/jobs')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-sm font-medium"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  const req = job.requirements || {};

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Live Pipeline</span>
        </button>

        <div className="flex items-center space-x-3">
          {job.source_url && (
            <a
              href={job.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              <span>Apply on Company Portal</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start space-x-5">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Building2 className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">{job.title}</h1>
              <p className="text-indigo-400 font-semibold text-lg mt-0.5">{job.company}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <span>{job.location}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                  <span>{job.employment_type}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>Verified: {new Date(job.last_verified_at).toLocaleDateString()}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end justify-center space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
              <span>Deduplicated & Verified</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Hash: {job.dedup_hash.slice(0, 12)}...</span>
          </div>
        </div>
      </div>

      {/* Live AI Match Evaluation Card */}
      {match ? (
        <MatchBreakdownCard
          match={match}
          jobTitle={job.title}
          company={job.company}
        />
      ) : matchingLoading ? (
        <div className="h-64 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse flex items-center justify-center text-slate-400 text-sm">
          <span>Computing Candidate-Job Match Fit...</span>
        </div>
      ) : null}

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold mb-4">
            <CheckCircle2 className="h-5 w-5" />
            <h2 className="text-base text-slate-100">Mandatory Required Skills</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {req.required_skills?.map((s, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-950/70 text-indigo-300 border border-indigo-700/50 shadow-sm"
              >
                {s}
              </span>
            ))}
            {(!req.required_skills || req.required_skills.length === 0) && (
              <span className="text-slate-500 text-xs italic">No specific hard skills isolated.</span>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
          <div className="flex items-center space-x-2 text-purple-400 font-bold mb-4">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-base text-slate-100">Preferred / Bonus Skills</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {req.preferred_skills?.map((s, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 text-slate-300 border border-slate-800 shadow-sm"
              >
                {s}
              </span>
            ))}
            {(!req.preferred_skills || req.preferred_skills.length === 0) && (
              <span className="text-slate-500 text-xs italic">No secondary skills specified.</span>
            )}
          </div>
        </div>
      </div>

      {/* Requirements Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-lg space-y-6">
        <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-indigo-400" />
          <span>Role Requirements & Responsibilities</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">
              Minimum Experience
            </span>
            <p className="text-base font-bold text-slate-200">{req.min_experience_years || 0} Years Required</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">
              Education Requirement
            </span>
            <p className="text-base font-bold text-slate-200">
              {req.required_education || "Bachelor's in CS / Engineering or Equivalent"}
            </p>
          </div>
        </div>

        {req.responsibilities && req.responsibilities.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Key Responsibilities</h3>
            <ul className="space-y-2 text-sm text-slate-300 pl-4 list-disc">
              {req.responsibilities.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Original Job Description</h3>
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {job.description_raw}
          </div>
        </div>
      </div>
    </div>
  );
};
