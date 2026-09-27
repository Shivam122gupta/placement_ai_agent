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
    <div className="bg-[#121214] border border-[#FAF8F5]/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 backdrop-blur-xl">
      {/* Top Header & Gauge */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#FAF8F5]/10">
        <div className="flex-1 space-y-2 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-white/10 text-[#FAF8F5] border border-white/20">
            <span className="p-1 rounded bg-white/10">
              <Sparkles className="h-3 w-3 text-[#FAF8F5]" />
            </span>
            <span>AI Placement Evaluator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#FAF8F5]">
            Candidate Match Diagnostics
          </h2>
          <p className="text-neutral-300 text-sm max-w-xl leading-relaxed font-sans">
            {match.summary_reasoning || `Objective assessment of candidate compatibility for ${jobTitle} at ${company}.`}
          </p>
        </div>

        <div className="shrink-0">
          <MatchScoreGauge score={match.overall_score} />
        </div>
      </div>

      {/* Sub-Scores Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-black/40 border border-[#FAF8F5]/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Technical Skills Alignment
            </span>
            <span className="text-2xl font-bold font-mono text-white">{match.skills_score}%</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FAF8F5]">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border border-[#FAF8F5]/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Experience & Career Level
            </span>
            <span className="text-2xl font-bold font-mono text-white">{match.experience_score}%</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FAF8F5]">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 2-Column Skills Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matched Skills */}
        <div className="p-5 rounded-2xl bg-black/30 border border-[#FAF8F5]/10 space-y-3">
          <div className="flex items-center space-x-2 text-white font-medium text-xs font-mono uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Verified Matched Competencies ({match.matched_skills.length})</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {match.skill_details
              .filter((d) => d.matched)
              .map((d, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#18181B] border border-[#FAF8F5]/10 flex flex-col justify-between hover:border-[#FAF8F5]/30 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{d.skill}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-[#FAF8F5] border border-white/15">
                      {d.is_required ? 'Required' : 'Bonus'}
                    </span>
                  </div>
                  {d.evidence_snippet && (
                    <span className="text-[11px] text-neutral-400 mt-1.5 italic">
                      📎 {d.evidence_snippet}
                    </span>
                  )}
                </div>
              ))}

            {match.matched_skills.length === 0 && (
              <p className="text-xs text-neutral-500 italic py-2">No matching skills identified in candidate profile.</p>
            )}
          </div>
        </div>

        {/* Missing Skills / Gaps */}
        <div className="p-5 rounded-2xl bg-black/30 border border-[#FAF8F5]/10 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-neutral-300 font-medium text-xs font-mono uppercase tracking-wider mb-3">
              <XCircle className="h-4 w-4 text-rose-400" />
              <span>Missing Skill Gaps ({match.missing_skills.length})</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {match.missing_skills.map((skill, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#18181B] border border-[#FAF8F5]/10 flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-neutral-200">{skill}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
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
              className="mt-4 w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-[#FF6B6B]/25 transition-all cursor-pointer active:scale-95"
            >
              <span>Bridge Gaps with AI Study Roadmap</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Recruiter Strengths & Key Gaps Summary */}
      {(match.strengths.length > 0 || match.key_gaps.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#FAF8F5]/10">
          {match.strengths.length > 0 && (
            <div className="p-4 rounded-2xl bg-black/40 border border-[#FAF8F5]/10 space-y-2">
              <span className="text-xs font-mono font-medium text-[#FAF8F5] uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#FAF8F5]" />
                <span>Key Candidate Strengths</span>
              </span>
              <ul className="space-y-1 text-xs text-neutral-300 pl-4 list-disc font-sans">
                {match.strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {match.key_gaps.length > 0 && (
            <div className="p-4 rounded-2xl bg-black/40 border border-[#FAF8F5]/10 space-y-2">
              <span className="text-xs font-mono font-medium text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-300" />
                <span>Primary Focus Areas</span>
              </span>
              <ul className="space-y-1 text-xs text-neutral-300 pl-4 list-disc font-sans">
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

