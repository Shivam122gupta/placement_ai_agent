import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { agentService } from '../services/agentService';
import { AgentChatMessage, PendingConfirmation } from '../types/agent';
import { ToolExecutionPill } from '../components/agent/ToolExecutionPill';
import { ActionConfirmationCard } from '../components/agent/ActionConfirmationCard';

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 'welcome_msg',
      role: 'assistant',
      content:
        "👋 Hello! I am your **AI Placement Agent & Career Copilot**.\n\nI can analyze your active profile, search live tech jobs & internships, evaluate your match score with evidence, diagnose skill gaps, and generate customized study plans.\n\nHow can I help you take the next step in your career today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [sessionId] = useState<string>(() => `sess_${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setInput('');
    setError(null);

    const userMessage: AgentChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await agentService.chat({
        message: text,
        session_id: sessionId,
      });

      const assistantMessage: AgentChatMessage = {
        id: `agent_${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tool_audits: response.tool_audits,
        pending_confirmation: response.pending_confirmation,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setPendingConfirmation(response.pending_confirmation || null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Agent failed to respond. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDecision = async (decision: 'approve' | 'reject') => {
    if (!pendingConfirmation) return;
    setLoading(true);
    try {
      const response = await agentService.confirmAction({
        session_id: sessionId,
        tool_name: pendingConfirmation.tool_name,
        params: pendingConfirmation.params,
        decision,
      });

      const confirmResultMessage: AgentChatMessage = {
        id: `confirm_${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tool_audits: response.tool_audits,
      };

      setMessages((prev) => [...prev, confirmResultMessage]);
      setPendingConfirmation(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process confirmation decision.');
    } finally {
      setLoading(false);
    }
  };

  const promptSuggestions = [
    'What skills and projects are listed on my profile?',
    'Find backend internships in Bengaluru for me.',
    'Evaluate my match for the latest job listings.',
    'Build a 1-week study roadmap for Docker & Redis.',
  ];

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Autonomous Career Copilot</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ReAct + Tools
              </span>
            </h1>
            <p className="text-xs text-slate-400">Multi-step autonomous reasoning with safety guardrails</p>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="New Session"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Canvas */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 overflow-y-auto space-y-6 shadow-inner">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3.5 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                msg.role === 'user'
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-indigo-400'
              }`}
            >
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            <div className={`max-w-2xl space-y-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
              {/* Tool Execution Badges */}
              {msg.tool_audits && msg.tool_audits.length > 0 && (
                <div className="flex flex-wrap items-center mb-2">
                  {msg.tool_audits.map((audit, aIdx) => (
                    <ToolExecutionPill key={aIdx} audit={audit} />
                  ))}
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/10'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 whitespace-pre-wrap shadow-md'
                }`}
              >
                {msg.content}
              </div>

              {/* Action Confirmation Card if pending */}
              {msg.pending_confirmation && (
                <ActionConfirmationCard
                  confirmation={msg.pending_confirmation}
                  onConfirm={handleConfirmDecision}
                  loading={loading}
                />
              )}

              <span className="text-[10px] text-slate-500 block px-1">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-3 text-slate-400 text-xs italic pl-12 py-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Agent is planning and calling tools...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center space-x-3 text-red-400 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap items-center gap-2 px-2">
          {promptSuggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(suggestion)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 text-slate-300 hover:text-white transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything: find jobs, diagnose skill gaps, build roadmaps..."
          disabled={loading}
          className="flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
