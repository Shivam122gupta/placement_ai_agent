import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  User,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { agentService } from '../services/agentService';
import { AgentChatMessage, PendingConfirmation } from '../types/agent';
import { ActionConfirmationCard } from '../components/agent/ActionConfirmationCard';

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 'welcome_msg',
      role: 'assistant',
      content:
        "👋 Hello! I am your Hirxora AI Career Copilot.\n\nI can review your profile, search matching jobs and internships, check your match score, identify skill gaps, and create customized 2-week study roadmaps.\n\nHow can I help you with your career and placement preparation today?",
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

  const renderCleanContent = (text: string) => {
    if (!text) return null;
    
    // Split into lines and clean up any stray raw markdown artifacts
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5">
        {lines.map((line, idx) => {
          let cleaned = line.trim();
          if (!cleaned) return <div key={idx} className="h-1.5" />;
          
          // Clean leading markdown headers (### Header -> Header)
          if (cleaned.startsWith('#')) {
            cleaned = cleaned.replace(/^#+\s*/, '');
            return (
              <p key={idx} className="font-semibold text-[#FAF8F5] text-sm pt-1">
                {cleaned.replace(/\*\*/g, '')}
              </p>
            );
          }

          // Bullet point handling
          const isBullet = cleaned.startsWith('- ') || cleaned.startsWith('• ') || cleaned.startsWith('* ');
          if (isBullet) {
            const bulletText = cleaned.replace(/^[-•*]\s*/, '').replace(/\*\*/g, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-[#FAF8F5]/60 mt-1">•</span>
                <span>{bulletText}</span>
              </div>
            );
          }

          // Plain text line with asterisks removed
          const plainText = cleaned.replace(/\*\*/g, '').replace(/\*/g, '');
          return <p key={idx}>{plainText}</p>;
        })}
      </div>
    );
  };

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
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4 pb-4 text-[#FAF8F5]">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#121214] border border-[#FAF8F5]/20 rounded-3xl px-6 py-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img
            src="/hirxora-logo-2.jpg"
            alt="Hirxora Copilot"
            className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-md shadow-[#FF6B6B]/20"
          />
          <div>
            <h1 className="text-sm md:text-base font-serif font-normal text-white flex items-center gap-2">
              <span>Career Copilot Assistant</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/25">
                AI Active
              </span>
            </h1>
            <p className="text-xs text-neutral-400 font-sans">Personalized career guidance and placement assistant</p>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="p-2 rounded-xl border border-[#FAF8F5]/20 hover:bg-[#FAF8F5]/10 text-neutral-400 hover:text-white transition cursor-pointer"
          title="New Session"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Canvas */}
      <div className="flex-1 bg-[#121214]/90 border border-[#FAF8F5]/15 rounded-3xl p-6 overflow-y-auto space-y-5 shadow-inner backdrop-blur-xl">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border ${
                msg.role === 'user'
                  ? 'bg-[#FAF8F5] text-black border-white shadow-md shadow-white/10'
                  : 'bg-[#18181B] border-white/20'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="h-3.5 w-3.5 text-black" />
              ) : (
                <img src="/hirxora-logo-2.jpg" alt="Hirxora" className="w-full h-full object-cover" />
              )}
            </div>

            <div className={`max-w-2xl space-y-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#FAF8F5] text-black font-medium shadow-md shadow-white/10'
                    : 'bg-[#18181B] border border-[#FAF8F5]/15 text-neutral-200 shadow-sm font-sans'
                }`}
              >
                {msg.role === 'user' ? msg.content : renderCleanContent(msg.content)}
              </div>

              {/* Action Confirmation Card if pending */}
              {msg.pending_confirmation && (
                <ActionConfirmationCard
                  confirmation={msg.pending_confirmation}
                  onConfirm={handleConfirmDecision}
                  loading={loading}
                />
              )}

              <span className="text-[10px] font-mono text-[#FAF8F5]/60 block px-1">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-[#FAF8F5] text-xs italic pl-11 py-2">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FAF8F5] animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#FAF8F5] animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#FAF8F5] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="font-sans text-[#FAF8F5]/80">AI Assistant is thinking...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center space-x-3 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
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
              className="text-xs px-3 py-1.5 rounded-xl bg-[#121214] border border-[#FAF8F5]/15 hover:border-[#FAF8F5]/50 text-neutral-300 hover:text-white transition cursor-pointer"
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
        className="bg-[#121214] border border-[#FAF8F5]/20 rounded-2xl p-2 shadow-2xl flex items-center gap-2 backdrop-blur-xl"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything: find jobs, diagnose skill gaps, build roadmaps..."
          disabled={loading}
          className="flex-1 bg-transparent px-4 py-2.5 text-xs md:text-sm text-white placeholder-neutral-500 focus:outline-none font-sans"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white shadow-md shadow-[#FF6B6B]/25 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
        >
          <Send className="h-4 w-4 text-white" />
        </button>
      </form>
    </div>
  );
};
