import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Timer,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
} from 'lucide-react';

import { interviewService } from '../services/interviewService';
import { MockInterview, InterviewQuestion, AnswerEvaluation } from '../types/interview';

export const MockInterviewArenaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<MockInterview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active question index
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [candidateAnswer, setCandidateAnswer] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [currentEval, setCurrentEval] = useState<AnswerEvaluation | null>(null);

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  useEffect(() => {
    if (id) fetchInterviewSession(id);
  }, [id]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const fetchInterviewSession = async (interviewId: string) => {
    try {
      setLoading(true);
      const data = await interviewService.getInterview(interviewId);
      setInterview(data);

      // Set active question to the current in-progress index
      const targetIdx = Math.min(data.current_question_index, data.total_questions - 1);
      setActiveQuestionIdx(targetIdx);

      const q = data.questions[targetIdx];
      if (q && q.candidate_answer) {
        setCandidateAnswer(q.candidate_answer);
        if (q.evaluation) {
          setCurrentEval(q.evaluation);
        }
      }

      if (data.status === 'COMPLETED') {
        setIsTimerRunning(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load interview session.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = (index: number) => {
    if (!interview) return;
    setActiveQuestionIdx(index);
    const q = interview.questions[index];
    setCandidateAnswer(q.candidate_answer || '');
    setCurrentEval(q.evaluation || null);
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interview || !id || !candidateAnswer.trim()) return;

    const currentQuestion = interview.questions[activeQuestionIdx];
    if (!currentQuestion) return;

    try {
      setSubmitting(true);
      const res = await interviewService.submitAnswer(id, {
        question_id: currentQuestion.question_id,
        candidate_answer: candidateAnswer.trim(),
      });

      setCurrentEval(res.evaluation);

      // Re-fetch interview state
      const updated = await interviewService.getInterview(id);
      setInterview(updated);

      if (res.is_completed) {
        setIsTimerRunning(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Answer evaluation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PROJECT_DEEP_DIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'SYSTEM_DESIGN':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'BEHAVIORAL_STAR':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'TECHNICAL':
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading interview simulation arena...
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-white text-lg font-semibold">{error || 'Interview session not found.'}</p>
        <button
          onClick={() => navigate('/interviews')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-sm"
        >
          Back to Interviews
        </button>
      </div>
    );
  }

  const currentQ: InterviewQuestion = interview.questions[activeQuestionIdx];
  const isCompleted = interview.status === 'COMPLETED';
  const wordCount = candidateAnswer.trim() ? candidateAnswer.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Navigation & Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/interviews')}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">{interview.title}</h1>
              <p className="text-xs text-slate-400">
                {interview.target_role} • {interview.experience_level}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-sm">
              <Timer className="w-4 h-4 text-purple-400" />
              <span>{formatTimer(secondsElapsed)}</span>
            </div>

            {/* Status Badge */}
            <span
              className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                isCompleted
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
              }`}
            >
              {isCompleted ? 'Completed' : `Question ${activeQuestionIdx + 1} of ${interview.total_questions}`}
            </span>
          </div>
        </div>

        {/* Question Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {interview.questions.map((q, idx) => {
            const isAnswered = q.candidate_answer !== null && q.candidate_answer !== undefined;
            const isCurrent = idx === activeQuestionIdx;

            return (
              <button
                key={q.question_id}
                onClick={() => handleSelectQuestion(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 ${
                  isCurrent
                    ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/20'
                    : isAnswered
                    ? 'bg-slate-900 border-slate-800 text-emerald-400 hover:border-slate-700'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isAnswered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>Q{idx + 1}: {q.category.replace('_', ' ')}</span>
              </button>
            );
          })}
        </div>

        {/* Final Scoreboard Banner (If Completed) */}
        {isCompleted && interview.overall_score !== null && (
          <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 uppercase tracking-wide">
                  <Award className="w-4 h-4" /> Final Session Diagnostic
                </div>
                <h2 className="text-2xl font-black text-white">Interview Performance Scorecard</h2>
                <p className="text-slate-300 text-sm max-w-2xl">{interview.summary_feedback}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-purple-500/30 text-center min-w-[120px]">
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Overall Score</p>
                  <p className="text-3xl font-black text-emerald-400 font-mono mt-1">
                    {interview.overall_score}%
                  </p>
                </div>
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-center">
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Technical Avg</p>
                  <p className="text-xl font-bold text-indigo-400 font-mono mt-1">
                    {interview.technical_score_avg}/10
                  </p>
                </div>
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-center">
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Communication</p>
                  <p className="text-xl font-bold text-purple-400 font-mono mt-1">
                    {interview.communication_score_avg}/10
                  </p>
                </div>
              </div>
            </div>

            {/* Strengths & Improvement Areas Chips */}
            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Key Strengths Observed:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {interview.strengths.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-amber-400 flex items-center gap-1.5 mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Recommended Focus Areas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {interview.improvement_areas.map((imp, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800">
                      {imp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Question & Interactive Arena */}
        {currentQ && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Question Prompt & Details */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(
                      currentQ.category
                    )}`}
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    {currentQ.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Difficulty: <strong className="text-purple-400">{currentQ.difficulty}</strong>
                  </span>
                </div>

                {currentQ.context_or_scenario && (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                    <strong className="text-slate-400 uppercase text-[10px] tracking-wider block mb-1">
                      Context / Scenario:
                    </strong>
                    {currentQ.context_or_scenario}
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white leading-snug">
                    {currentQ.question}
                  </h3>
                </div>

                {currentQ.expected_concepts && currentQ.expected_concepts.length > 0 && (
                  <div className="pt-3 border-t border-slate-800 space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Expected Focus Topics:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentQ.expected_concepts.map((concept, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 text-xs"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* STAR Framework Helper Box for Behavioral Questions */}
              {currentQ.category === 'BEHAVIORAL_STAR' && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <HelpCircle className="w-4 h-4" /> STAR Framework Tip
                  </div>
                  <ul className="space-y-1 text-slate-400 pl-4 list-disc">
                    <li><strong>Situation:</strong> Briefly set the scene and context.</li>
                    <li><strong>Task:</strong> What was your exact responsibility?</li>
                    <li><strong>Action:</strong> What specific steps and tools did you use?</li>
                    <li><strong>Result:</strong> What was the measurable positive outcome?</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Right Column: Candidate Answer Input & Real-Time Rubric Evaluation */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-4">
                <form onSubmit={handleSubmitAnswer} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Your Answer
                    </label>
                    <span className="text-xs text-slate-500 font-mono">
                      {wordCount} words • {candidateAnswer.length} chars
                    </span>
                  </div>

                  <textarea
                    rows={6}
                    required
                    value={candidateAnswer}
                    onChange={(e) => setCandidateAnswer(e.target.value)}
                    placeholder="Type your structured technical answer or STAR explanation here..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 leading-relaxed font-sans"
                  />

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[11px] text-slate-500">
                      Answer will be scored against Technical correctness, Depth, and Communication.
                    </p>
                    <button
                      type="submit"
                      disabled={submitting || !candidateAnswer.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submitting ? 'Evaluating Rubric...' : currentEval ? 'Re-evaluate Answer' : 'Submit Answer'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Instant Rubric Evaluation Card */}
              {currentEval && (
                <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      AI Rubric Evaluation
                    </h4>
                  </div>

                  {/* 3 Scoring Dials */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Technical</p>
                      <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                        {currentEval.technical_score}/10
                      </p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Depth</p>
                      <p className="text-lg font-bold text-indigo-400 font-mono mt-0.5">
                        {currentEval.depth_score}/10
                      </p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Structure</p>
                      <p className="text-lg font-bold text-purple-400 font-mono mt-0.5">
                        {currentEval.communication_score}/10
                      </p>
                    </div>
                  </div>

                  {/* Actionable Feedback */}
                  <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-slate-300 leading-relaxed">
                    <strong className="text-purple-300 block mb-1">Feedback & Coaching:</strong>
                    {currentEval.actionable_feedback}
                  </div>

                  {/* Strengths & Missing Points */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {currentEval.key_strengths && currentEval.key_strengths.length > 0 && (
                      <div className="space-y-1">
                        <span className="font-semibold text-emerald-400">Strengths:</span>
                        <ul className="space-y-0.5 text-slate-400 pl-3 list-disc">
                          {currentEval.key_strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {currentEval.missing_concepts && currentEval.missing_concepts.length > 0 && (
                      <div className="space-y-1">
                        <span className="font-semibold text-amber-400">Consider Mentioning:</span>
                        <ul className="space-y-0.5 text-slate-400 pl-3 list-disc">
                          {currentEval.missing_concepts.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Expandable Ideal Response */}
                  <details className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 text-xs text-slate-300">
                    <summary className="font-semibold text-purple-400 cursor-pointer select-none">
                      View Model Answer
                    </summary>
                    <p className="mt-2 text-slate-300 leading-relaxed whitespace-pre-line font-mono text-[11px]">
                      {currentEval.ideal_sample_response}
                    </p>
                  </details>

                  {/* Next Question Navigation */}
                  {activeQuestionIdx < interview.total_questions - 1 && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSelectQuestion(activeQuestionIdx + 1)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>Next Question (Q{activeQuestionIdx + 2})</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
