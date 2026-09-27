import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Sparkles,
  Compass,
  Layers,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { skillGapService } from '../services/skillGapService';
import { SkillGapRoadmap, RoadmapGenerateRequest } from '../types/skillGap';
import { RoadmapTimeline } from '../components/skillGap/RoadmapTimeline';

export const SkillGapsPage: React.FC = () => {
  const location = useLocation();
  const navState = location.state as { jobId?: string; targetRole?: string; gapSkills?: string[] } | null;

  const [roadmaps, setRoadmaps] = useState<SkillGapRoadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<SkillGapRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [targetRole, setTargetRole] = useState(navState?.targetRole || 'Full Stack Engineer');
  const [duration, setDuration] = useState<'1_week' | '2_weeks' | '1_month'>('2_weeks');
  const [customSkills, setCustomSkills] = useState(navState?.gapSkills?.join(', ') || 'Docker, Redis, System Design');

  const fetchRoadmaps = async () => {
    setLoading(true);
    try {
      const data = await skillGapService.listRoadmaps();
      setRoadmaps(data);
      if (data.length > 0 && !selectedRoadmap) {
        setSelectedRoadmap(data[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load saved roadmaps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);

    const skillsArray = customSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: RoadmapGenerateRequest = {
      target_role: targetRole.trim() || 'Software Engineer',
      duration_type: duration,
      job_id: navState?.jobId,
      custom_gap_skills: skillsArray.length > 0 ? skillsArray : undefined,
    };

    try {
      const newRoadmap = await skillGapService.generateRoadmap(payload);
      setRoadmaps([newRoadmap, ...roadmaps]);
      setSelectedRoadmap(newRoadmap);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate study roadmap');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleMilestone = async (index: number) => {
    if (!selectedRoadmap) return;
    try {
      const updated = await skillGapService.toggleMilestone(selectedRoadmap.id, index);
      setSelectedRoadmap(updated);
      setRoadmaps(roadmaps.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err: any) {
      console.error('Failed to toggle milestone:', err);
    }
  };

  const handleDeleteRoadmap = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this roadmap?')) return;
    try {
      await skillGapService.deleteRoadmap(id);
      const remaining = roadmaps.filter((r) => r.id !== id);
      setRoadmaps(remaining);
      setSelectedRoadmap(remaining.length > 0 ? remaining[0] : null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete roadmap');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 text-[#FAF8F5]">
      {/* Header */}
      <div className="border-b border-[#FAF8F5]/10 pb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-serif font-normal text-white">
            Skill Gap Roadmaps
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/25">
            Personalized Curriculum
          </span>
        </div>
        <p className="text-[#E8E2D6]/75 text-xs mt-1">
          Bridge missing technical requirements with AI-crafted, milestone-based preparation schedules.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center space-x-3 text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left Generator Form + Right Roadmap Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Generator & Saved Roadmaps */}
        <div className="lg:col-span-4 space-y-6">
          {/* Generation Card */}
          <div className="bg-[#121214] border border-[#FAF8F5]/15 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/20">
                <Sparkles className="h-4 w-4 text-[#FAF8F5]" />
              </div>
              <h2 className="text-sm font-semibold text-white">Create New Roadmap</h2>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-medium text-[#FAF8F5]/70 uppercase tracking-wider mb-1.5">
                  Target Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Backend Engineer, ML Specialist"
                  className="w-full bg-black/40 border border-[#FAF8F5]/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-medium text-[#FAF8F5]/70 uppercase tracking-wider mb-1.5">
                  Time Budget / Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '1_week', label: '1-Week', sub: 'Sprint' },
                    { id: '2_weeks', label: '2-Weeks', sub: 'Project' },
                    { id: '1_month', label: '1-Month', sub: 'Mastery' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDuration(t.id as any)}
                      className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                        duration === t.id
                          ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] text-white font-semibold border-none shadow-md shadow-[#FF6B6B]/25 active:scale-95'
                          : 'bg-black/30 border-[#FAF8F5]/15 text-neutral-400 hover:border-[#FAF8F5]/30'
                      }`}
                    >
                      <span className="block text-xs">{t.label}</span>
                      <span className="text-[10px] opacity-75 font-mono">{t.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-medium text-[#FAF8F5]/70 uppercase tracking-wider mb-1.5">
                  Skills to Master (Comma-separated)
                </label>
                <textarea
                  rows={3}
                  value={customSkills}
                  onChange={(e) => setCustomSkills(e.target.value)}
                  placeholder="e.g. Docker, Redis, Kubernetes, PostgreSQL"
                  className="w-full bg-black/40 border border-[#FAF8F5]/15 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#FAF8F5] resize-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-[#FF6B6B]/25 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {generating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Architecting Curriculum...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                    <span>Generate AI Roadmap</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Saved Roadmaps List */}
          <div className="bg-[#121214] border border-[#FAF8F5]/15 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-3">
            <h3 className="text-xs font-mono font-medium text-[#FAF8F5]/70 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-[#FAF8F5]" />
              <span>Saved Roadmaps ({roadmaps.length})</span>
            </h3>

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((n) => (
                  <div key={n} className="h-16 rounded-xl bg-black/40 animate-pulse" />
                ))}
              </div>
            ) : roadmaps.length === 0 ? (
              <p className="text-xs text-neutral-500 font-mono italic py-3 text-center">
                No roadmaps yet. Generate your first study plan above!
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {roadmaps.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoadmap(r)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedRoadmap?.id === r.id
                        ? 'bg-[#FAF8F5]/15 border-[#FAF8F5]/40 text-white shadow-md'
                        : 'bg-black/30 border-[#FAF8F5]/10 text-neutral-400 hover:border-[#FAF8F5]/25'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-white line-clamp-1">{r.target_role}</h4>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 mt-1">
                        <span className="capitalize">{r.duration_type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{r.milestones.length} Milestones</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoadmap(r.id);
                      }}
                      className="text-neutral-500 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Roadmap Viewer */}
        <div className="lg:col-span-8">
          {selectedRoadmap ? (
            <div className="space-y-6">
              {/* Header Bar */}
              <div className="bg-[#121214] border border-[#FAF8F5]/15 rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/25 capitalize">
                      {selectedRoadmap.duration_type.replace('_', ' ')} Curriculum
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">
                      Created {new Date(selectedRoadmap.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-normal text-white font-serif mt-1.5">
                    {selectedRoadmap.target_role}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-1.5 max-w-sm">
                  {selectedRoadmap.gap_skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-medium bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Interactive Milestones Timeline */}
              <RoadmapTimeline
                roadmap={selectedRoadmap}
                onToggleMilestone={handleToggleMilestone}
              />
            </div>
          ) : (
            <div className="bg-[#121214] border border-[#FAF8F5]/15 rounded-3xl p-16 text-center space-y-4 backdrop-blur-xl">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-[#FAF8F5]/10 border border-[#FAF8F5]/20 flex items-center justify-center text-[#FAF8F5]">
                <Compass className="h-7 w-7" />
              </div>
              <h3 className="text-sm font-semibold text-white">No Roadmap Selected</h3>
              <p className="text-xs text-[#E8E2D6]/75 max-w-md mx-auto">
                Select an existing roadmap from the left panel or generate a new study plan for your dream role.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
