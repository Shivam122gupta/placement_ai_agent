import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { JobMatch } from '../../types/matching';
import { MatchScoreGauge } from './MatchScoreGauge';

interface Props {
  match: JobMatch;
  jobTitle: string;
  company: string;
}

export const MatchBreakdownCard: React.FC<Props> = ({ match, jobTitle, company }) => {
  const navigate = useNavigate();

  const handleGenerateRoadmap = () => {
    navigate('/skill-gaps', {
      state: {
        jobId: match.job_id,
        targetRole: `${jobTitle} at ${company}`,
        gapSkills: match.missing_skills,
      },
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
      {/* Top Header & Gauge */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="flex-1 space-y-2 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Placement Evaluator</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Candidate Match Diagnostics</h2>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
            {match.summary_reasoning || `Objective assessment of candidate compatibility for ${jobTitle} at ${company}.`}
          </p>
        </div>

        <div className="shrink-0">
          <MatchScoreGauge score={match.overall_score} />
        </div>
      </div>

      {/* Sub-Scores Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
              Technical Skills Alignment
            </span>
            <span className="text-xl font-bold text-indigo-400">{match.skills_score}%</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
              Experience & Career Level
            </span>
            <span className="text-xl font-bold text-purple-400">{match.experience_score}%</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3-Column Skills Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matched Skills */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/20 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Verified Matched Competencies ({match.matched_skills.length})</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {match.skill_details
              .filter((d) => d.matched)
              .map((d, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">{d.skill}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {d.is_required ? 'Required' : 'Bonus'}
                    </span>
                  </div>
                  {d.evidence_snippet && (
                    <span className="text-[11px] text-slate-400 mt-1 italic">
                      📎 {d.evidence_snippet}
                    </span>
                  )}
                </div>
              ))}

            {match.matched_skills.length === 0 && (
              <p className="text-xs text-slate-500 italic py-2">No matching skills identified in candidate profile.</p>
            )}
          </div>
        </div>

        {/* Missing Skills / Gaps */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-red-500/20 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-red-400 font-bold text-sm mb-3">
              <XCircle className="h-4 w-4" />
              <span>Missing Skill Gaps ({match.missing_skills.length})</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {match.missing_skills.map((skill, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between"
                >
                  <span className="text-xs font-bold text-red-300">{skill}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    Action Required
                  </span>
                </div>
              ))}

              {match.missing_skills.length === 0 && (
                <p className="text-xs text-emerald-400 italic py-2">All primary requirements fully satisfied!</p>
              )}
            </div>
          </div>

          {match.missing_skills.length > 0 && (
            <button
              onClick={handleGenerateRoadmap}
              className="mt-4 w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
            >
              <span>Bridge Gaps with AI Study Roadmap</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Recruiter Strengths & Key Gaps Summary */}
      {(match.strengths.length > 0 || match.key_gaps.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          {match.strengths.length > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Key Candidate Strengths</span>
              </span>
              <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
                {match.strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {match.key_gaps.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/20 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Primary Focus Areas</span>
              </span>
              <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
                {match.key_gaps.map((g, idx) => (
                  <li key={idx}>{g}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
