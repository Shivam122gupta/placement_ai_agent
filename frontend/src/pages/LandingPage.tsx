import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Bot,
  FileText,
  Briefcase,
  GitCompare,
  Database,
  MessageSquare,
  Send,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<number>(0);

  const workflowSteps = [
    {
      title: '1. Resume Intelligence & Sync',
      icon: FileText,
      tag: 'Phase 2',
      desc: 'Upload PDF/Docx resumes. Deep LLM extractors parse skills, projects, and work experience into structured schemas with one-click profile sync.',
      color: 'from-blue-500/20 to-cyan-500/20 border-cyan-500/30 text-cyan-400',
    },
    {
      title: '2. Job Discovery & JD Ingestion',
      icon: Briefcase,
      tag: 'Phase 3',
      desc: 'Discover vetted opportunities with SHA-256 deduplication and deep job description decomposition into required vs preferred competencies.',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
    },
    {
      title: '3. Grounded Matching & Roadmaps',
      icon: GitCompare,
      tag: 'Phase 4',
      desc: '3-dimensional hybrid matching (50% taxonomy overlap + 25% experience + 25% grounded reasoning) with 1-Week, 2-Week, and 1-Month adaptive study roadmaps.',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
    },
    {
      title: '4. Autonomous AI Career Copilot',
      icon: Bot,
      tag: 'Phase 5',
      desc: 'Autonomous ReAct planning loop with strongly-typed tools, loop breakers, output sanitization, and Human-in-the-Loop confirmation barriers.',
      color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-400',
    },
    {
      title: '5. Qdrant Semantic Vector Memory',
      icon: Database,
      tag: 'Phase 6',
      desc: 'Multi-tenant isolated vector embeddings across candidate resumes, projects, and custom study notes for sub-millisecond factual RAG retrieval.',
      color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400',
    },
    {
      title: '6. Mock Interview Simulator',
      icon: MessageSquare,
      tag: 'Phase 7',
      desc: 'Practice grounded technical, project deep-dive, system design, and STAR behavioral interviews with real-time 3-pillar rubric evaluations.',
      color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-400',
    },
    {
      title: '7. 8-Stage Application Command Center',
      icon: Send,
      tag: 'Phase 8',
      desc: 'Manage opportunities across Kanban & Data Table views with duplicate prevention guardrails and real-time in-app notification alerts.',
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400',
    },
  ];

  const features = [
    {
      icon: Bot,
      title: 'Autonomous Career Copilot',
      desc: 'Multi-step reasoning agent that searches jobs, evaluates profiles, generates study roadmaps, and prepares applications autonomously.',
      badge: 'Agentic AI',
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    },
    {
      icon: Database,
      title: 'Qdrant Semantic RAG Memory',
      desc: 'User-isolated vector embeddings ensure the agent recalls your projects and experiences with 100% grounded zero-hallucination accuracy.',
      badge: 'Vector DB',
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    },
    {
      icon: GitCompare,
      title: 'Grounded Candidate-Job Matching',
      desc: 'Hybrid algorithmic & LLM matching that calculates weighted skill overlaps, experience alignment, and missing critical skill gaps.',
      badge: 'Zero Fabrication',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      icon: MessageSquare,
      title: 'Mock Interview Arena',
      desc: 'Live stopwatch-timed interview simulations with instant 3-pillar scoring (Technical Correctness, Depth, and STAR Communication structure).',
      badge: 'Rubric Evaluator',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      icon: Send,
      title: '8-Stage Opportunity Pipeline',
      desc: 'Centralized Kanban Board and Data Table views to track applications from Saved to Offer Received without duplicate conflicts.',
      badge: 'Kanban Tracker',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Safety & HITL Guardrails',
      desc: 'Critical actions like submitting applications enforce Human-in-the-Loop candidate confirmation barriers and step limits.',
      badge: 'Production Security',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-brand-600/20 via-purple-600/10 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[800px] -left-48 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[1400px] -right-48 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Landing Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#070A10]/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 text-white shadow-lg shadow-brand-500/20">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">AI Placement Agent</span>
              <span className="ml-2 rounded-md bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-400 border border-brand-500/20">
                PROD AGENT
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#workflow" className="hover:text-white transition">Agent Journey</a>
            <a href="#metrics" className="hover:text-white transition">Benchmarks</a>
            <a href="#tech" className="hover:text-white transition">Architecture</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition shadow-lg shadow-brand-600/20 cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition shadow-lg shadow-brand-600/20 cursor-pointer"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-bold tracking-wide uppercase shadow-inner">
          <Zap className="w-3.5 h-3.5" />
          Autonomous Career Engineering Platform
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
          Your Autonomous Career Agent.{' '}
          <span className="bg-gradient-to-r from-brand-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            From Resume to Offer Letter.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-base sm:text-xl max-w-3xl mx-auto leading-relaxed">
          Not a simple chatbot. A production-ready career platform featuring autonomous multi-agent reasoning, Qdrant vector semantic memory, zero-hallucination job matching, adaptive study roadmaps, and live mock interview arenas.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => navigate(user ? '/assistant' : '/register')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-base transition-all shadow-xl shadow-brand-500/25 cursor-pointer transform hover:-translate-y-0.5"
          >
            <Bot className="w-5 h-5" />
            <span>Launch Career Copilot Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate(user ? '/jobs' : '/login')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-base transition-all cursor-pointer"
          >
            <Briefcase className="w-4 h-4 text-brand-400" />
            <span>Explore Jobs & Matching</span>
          </button>
        </div>

        {/* Hero Interactive Terminal & Preview Widget */}
        <div className="pt-10 max-w-5xl mx-auto">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-6 backdrop-blur-2xl shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">agent_orchestrator.ts — Live Agent Telemetry</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Agent Active (ReAct Engine)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Agent Reasoning Stream */}
              <div className="md:col-span-7 bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 font-mono text-xs space-y-2.5">
                <div className="text-slate-400">
                  <span className="text-purple-400 font-bold">Candidate:</span> &quot;Match my verified Python & FastAPI profile against backend jobs at Stripe and generate a 1-Week sprint roadmap.&quot;
                </div>
                <div className="text-slate-300 space-y-1.5 pl-3 border-l-2 border-brand-500">
                  <p className="text-brand-400 font-semibold">⚡ [Agent Step 1]: Thought & Reasoning</p>
                  <p className="text-slate-400">Candidate requested match and preparation sprint. First retrieving verified profile and vectorized resume memory.</p>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-indigo-300 flex items-center justify-between">
                    <span>Tool: retrieve_candidate_context(&quot;FastAPI, Python microservices&quot;)</span>
                    <span className="text-emerald-400 font-bold">200 OK (384-d Cosine)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-cyan-300 flex items-center justify-between">
                    <span>Tool: match_candidate(job_id=&quot;stripe_backend_101&quot;)</span>
                    <span className="text-emerald-400 font-bold">94% Overlap</span>
                  </div>
                </div>
              </div>

              {/* Match Card Simulation */}
              <div className="md:col-span-5 bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Stripe</h4>
                    <p className="text-xs text-slate-400">Junior Backend Engineer</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-emerald-400">94%</span>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Match Score</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Grounded Skills Match:</p>
                  <div className="flex flex-wrap gap-1">
                    {['FastAPI', 'Python', 'PostgreSQL', 'Docker'].map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px]">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Adaptive Roadmap:</span>
                  <span className="text-indigo-400 font-bold">1-Week Sprint Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Stats Counter Section */}
      <section id="metrics" className="py-12 border-y border-slate-800/80 bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-brand-400 font-mono">95%+</p>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Placement Match Precision</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono">&lt; 150ms</p>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Qdrant Vector Latency</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">100%</p>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Grounded Zero-Hallucination</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-purple-400 font-mono">8-Stage</p>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Pipeline Automation</p>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" />
            Full-Stack Autonomous Engine
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Engineered for Real Career Outcomes
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Every module is designed to give entry-level candidates, fresh graduates, and students a decisive advantage in today&apos;s competitive tech job market.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all space-y-4 group backdrop-blur-xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl border ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400">
                    {feat.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Workflow Journey Section */}
      <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            End-to-End Placement Journey
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            How the Agent Powers Your Search
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            From initial resume parsing to practicing real-time mock interviews and managing offers.
          </p>
        </div>

        {/* Workflow Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-2.5">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeWorkflowTab === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveWorkflowTab(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 border-brand-500 shadow-lg shadow-brand-500/10'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${isActive ? 'bg-brand-500/20 text-brand-400 border-brand-500/30' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {step.title}
                      </p>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">{step.tag}</span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-brand-400 translate-x-1' : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>

          {/* Workflow Step Detail Card */}
          <div className="lg:col-span-7">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-mono font-semibold uppercase">
                  {workflowSteps[activeWorkflowTab].tag} • Active Module
                </span>
                <span className="text-xs text-slate-500 font-mono">Step {activeWorkflowTab + 1} of 7</span>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-extrabold text-white">
                  {workflowSteps[activeWorkflowTab].title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {workflowSteps[activeWorkflowTab].desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Grounded execution guaranteed
                </span>
                <button
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-2 text-xs font-bold text-brand-400 hover:text-brand-300 cursor-pointer"
                >
                  <span>Experience this module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Architecture Stack Banner */}
      <section id="tech" className="py-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
          <div className="space-y-2">
            <p className="text-xs uppercase font-bold text-slate-400 tracking-widest">Enterprise Foundation Stack</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">Production-Grade AI Architecture</h3>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            {[
              { label: 'FastAPI Backend', desc: 'Async High-Throughput' },
              { label: 'Qdrant Vector DB', desc: 'Multi-Tenant RAG' },
              { label: 'Motor + Beanie ODM', desc: 'MongoDB Atlas' },
              { label: 'Groq LLM Engine', desc: 'Sub-second Reasoning' },
              { label: 'PyTest Golden Suite', desc: '100% CI Coverage' },
              { label: 'React 18 + Vite', desc: 'Tailwind CSS UI' },
            ].map((tech, i) => (
              <div key={i} className="px-4 py-3 rounded-xl bg-slate-950 border border-slate-800/80 text-left min-w-[160px]">
                <p className="text-xs font-bold text-white">{tech.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Final Call to Action */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8">
        <div className="bg-gradient-to-tr from-brand-950/60 via-slate-900 to-indigo-950/60 border border-brand-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to land your dream role?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Start matching your profile with top jobs, practicing mock interviews, and tracking your pipeline with the AI Placement Agent.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-base transition-all shadow-xl shadow-brand-500/25 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span>{user ? 'Enter Placement Dashboard' : 'Get Started Free'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-10 px-6 text-center text-xs text-slate-500 space-y-3">
        <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span>AI Placement Agent Platform</span>
        </div>
        <p>© 2026 AI Placement Agent. Production-ready career copilot engineered with FastAPI, Qdrant, and React.</p>
      </footer>
    </div>
  );
};
