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
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-indigo-100 to-indigo-400">
            Adaptive Skill Gap Roadmaps
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Personalized Curriculum
          </span>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Bridge missing technical requirements with AI-crafted, time-budgeted milestone roadmaps.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center space-x-3 text-red-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left Generator Form + Right Roadmap Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Generator & Saved Roadmaps */}
        <div className="lg:col-span-4 space-y-6">
          {/* Generation Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-100">Create New Roadmap</h2>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Target Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Backend Engineer, ML Specialist"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
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
                      className={`py-2 px-1 rounded-xl text-center border transition-all ${
                        duration === t.id
                          ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="block text-xs">{t.label}</span>
                      <span className="text-[10px] opacity-75 font-normal">{t.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Skills to Learn (Comma-separated)
                </label>
                <textarea
                  rows={3}
                  value={customSkills}
                  onChange={(e) => setCustomSkills(e.target.value)}
                  placeholder="e.g. Docker, Redis, Kubernetes, PostgreSQL"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Architecting Curriculum...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate AI Roadmap</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Saved Roadmaps List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Saved Roadmaps ({roadmaps.length})</span>
            </h3>

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((n) => (
                  <div key={n} className="h-16 rounded-xl bg-slate-950/60 animate-pulse" />
                ))}
              </div>
            ) : roadmaps.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-3 text-center">
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
                        ? 'bg-indigo-950/50 border-indigo-500 text-slate-100 shadow-md'
                        : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{r.target_role}</h4>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
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
                      className="text-slate-500 hover:text-red-400 p-1 rounded-lg transition-colors"
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
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize">
                      {selectedRoadmap.duration_type.replace('_', ' ')} Curriculum
                    </span>
                    <span className="text-xs text-slate-500">
                      Created {new Date(selectedRoadmap.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-100 mt-1">
                    {selectedRoadmap.target_role}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-1.5 max-w-sm">
                  {selectedRoadmap.gap_skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/50"
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
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Compass className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">No Roadmap Selected</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Select an existing roadmap from the left panel or generate a new study plan for your dream role.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
