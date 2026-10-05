import React from 'react';
import {
  CheckCircle2,
  Circle,
  BookOpen,
  Code2,
  Sparkles,
  Youtube,
  ExternalLink,
  PlaySquare,
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

              {/* YouTube Playlists & Courses */}
              {((milestone.youtube_playlists && milestone.youtube_playlists.length > 0) || milestone.target_skills.length > 0) && (
                <div className="mt-4 pt-3 border-t border-[#FAF8F5]/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Youtube className="h-4 w-4 text-red-500 fill-red-500/20" />
                      <span>Suggested YouTube Playlists & Courses</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {(milestone.youtube_playlists && milestone.youtube_playlists.length > 0
                      ? milestone.youtube_playlists
                      : milestone.target_skills.slice(0, 2).map((skill) => ({
                          title: `${skill} — Curated YouTube Playlists`,
                          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + ' full course playlist tutorial')}&sp=EgIQAw%253D%253D`,
                          channel_title: 'YouTube Search',
                          thumbnail_url: undefined,
                        }))
                    ).map((yt, yIdx) => (
                      <a
                        key={yIdx}
                        href={yt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/yt flex items-center space-x-3 p-2.5 rounded-2xl bg-[#1a1a1e] border border-red-500/20 hover:border-red-500/50 hover:bg-red-950/10 transition-all duration-200"
                      >
                        {yt.thumbnail_url ? (
                          <img
                            src={yt.thumbnail_url}
                            alt={yt.title}
                            className="h-12 w-20 object-cover rounded-xl border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center shrink-0 group-hover/yt:bg-red-600/30 transition-colors">
                            <PlaySquare className="h-5 w-5 text-red-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-medium text-white group-hover/yt:text-red-300 transition-colors truncate">
                            {yt.title}
                          </h4>
                          <span className="text-[10px] font-mono text-neutral-400 flex items-center space-x-1 mt-0.5">
                            <span>{yt.channel_title || 'YouTube Playlist'}</span>
                            <ExternalLink className="h-2.5 w-2.5 text-neutral-500 group-hover/yt:text-red-400" />
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

