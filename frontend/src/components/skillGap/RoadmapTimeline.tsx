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
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
            <Sparkles className="h-4 w-4" />
            <span>Curriculum Progress ({completedCount}/{roadmap.milestones.length} Milestones)</span>
          </div>
          <span className="text-sm font-bold text-slate-100">{progressPercent}%</span>
        </div>

        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {roadmap.readiness_impact && (
          <p className="text-xs text-slate-400 italic pt-1">
            🚀 Impact: {roadmap.readiness_impact}
          </p>
        )}
      </div>

      {/* Timeline Milestones */}
      <div className="relative pl-6 sm:pl-8 space-y-6 border-l-2 border-slate-800/80 ml-4 sm:ml-6">
        {roadmap.milestones.map((milestone, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline bullet dot / checkmark button */}
            <button
              onClick={() => onToggleMilestone(idx)}
              className={`absolute -left-[35px] sm:-left-[43px] top-1.5 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 border ${
                milestone.completed
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-indigo-500'
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
              className={`p-6 rounded-2xl border transition-all duration-200 ${
                milestone.completed
                  ? 'bg-slate-900/60 border-emerald-500/30 opacity-80'
                  : 'bg-slate-900 border-slate-800 hover:border-indigo-500/50 shadow-xl'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {milestone.day_or_week}
                  </span>
                  <h3 className={`text-base font-bold text-slate-100 ${milestone.completed ? 'line-through text-slate-400' : ''}`}>
                    {milestone.title}
                  </h3>
                </div>
                {milestone.completed && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
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
                      className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-950 text-slate-300 border border-slate-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Key Topics List */}
              {milestone.key_topics.length > 0 && (
                <div className="mb-4 space-y-1.5">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Key Topics & Concepts</span>
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
                    {milestone.key_topics.map((topic, tIdx) => (
                      <li key={tIdx}>{topic}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Practice Project Idea */}
              {milestone.practice_project_idea && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/20 mb-4 flex items-start space-x-3">
                  <Code2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-indigo-300 block mb-0.5">
                      Hands-on Portfolio Deliverable:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {milestone.practice_project_idea}
                    </p>
                  </div>
                </div>
              )}

              {/* Recommended Resources */}
              {milestone.recommended_resources.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Resources:</span>
                  {milestone.recommended_resources.map((res, rIdx) => (
                    <span
                      key={rIdx}
                      className="inline-flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
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
