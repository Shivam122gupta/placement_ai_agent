import React from 'react';
import {
  CheckCircle2,
  Circle,
  BookOpen,
  Code2,
  Sparkles,
} from 'lucide-react';
import { SkillGapRoadmap } from '../../types/skillGap';

interface Props {
  roadmap: SkillGapRoadmap;
  onToggleMilestone: (index: number) => void;
}

export const RoadmapTimeline: React.FC<Props> = ({ roadmap, onToggleMilestone }) => {
  const completedCount = roadmap.milestones.filter((m) => m.completed).length;
  const progressPercent = roadmap.milestones.length > 0
    ? Math.round((completedCount / roadmap.milestones.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Roadmap Progress Bar */}
      <div className="p-6 rounded-3xl bg-[#121214] border border-[#FAF8F5]/15 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[#FAF8F5] font-semibold text-xs font-mono uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-[#FAF8F5]" />
            <span>Curriculum Progress ({completedCount}/{roadmap.milestones.length} Milestones)</span>
          </div>
          <span className="text-sm font-bold font-mono text-white">{progressPercent}%</span>
        </div>

        <div className="w-full bg-black/50 rounded-full h-3 overflow-hidden border border-[#FAF8F5]/15">
          <div
            className="bg-[#FAF8F5] h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.4)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {roadmap.readiness_impact && (
          <p className="text-xs text-neutral-300 italic pt-1 font-sans">
            🚀 Impact: {roadmap.readiness_impact}
          </p>
        )}
      </div>

      {/* Timeline Milestones */}
      <div className="relative pl-6 sm:pl-8 space-y-6 border-l-2 border-[#FAF8F5]/20 ml-4 sm:ml-6">
        {roadmap.milestones.map((milestone, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline bullet dot / checkmark button */}
            <button
              onClick={() => onToggleMilestone(idx)}
              className={`absolute -left-[35px] sm:-left-[43px] top-1.5 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 border cursor-pointer ${
                milestone.completed
                  ? 'bg-[#FAF8F5] text-black border-white shadow-lg shadow-white/20'
                  : 'bg-[#121214] text-neutral-400 border-[#FAF8F5]/30 hover:border-[#FAF8F5] hover:text-white'
              }`}
              title="Click to toggle completion"
            >
              {milestone.completed ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>

            {/* Milestone Card */}
            <div
              className={`p-6 rounded-3xl border transition-all duration-200 ${
                milestone.completed
                  ? 'bg-[#121214]/70 border-[#FAF8F5]/20 opacity-80'
                  : 'bg-[#121214] border-[#FAF8F5]/15 hover:border-[#FAF8F5]/40 shadow-xl'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-xl text-xs font-mono font-medium bg-white/10 text-[#FAF8F5] border border-white/20">
                    {milestone.day_or_week}
                  </span>
                  <h3 className={`text-base font-semibold text-white ${milestone.completed ? 'line-through text-neutral-400' : ''}`}>
                    {milestone.title}
                  </h3>
                </div>
                {milestone.completed && (
                  <span className="text-xs font-mono font-medium text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Completed</span>
                  </span>
                )}
              </div>

              {/* Target Skills Pills */}
              {milestone.target_skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {milestone.target_skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium bg-white/5 text-[#FAF8F5] border border-white/10"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Key Topics List */}
              {milestone.key_topics.length > 0 && (
                <div className="mb-4 space-y-1.5">
                  <span className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-[#FAF8F5]" />
                    <span>Key Topics & Concepts</span>
                  </span>
                  <ul className="space-y-1 text-xs text-neutral-300 pl-4 list-disc font-sans">
                    {milestone.key_topics.map((topic, tIdx) => (
                      <li key={tIdx}>{topic}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Practice Project Idea */}
              {milestone.practice_project_idea && (
                <div className="p-3.5 rounded-2xl bg-black/40 border border-[#FAF8F5]/15 mb-4 flex items-start space-x-3">
                  <Code2 className="h-4 w-4 text-[#FAF8F5] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-mono font-medium text-[#FAF8F5] block mb-0.5 uppercase">
                      Hands-on Portfolio Deliverable:
                    </span>
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                      {milestone.practice_project_idea}
                    </p>
                  </div>
                </div>
              )}

              {/* Recommended Resources */}
              {milestone.recommended_resources.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#FAF8F5]/10">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Resources:</span>
                  {milestone.recommended_resources.map((res, rIdx) => (
                    <span
                      key={rIdx}
                      className="inline-flex items-center space-x-1 text-xs text-neutral-300 hover:text-white hover:underline font-mono"
                    >
                      <span>{res}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

