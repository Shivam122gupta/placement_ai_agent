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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header & Stats Banner */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold tracking-wide uppercase">
                <MessageSquare className="w-3.5 h-3.5" />
                AI Mock Interview Simulator
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Interview Preparation Arena
              </h1>
              <p className="text-slate-400 max-w-2xl text-sm sm:text-base">
                Simulate realistic technical, project deep-dive, system design, and STAR behavioral interviews with real-time 3-pillar scoring.
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Sessions</p>
              <p className="text-2xl font-bold text-white mt-1">{interviews.length}</p>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</p>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Average Score</p>
              <p className="text-2xl font-bold text-indigo-400 mt-1 font-mono">
                {avgScore !== null ? `${avgScore}%` : 'N/A'}
              </p>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Rubric Pillars</p>
              <p className="text-xs font-semibold text-slate-300 mt-2">
                Tech • Depth • STAR
              </p>
            </div>
          </div>
        </div>

        {/* Start New Mock Interview Form */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Launch Customized Mock Interview
            </h2>
            <p className="text-slate-400 text-sm">
              Questions are synthesized specifically from your verified skills and actual resume projects (zero fabrication).
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleStartInterview} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Target Role / Domain
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Backend Engineer, Full Stack Dev"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Fresher / 0-1 years">Fresher / 0-1 years</option>
                <option value="1-3 years">Junior (1-3 years)</option>
                <option value="Internship">Internship Candidate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Number of Questions
              </label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
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
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                {generating ? 'Generating Grounded Questions...' : 'Start Mock Interview Session'}
              </button>
            </div>
          </form>
        </div>

        {/* Past Sessions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-slate-400" />
              Interview Session History
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading interview records...</div>
          ) : interviews.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-base font-medium">No mock interviews recorded yet.</p>
              <p className="text-sm">Configure your target role above and launch your first AI-guided practice round!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {interviews.map((item) => {
                const isCompleted = item.status === 'COMPLETED';
                const score = item.overall_score;

                return (
                  <div
                    key={item.id}
                    className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          {item.status}
                        </span>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors p-1"
                          title="Delete session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{item.target_role}</p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          {item.total_questions} Questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        {score !== null && score !== undefined ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400">Score:</span>
                            <span
                              className={`text-lg font-bold font-mono ${
                                score >= 75
                                  ? 'text-emerald-400'
                                  : score >= 50
                                  ? 'text-indigo-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              {score}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">In Progress</span>
                        )}
                      </div>

                      <button
                        onClick={() => navigate(`/interviews/${item.id}`)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 font-medium text-xs transition-all cursor-pointer"
                      >
                        <span>{isCompleted ? 'View Report' : 'Resume'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
