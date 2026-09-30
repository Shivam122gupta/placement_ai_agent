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
import { SEO } from '../components/common/SEO';

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

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center text-[#FAF8F5] font-mono text-sm gap-2">
        <div className="w-3 h-3 rounded-full bg-[#FAF8F5] animate-ping" />
        Loading interview simulation arena...
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="py-20 flex flex-col items-center justify-center p-4 space-y-4 text-center text-[#FAF8F5]">
        <AlertCircle className="w-10 h-10 text-rose-400" />
        <p className="text-white text-base font-semibold">{error || 'Interview session not found.'}</p>
        <button
          onClick={() => navigate('/interviews')}
          className="px-4 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE0] text-black font-semibold text-xs transition shadow-md shadow-white/10 cursor-pointer active:scale-95"
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
    <div className="space-y-6 pb-16 text-[#FAF8F5]">
      <SEO
        title={interview ? `Mock Interview: ${interview.target_role} — Hirxora` : "Live Mock Interview — Hirxora"}
        description="Simulate real-time technical & behavioral interviews with instant AI scoring and detailed feedback."
      />
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121214] border border-[#FAF8F5]/20 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/interviews')}
            className="p-2 rounded-xl bg-[#18181B] border border-[#FAF8F5]/20 text-neutral-400 hover:text-white hover:border-[#FAF8F5]/50 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#FAF8F5]" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-serif font-normal text-white">{interview.title}</h1>
            <p className="text-xs text-[#FAF8F5]/70 font-mono">
              {interview.target_role} • {interview.experience_level}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#18181B] border border-[#FAF8F5]/20 text-[#FAF8F5] font-mono text-xs">
            <Timer className="w-3.5 h-3.5 text-[#FAF8F5]" />
            <span>{formatTimer(secondsElapsed)}</span>
          </div>

          {/* Status Badge */}
          <span
            className={`px-3 py-1 rounded-xl text-xs font-mono font-medium border ${
              isCompleted
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-[#FAF8F5]/15 text-[#FAF8F5] border-[#FAF8F5]/30'
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
              className={`px-3.5 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 ${
                isCurrent
                  ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] text-white font-semibold shadow-md shadow-[#FF6B6B]/25'
                  : isAnswered
                  ? 'bg-[#121214] border border-[#FAF8F5]/30 text-white hover:border-[#FAF8F5]/60'
                  : 'bg-[#18181B] border border-[#FAF8F5]/15 text-neutral-400 hover:text-white'
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
        <div className="bg-[#121214] border border-[#FAF8F5]/25 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#FAF8F5]/80 uppercase tracking-wider">
                <Award className="w-4 h-4 text-[#FAF8F5]" /> Final Session Diagnostic
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-normal text-white">
                Interview Performance Scorecard
              </h2>
              <p className="text-neutral-300 text-sm max-w-2xl leading-relaxed font-sans">{interview.summary_feedback}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-[#18181B] p-4 rounded-2xl border border-[#FAF8F5]/20 text-center min-w-[120px]">
                <p className="text-[10px] text-[#FAF8F5]/70 uppercase font-mono tracking-wider">Overall Score</p>
                <p className="text-3xl font-bold text-[#FAF8F5] font-mono mt-1">
                  {interview.overall_score}%
                </p>
              </div>
              <div className="bg-[#18181B] p-4 rounded-2xl border border-[#FAF8F5]/20 text-center">
                <p className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider">Technical</p>
                <p className="text-xl font-bold text-white font-mono mt-1">
                  {interview.technical_score_avg}/10
                </p>
              </div>
              <div className="bg-[#18181B] p-4 rounded-2xl border border-[#FAF8F5]/20 text-center">
                <p className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider">Communication</p>
                <p className="text-xl font-bold text-white font-mono mt-1">
                  {interview.communication_score_avg}/10
                </p>
              </div>
            </div>
          </div>

          {/* Strengths & Improvement Areas Chips */}
          <div className="pt-4 border-t border-[#FAF8F5]/10 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs relative z-10">
            <div>
              <span className="font-mono text-[#FAF8F5]/80 flex items-center gap-1.5 mb-2 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Key Strengths Observed:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {interview.strengths.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-[#18181B] text-neutral-300 border border-[#FAF8F5]/15 font-mono text-[11px]">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="font-mono text-[#FAF8F5]/80 flex items-center gap-1.5 mb-2 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-[#FAF8F5]" /> Recommended Focus Areas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {interview.improvement_areas.map((imp, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-[#18181B] text-neutral-300 border border-[#FAF8F5]/15 font-mono text-[11px]">
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
            <div className="bg-[#121214] border border-[#FAF8F5]/20 rounded-3xl p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/25">
                  <BrainCircuit className="w-3.5 h-3.5 text-[#FAF8F5]" />
                  {currentQ.category.replace('_', ' ')}
                </span>
                <span className="text-xs text-[#FAF8F5]/70 font-mono uppercase tracking-wider">
                  Difficulty: <strong className="text-white">{currentQ.difficulty}</strong>
                </span>
              </div>

              {currentQ.context_or_scenario && (
                <div className="p-3.5 rounded-2xl bg-[#18181B] border border-[#FAF8F5]/15 text-xs text-neutral-300 leading-relaxed font-sans">
                  <strong className="text-[#FAF8F5]/80 uppercase font-mono text-[10px] tracking-wider block mb-1">
                    Context / Scenario:
                  </strong>
                  {currentQ.context_or_scenario}
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-lg font-serif font-normal text-white leading-relaxed">
                  {currentQ.question}
                </h3>
              </div>

              {currentQ.expected_concepts && currentQ.expected_concepts.length > 0 && (
                <div className="pt-3 border-t border-[#FAF8F5]/10 space-y-1.5">
                  <p className="text-[10px] font-mono text-[#FAF8F5]/70 uppercase tracking-wider">
                    Expected Focus Topics:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentQ.expected_concepts.map((concept, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[#18181B] text-neutral-300 border border-[#FAF8F5]/20 font-mono text-[11px]"
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
              <div className="bg-[#121214] border border-[#FAF8F5]/20 rounded-3xl p-5 text-xs text-neutral-300 space-y-2">
                <div className="flex items-center gap-2 text-[#FAF8F5] font-mono text-xs font-medium">
                  <HelpCircle className="w-4 h-4 text-[#FAF8F5]" /> STAR Framework Tip
                </div>
                <ul className="space-y-1 text-neutral-400 pl-4 list-disc font-sans text-xs">
                  <li><strong className="text-white">Situation:</strong> Briefly set the scene and context.</li>
                  <li><strong className="text-white">Task:</strong> What was your exact responsibility?</li>
                  <li><strong className="text-white">Action:</strong> What specific steps and tools did you use?</li>
                  <li><strong className="text-white">Result:</strong> What was the measurable positive outcome?</li>
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Candidate Answer Input & Real-Time Rubric Evaluation */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#121214] border border-[#FAF8F5]/20 rounded-3xl p-6 backdrop-blur-xl space-y-4">
              <form onSubmit={handleSubmitAnswer} className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#FAF8F5]/70 uppercase tracking-wider">
                    Your Response
                  </label>
                  <span className="text-xs text-neutral-500 font-mono">
                    {wordCount} words • {candidateAnswer.length} chars
                  </span>
                </div>

                <textarea
                  rows={6}
                  required
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  placeholder="Type your structured technical answer or STAR explanation here..."
                  className="w-full bg-[#18181B] border border-[#FAF8F5]/20 rounded-2xl p-4 text-sm text-neutral-200 focus:outline-none focus:border-[#FAF8F5] leading-relaxed font-sans"
                />

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-neutral-500 font-mono">
                    Scored on Technical Accuracy, Depth & Communication.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting || !candidateAnswer.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white font-semibold text-xs transition-all shadow-md shadow-[#FF6B6B]/25 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                    {submitting ? 'Evaluating Rubric...' : currentEval ? 'Re-evaluate Answer' : 'Submit Answer'}
                  </button>
                </div>
              </form>
            </div>

            {/* Instant Rubric Evaluation Card */}
            {currentEval && (
              <div className="bg-[#121214] border border-[#FAF8F5]/25 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-serif font-normal text-white flex items-center gap-2">
                    <span className="p-1 rounded bg-[#FAF8F5]/10">
                      <Sparkles className="w-3.5 h-3.5 text-[#FAF8F5]" />
                    </span>
                    AI Rubric Evaluation
                  </h4>
                </div>

                {/* 3 Scoring Dials */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#18181B] p-3.5 rounded-2xl border border-[#FAF8F5]/15 text-center">
                    <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Technical</p>
                    <p className="text-lg font-bold text-[#FAF8F5] font-mono mt-0.5">
                      {currentEval.technical_score}/10
                    </p>
                  </div>
                  <div className="bg-[#18181B] p-3.5 rounded-2xl border border-[#FAF8F5]/15 text-center">
                    <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Depth</p>
                    <p className="text-lg font-bold text-[#FAF8F5] font-mono mt-0.5">
                      {currentEval.depth_score}/10
                    </p>
                  </div>
                  <div className="bg-[#18181B] p-3.5 rounded-2xl border border-[#FAF8F5]/15 text-center">
                    <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Structure</p>
                    <p className="text-lg font-bold text-[#FAF8F5] font-mono mt-0.5">
                      {currentEval.communication_score}/10
                    </p>
                  </div>
                </div>

                {/* Actionable Feedback */}
                <div className="p-4 rounded-2xl bg-[#18181B] border border-[#FAF8F5]/15 text-xs text-neutral-300 leading-relaxed">
                  <strong className="text-[#FAF8F5]/80 block mb-1 font-mono uppercase text-[10px] tracking-wider">
                    Feedback & Coaching:
                  </strong>
                  {currentEval.actionable_feedback}
                </div>

                {/* Strengths & Missing Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {currentEval.key_strengths && currentEval.key_strengths.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-mono text-emerald-400 text-xs font-medium">Strengths:</span>
                      <ul className="space-y-0.5 text-neutral-400 pl-3 list-disc">
                        {currentEval.key_strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentEval.missing_concepts && currentEval.missing_concepts.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-mono text-[#FAF8F5] text-xs font-medium">Consider Mentioning:</span>
                      <ul className="space-y-0.5 text-neutral-400 pl-3 list-disc">
                        {currentEval.missing_concepts.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Expandable Ideal Response */}
                <details className="bg-[#18181B] rounded-2xl p-4 border border-[#FAF8F5]/15 text-xs text-neutral-300">
                  <summary className="font-mono text-[#FAF8F5] text-xs font-medium cursor-pointer select-none hover:text-white transition-colors">
                    View Ideal Model Answer
                  </summary>
                  <p className="mt-3 text-neutral-300 leading-relaxed whitespace-pre-line font-mono text-[11px]">
                    {currentEval.ideal_sample_response}
                  </p>
                </details>

                {/* Next Question Navigation */}
                {activeQuestionIdx < interview.total_questions - 1 && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSelectQuestion(activeQuestionIdx + 1)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white text-xs font-semibold transition-all shadow-md shadow-[#FF6B6B]/25 cursor-pointer active:scale-95"
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
  );
};
