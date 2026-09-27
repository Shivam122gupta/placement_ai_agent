import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Sparkles,
  Play,
  CheckCircle2,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { interviewService } from '../services/interviewService';
import { MockInterviewSummaryItem, GenerateInterviewRequest } from '../types/interview';

export const InterviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<MockInterviewSummaryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [role, setRole] = useState<string>('Junior Backend Engineer');
  const [experienceLevel, setExperienceLevel] = useState<string>('0-1 years');
  const [numQuestions, setNumQuestions] = useState<number>(5);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const data = await interviewService.listInterviews();
      setInterviews(data);
    } catch (err) {
      console.error('Failed to load interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim()) return;

    try {
      setGenerating(true);
      setError(null);
      const payload: GenerateInterviewRequest = {
        role: role.trim(),
        experience_level: experienceLevel,
        num_questions: numQuestions,
      };
      const session = await interviewService.generateInterview(payload);
      navigate(`/interviews/${session.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate mock interview session.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (interviewId: string) => {
    try {
      await interviewService.deleteInterview(interviewId);
      setInterviews((prev) => prev.filter((i) => i.id !== interviewId));
    } catch (err) {
      console.error('Failed to delete interview:', err);
    }
  };

  // Stats
  const completedCount = interviews.filter((i) => i.status === 'COMPLETED').length;
  const scoredInterviews = interviews.filter((i) => i.overall_score !== null && i.overall_score !== undefined);
  const avgScore =
    scoredInterviews.length > 0
      ? Math.round(scoredInterviews.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) / scoredInterviews.length)
      : null;

  return (
    <div className="space-y-8 pb-16 text-[#FAF8F5]">
      {/* Header & Stats Banner */}
      <div className="bg-[#121214] border border-[#FAF8F5]/20 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F5]/10 border border-[#FAF8F5]/25 text-[#FAF8F5] text-xs font-mono tracking-wide uppercase">
              <span className="p-1 rounded bg-[#FAF8F5]/20">
                <MessageSquare className="w-3.5 h-3.5 text-[#FAF8F5]" />
              </span>
              AI Mock Interview Arena
            </div>
            <h1 className="text-2xl md:text-4xl font-normal tracking-tight text-white font-serif">
              Interview Preparation Arena
            </h1>
            <p className="text-neutral-400 max-w-2xl text-xs md:text-sm leading-relaxed font-sans">
              Simulate realistic technical, project deep-dive, system design, and STAR behavioral interviews with real-time 3-pillar scoring.
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-6 pt-6 border-t border-[#FAF8F5]/10 grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
          <div className="bg-[#18181B]/80 p-4 rounded-2xl border border-[#FAF8F5]/15">
            <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Total Sessions</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">{interviews.length}</p>
          </div>
          <div className="bg-[#18181B]/80 p-4 rounded-2xl border border-[#FAF8F5]/15">
            <p className="text-[11px] font-mono text-[#FAF8F5]/70 uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">{completedCount}</p>
          </div>
          <div className="bg-[#18181B]/80 p-4 rounded-2xl border border-[#FAF8F5]/15">
            <p className="text-[11px] font-mono text-[#FAF8F5]/70 uppercase tracking-wider">Average Score</p>
            <p className="text-2xl font-bold text-white mt-1 font-mono">
              {avgScore !== null ? `${avgScore}%` : 'N/A'}
            </p>
          </div>
          <div className="bg-[#18181B]/80 p-4 rounded-2xl border border-[#FAF8F5]/15">
            <p className="text-[11px] font-mono text-[#FAF8F5]/70 uppercase tracking-wider">Rubric Evaluation</p>
            <p className="text-xs font-semibold text-white mt-2 font-mono">
              Tech • Depth • STAR
            </p>
          </div>
        </div>
      </div>

      {/* Start New Mock Interview Form */}
      <div className="bg-[#121214] border border-[#FAF8F5]/20 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-serif font-medium text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FAF8F5]" />
            Launch Customized Mock Interview
          </h2>
          <p className="text-neutral-400 text-xs font-sans">
            Questions are synthesized specifically from your verified skills and actual resume projects.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleStartInterview} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-mono font-semibold text-[#FAF8F5]/70 uppercase mb-1.5">
              Target Role / Domain
            </label>
            <input
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Backend Engineer, Full Stack Dev"
              className="w-full bg-[#18181B] border border-[#FAF8F5]/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#FAF8F5]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-semibold text-[#FAF8F5]/70 uppercase mb-1.5">
              Experience Level
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full bg-[#18181B] border border-[#FAF8F5]/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FAF8F5] cursor-pointer"
            >
              <option value="Fresher / 0-1 years">Fresher / 0-1 years</option>
              <option value="1-3 years">Junior (1-3 years)</option>
              <option value="Internship">Internship Candidate</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-semibold text-[#FAF8F5]/70 uppercase mb-1.5">
              Number of Questions
            </label>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full bg-[#18181B] border border-[#FAF8F5]/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FAF8F5] cursor-pointer"
            >
              <option value={3}>3 Questions (Quick Sprint)</option>
              <option value={5}>5 Questions (Standard Round)</option>
              <option value={8}>8 Questions (Full Comprehensive)</option>
            </select>
          </div>

          <div className="md:col-span-3 pt-2">
            <button
              type="submit"
              disabled={generating || !role.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white font-semibold text-xs transition-all shadow-md shadow-[#FF6B6B]/25 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white text-white" />
              {generating ? 'Generating Grounded Questions...' : 'Start Mock Interview Session'}
            </button>
          </div>
        </form>
      </div>

      {/* Past Sessions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-serif font-medium text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#FAF8F5]" />
            Interview Session History
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#FAF8F5] text-xs font-mono flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FAF8F5] animate-ping" />
            Loading interview records...
          </div>
        ) : interviews.length === 0 ? (
          <div className="bg-[#121214] border border-[#FAF8F5]/20 rounded-3xl p-12 text-center text-neutral-500 space-y-3 backdrop-blur-xl">
            <MessageSquare className="w-10 h-10 mx-auto text-[#FAF8F5]/40" />
            <p className="text-sm font-semibold text-white">No mock interviews recorded yet.</p>
            <p className="text-xs text-neutral-400">Configure your target role above and launch your first AI-guided practice round!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {interviews.map((item) => {
              const isCompleted = item.status === 'COMPLETED';
              const score = item.overall_score;

              return (
                <div
                  key={item.id}
                  className="bg-[#121214] border border-[#FAF8F5]/20 rounded-3xl p-6 hover:border-[#FAF8F5]/50 hover:bg-[#18181B] transition-all flex flex-col justify-between space-y-4 group backdrop-blur-xl hover:shadow-xl hover:shadow-white/5"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                          isCompleted
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-[#FAF8F5]/15 text-[#FAF8F5] border-[#FAF8F5]/30'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        {item.status}
                      </span>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-neutral-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-[#FAF8F5] transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs font-mono text-neutral-400 mt-0.5">{item.target_role}</p>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] font-mono text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-[#FAF8F5]" />
                        {item.total_questions} Qs
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#FAF8F5]/70" />
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#FAF8F5]/10 flex items-center justify-between">
                    <div>
                      {score !== null && score !== undefined ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-neutral-400">Score:</span>
                          <span className="text-base font-bold font-mono text-[#FAF8F5]">
                            {score}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-[#FAF8F5]/70 italic">In Progress</span>
                      )}
                    </div>

                    <button
                      onClick={() => navigate(`/interviews/${item.id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white font-semibold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <span>{isCompleted ? 'View Report' : 'Resume'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
