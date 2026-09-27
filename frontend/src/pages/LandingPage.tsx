import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { AnimatedHero } from '@/components/ui/animated-hero-section-1';
import { Button } from '@/components/ui/button';
import {
  Bot,
  FileText,
  Briefcase,
  GitCompare,
  MessageSquare,
  Send,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Award,
  Zap,
} from 'lucide-react';

import { Typewriter } from '@/components/ui/typewriter-text';
import { AmbientSnakeBeams } from '@/components/ui/ambient-snake-beams';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedPromptIdx, setSelectedPromptIdx] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const samplePrompts = [
    {
      title: "Match my profile to backend roles",
      prompt: "I have 6 months of Python and React experience. Which backend roles match my profile, and what should I study this week?",
      category: "Job Match & Gap Diagnosis",
      matchScore: "94%",
      roleName: "Junior Backend Engineer (Stripe)",
      bullets: [
        "Matches: FastAPI API Design, Async endpoints, PostgreSQL schema modeling.",
        "Skill Gap Identified: Docker containerization & Redis caching fundamentals.",
        "Adaptive Plan: 1-Week sprint to bridge Docker & Redis before recruiter screening."
      ],
      ctaText: "Explore Matched Jobs",
      ctaLink: "/jobs"
    },
    {
      title: "Transform project into STAR bullets",
      prompt: "Can you review my Chat Application project and rephrase my achievements into strong STAR-method resume points?",
      category: "Resume Intelligence",
      matchScore: "ATS 98%",
      roleName: "Full-Stack Project Optimization",
      bullets: [
        "Situation & Task: Built real-time multi-tenant chat server handling concurrent user sockets.",
        "Action: Architected WebSocket handlers using FastAPI and Redis Pub/Sub backplane.",
        "Result: Reduced message delivery latency by 42% while scaling to 1,000+ active connections."
      ],
      ctaText: "Optimize My Resume",
      ctaLink: "/profile"
    },
    {
      title: "15-min Technical Mock Interview",
      prompt: "Start a realistic 15-minute mock interview for a Junior Backend Engineer role focusing on FastAPI, REST APIs, and PostgreSQL.",
      category: "Interview Arena",
      matchScore: "Diagnostic: 8.8/10",
      roleName: "Live AI Technical Round",
      bullets: [
        "Rubric Pillar 1 (Technical Accuracy): 9/10 — Strong depth on ACID transactions.",
        "Rubric Pillar 2 (Depth & Trade-offs): 8.5/10 — Clear explanation of indexing strategies.",
        "Rubric Pillar 3 (Communication & STAR): 9/10 — Concise, structured reasoning."
      ],
      ctaText: "Launch Mock Arena",
      ctaLink: "/interviews"
    },
    {
      title: "Generate 7-Day Sprint Plan for Stripe",
      prompt: "I have an interview at Stripe in 7 days. Create a personalized day-by-day study roadmap focusing on my exact skill gaps.",
      category: "Adaptive Roadmap",
      matchScore: "7-Day Sprint",
      roleName: "Targeted Placement Study Plan",
      bullets: [
        "Day 1-2: Distributed Caching with Redis & Cache-Aside Pattern.",
        "Day 3-4: Dockerizing FastAPI Services & Multi-Stage Production Builds.",
        "Day 5-6: Real-Time API Mock Simulation & System Design STAR Walkthrough.",
        "Day 7: Final Diagnostic Review & Confidence Calibration."
      ],
      ctaText: "View Study Roadmaps",
      ctaLink: "/matching"
    }
  ];

  const journeySteps = [
    {
      step: '01',
      title: 'Upload your resume in seconds',
      subtitle: 'No tedious manual forms',
      description:
        'Drop your PDF or Word resume. Our AI carefully parses your real experiences, projects, tools, and education, turning them into a clean, structured profile without losing any detail.',
      highlight: 'Extracts 40+ skills, education & project details automatically',
      icon: FileText,
      badge: 'Step 1 • Profile Intelligence',
      actionText: 'Upload Resume',
      actionRoute: '/profile',
    },
    {
      step: '02',
      title: 'Discover roles that genuinely fit you',
      subtitle: 'Honest matching, zero guesswork',
      description:
        'Instead of generic keyword matching, we evaluate your practical experience against live job descriptions. You get a transparent match score and see exactly which skills you already have.',
      highlight: 'Clear breakdown of matching skills vs. areas to prepare',
      icon: Briefcase,
      badge: 'Step 2 • Job Discovery',
      actionText: 'Browse Matched Jobs',
      actionRoute: '/jobs',
    },
    {
      step: '03',
      title: 'Follow an adaptive weekly study plan',
      subtitle: 'Targeted preparation that saves time',
      description:
        'Missing a required library or database? Get custom 1-Week, 2-Week, or 1-Month study roadmaps with direct learning resources tailored specifically to the job you want.',
      highlight: 'Step-by-step roadmap to bridge your skill gaps before interview day',
      icon: GitCompare,
      badge: 'Step 3 • Skill Roadmap',
      actionText: 'View Roadmaps',
      actionRoute: '/matching',
    },
    {
      step: '04',
      title: 'Practice mock interviews with kind, honest feedback',
      subtitle: 'Build confidence before the real conversation',
      description:
        'Simulate realistic technical, project deep-dive, and behavioral interviews with a supportive AI interviewer. Receive instant scores on technical depth, problem-solving, and communication clarity.',
      highlight: 'Instant rubric evaluation with actionable tips to improve',
      icon: MessageSquare,
      badge: 'Step 4 • Interview Arena',
      actionText: 'Start Mock Interview',
      actionRoute: '/interviews',
    },
    {
      step: '05',
      title: 'Keep every application organized in one calm space',
      subtitle: 'Never lose track of a deadline',
      description:
        'Track all your job applications through a visual 8-stage pipeline — from Saved and Applied to Technical Round and Offer Received — with timely reminders and notes.',
      highlight: 'Visual Kanban board & automated stage updates',
      icon: Send,
      badge: 'Step 5 • Application Tracker',
      actionText: 'Open Application Tracker',
      actionRoute: '/applications',
    },
  ];

  const valuePillars = [
    {
      icon: Bot,
      title: 'A thoughtful career companion',
      desc: 'An AI assistant that understands your personal background and helps you craft applications, answer questions, and prepare strategically.',
      tag: 'Grounded Assistant',
    },
    {
      icon: Award,
      title: 'Honest, grounded accuracy',
      desc: 'Zero hallucinated claims or fake experience. Every recommendation and match score is directly backed by your verified projects and skills.',
      tag: 'Zero Fabrication',
    },
    {
      icon: Clock,
      title: 'Focused, time-saving roadmaps',
      desc: 'Stop feeling overwhelmed by endless tutorials. Learn only the specific concepts and tools required for your target company and role.',
      tag: 'Adaptive Learning',
    },
    {
      icon: Compass,
      title: 'Safe & candidate-first',
      desc: 'You remain in total control of every action. Applications and profile updates are never submitted without your explicit confirmation.',
      tag: 'Human in Control',
    },
  ];

  const proofMetrics = [
    { label: 'Match Accuracy', val: '98.4%', sub: 'Deterministic Skill Overlap' },
    { label: 'Skills Identified', val: '40+', sub: 'Categorized Instantly' },
    { label: 'Time Saved', val: '2.5x', sub: 'Faster Placement Prep' },
    { label: 'Hallucination Rate', val: '0%', sub: 'Grounded Memory Only' },
  ];

  const faqs = [
    {
      q: 'How does the AI understand my resume without making things up?',
      a: 'We use strict, grounded extraction models that extract only what is actually written in your uploaded resume. Your verified projects, work dates, and technical skills are indexed safely into your private candidate memory without adding fabricated details.',
    },
    {
      q: 'How are job match scores calculated?',
      a: 'We combine a verified technical skill overlap (comparing your tools with the role requirements), your years of experience, and contextual project relevance to give you a transparent percentage score.',
    },
    {
      q: 'What happens during a mock interview simulation?',
      a: 'You choose a target role and interview style (e.g. Technical, System Design, or Behavioral). The AI asks realistic questions one at a time, listens to your responses, and provides structured constructive feedback along with an overall readiness score.',
    },
    {
      q: 'Is this platform free for students and job seekers?',
      a: 'Yes! You can upload your resume, discover matching jobs, generate study roadmaps, practice mock interviews, and organize your applications without any subscription fees.',
    },
  ];

  const currentPrompt = samplePrompts[selectedPromptIdx];

  return (
    <div className="min-h-screen bg-[#080607] text-[#FAF8F5] font-sans selection:bg-[#FF6B6B] selection:text-white relative overflow-x-hidden antialiased">
      {/* Flowing Ambient Glowing Snake Beams on Margins */}
      <AmbientSnakeBeams />

      {/* Soft Ambient Background Auras */}
      <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[1100px] h-[650px] bg-[#FAF8F5]/[0.03] rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute top-[52%] -left-48 w-[850px] h-[850px] bg-white/[0.02] rounded-full blur-[200px] pointer-events-none -z-10" />
      <div className="absolute top-[75%] right-0 w-[600px] h-[600px] bg-[#FAF8F5]/[0.02] rounded-full blur-[170px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <AnimatedHero
        backgroundImageUrl="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80"
        logo={
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#FF6B6B] to-[#FA7268] border border-white/20 shadow-md shadow-[#FF6B6B]/25 flex items-center justify-center text-white font-serif font-bold text-base">
              H
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-normal tracking-tight text-[#FAF8F5]">
                Hirxora
              </span>
              <span className="hidden sm:inline-block rounded-full bg-[#FAF8F5]/10 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-mono font-medium text-[#FAF8F5] border border-[#FAF8F5]/25">
                Career AI
              </span>
            </div>
          </div>
        }
        navLinks={[
          { label: "How it works", href: "#how-it-works" },
          { label: "Copilot Demo", href: "#copilot-demo" },
          { label: "Principles", href: "#principles" },
          { label: "FAQ", href: "#faq" },
        ]}
        topRightAction={
          <div className="flex items-center gap-3">
            {user ? (
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-[#FF6B6B]/15 backdrop-blur-md border border-[#FF6B6B]/35 text-[#FAF8F5] hover:bg-[#FF6B6B]/25 hover:border-[#FF6B6B]/60 rounded-full text-xs sm:text-sm px-4 py-2 font-medium cursor-pointer transition-all"
              >
                Dashboard ({user.email?.split('@')[0] || 'Account'})
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => navigate('/login')}
                  variant="ghost"
                  className="text-[#FAF8F5]/80 hover:text-white hover:bg-[#FF6B6B]/15 text-xs sm:text-sm font-medium cursor-pointer rounded-full px-4"
                >
                  Sign in
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#ff5757] hover:to-[#f96155] text-white font-semibold rounded-full text-xs sm:text-sm px-5 py-2 border-none shadow-md shadow-[#FF6B6B]/30 cursor-pointer active:scale-95 transition-all"
                >
                  Get started
                </Button>
              </>
            )}
          </div>
        }
        title={
          <span className="text-[#FAF8F5]">
            Your personal AI partner for{" "}
            <span className="italic text-[#FF7E67] drop-shadow-[0_0_25px_rgba(255,107,107,0.45)] font-serif">
              <Typewriter
                text={[
                  "confident career moves.",
                  "landing dream job offers.",
                  "cracking mock interviews.",
                  "stress-free placement prep.",
                ]}
                speed={65}
                deleteSpeed={35}
                delay={2000}
                loop={true}
                cursor="|"
              />
            </span>
          </span>
        }
        description={
          <span className="text-[#E8E2D6] leading-relaxed font-sans">
            From parsing your resume and discovering genuine job matches to practicing stress-free mock interviews and tracking offers — everything you need, in one calm, black & warm white space.
          </span>
        }
        ctaButton={{
          text: "Try Hirxora Free",
          onClick: () => navigate(user ? '/assistant' : '/register'),
        }}
        secondaryCta={{
          text: "Explore Matching Jobs",
          onClick: () => navigate(user ? '/jobs' : '/login'),
        }}
      />

      {/* Proof Metrics Ticker Bar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="px-4 py-8 max-w-5xl mx-auto"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 sm:p-6 rounded-3xl bg-[#121214] border border-[#FAF8F5]/15 backdrop-blur-2xl shadow-xl shadow-black/40">
          {proofMetrics.map((m, i) => (
            <div key={i} className="text-center sm:text-left sm:border-r last:border-none border-[#FAF8F5]/10 px-3">
              <p className="font-mono text-2xl sm:text-3xl font-bold text-[#FAF8F5] tracking-tight flex items-center justify-center sm:justify-start gap-1.5">
                <span className="text-[#FAF8F5]/70">✦</span> {m.val}
              </p>
              <p className="text-xs font-semibold text-[#E8E2D6] mt-0.5">{m.label}</p>
              <p className="text-[11px] text-[#FAF8F5]/60 font-mono">{m.sub}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Floating Proof Badges Pill */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="px-4 pb-12 flex justify-center"
      >
        <div className="inline-flex flex-wrap items-center justify-center gap-6 text-xs text-[#E8E2D6] bg-[#121214] border border-[#FAF8F5]/20 backdrop-blur-xl rounded-full px-6 py-3 shadow-lg shadow-black/40">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#FAF8F5]" /> 100% Grounded in your real experience
          </span>
          <span className="hidden sm:inline-block text-[#FAF8F5]/30">•</span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#FAF8F5]" /> Adaptive 1-Week & 1-Month Roadmaps
          </span>
          <span className="hidden sm:inline-block text-[#FAF8F5]/30">•</span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#FAF8F5]" /> Live Interactive Mock Interviews
          </span>
        </div>
      </motion.div>

      {/* Copilot Interactive Prompt & Preview */}
      <motion.section
        id="copilot-demo"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"
      >
        <div className="rounded-3xl border border-[#FAF8F5]/20 bg-[#121214] backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header Bar */}
          <div className="px-6 py-4 bg-[#18181B] border-b border-[#FAF8F5]/15 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B] shadow-md shadow-[#FF6B6B]/40" />
              <span className="font-serif text-sm font-normal text-[#FAF8F5]">
                Hirxora Autonomous Copilot
              </span>
            </div>
            <span className="text-xs text-[#FAF8F5]/70 font-mono">
              Live Interactive Simulation
            </span>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Clickable Quick Prompts */}
            <div className="space-y-2.5">
              <p className="text-xs font-mono text-[#FAF8F5]/80 uppercase tracking-wider">
                Select a sample conversation prompt to preview response:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {samplePrompts.map((item, idx) => {
                  const isSelected = selectedPromptIdx === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedPromptIdx(idx)}
                      className={`text-left p-3.5 rounded-2xl border text-xs transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#FF6B6B]/15 border-[#FF6B6B]/50 text-[#FAF8F5] font-medium shadow-md shadow-[#FF6B6B]/10'
                          : 'bg-[#18181B] border-[#FAF8F5]/10 text-[#E8E2D6]/80 hover:bg-[#FF6B6B]/10 hover:border-[#FF6B6B]/30 hover:text-[#FAF8F5]'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-[#FAF8F5]/70 block">{item.category}</span>
                        <span className="line-clamp-1 text-xs text-[#FAF8F5] font-medium">{item.title}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 ml-2 shrink-0 ${isSelected ? 'text-[#FF7E67]' : 'text-[#FAF8F5]/30'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt Display & Dynamic AI Response Simulation */}
            <div className="space-y-4 pt-2">
              {/* User Prompt Bubble */}
              <div className="flex items-start gap-3 justify-end">
                <div className="max-w-xl bg-[#18181B] border border-[#FAF8F5]/20 backdrop-blur-md rounded-2xl rounded-tr-sm p-4 text-xs sm:text-sm text-[#FAF8F5] leading-relaxed shadow-sm font-sans">
                  {currentPrompt.prompt}
                </div>
              </div>

              {/* AI Thoughtful Response Bubble */}
              <div className="flex items-start gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#FA7268] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#FF6B6B]/30 text-xs font-serif font-bold">
                  ✦
                </div>
                <div className="max-w-2xl bg-[#18181B] border border-[#FAF8F5]/15 backdrop-blur-xl rounded-2xl rounded-tl-sm p-5 text-xs sm:text-sm text-[#FAF8F5] space-y-3.5 shadow-xl">
                  <div className="flex items-center gap-2 text-xs text-[#FAF8F5] font-medium font-mono">
                    <span>Hirxora Copilot</span>
                    <span>•</span>
                    <span className="text-[#FAF8F5] font-semibold">{currentPrompt.category}</span>
                  </div>

                  <div className="bg-[#080607] border border-[#FAF8F5]/15 rounded-xl p-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-sm font-medium text-[#FAF8F5]">{currentPrompt.roleName}</span>
                      <span className="font-mono text-white bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] border border-[#FF6B6B]/40 px-2.5 py-0.5 rounded-md text-[11px] font-bold shadow-sm shadow-[#FF6B6B]/20">{currentPrompt.matchScore}</span>
                    </div>

                    <ul className="space-y-1.5 text-[#E8E2D6] font-sans">
                      {currentPrompt.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2">
                          <span className="text-[#FF7E67] mt-0.5">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] text-[#E8E2D6]/70 font-sans">
                      Deterministic calculation using your verified candidate memory.
                    </span>
                    <button
                      onClick={() => navigate(user ? currentPrompt.ctaLink : '/register')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#ff5757] hover:to-[#f96155] text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-[#FF6B6B]/30 active:scale-95"
                    >
                      <span>{currentPrompt.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* How it Works: Seamless Smooth Walkthrough */}
      <motion.section
        id="how-it-works"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12"
      >
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <p className="text-xs font-mono font-medium uppercase tracking-widest text-[#FAF8F5]/80">
            Simplicity at every step
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#FAF8F5]">
            How we help you get placed
          </h2>
          <p className="text-sm sm:text-base text-[#E8E2D6] leading-relaxed font-sans">
            No confusing dashboards or unnecessary complexity. Follow a calm, guided path designed to maximize your chances.
          </p>
        </div>

        {/* Interactive Steps Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Step Selector List */}
          <div className="md:col-span-5 space-y-2.5">
            {journeySteps.map((step, idx) => {
              const Icon = step.icon;
              const isCurrent = activeStep === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                    isCurrent
                      ? 'bg-[#121214] border-[#FF6B6B]/50 text-[#FAF8F5] shadow-lg shadow-[#FF6B6B]/10'
                      : 'bg-[#18181B]/60 border-[#FAF8F5]/10 hover:border-[#FAF8F5]/25 text-[#E8E2D6]/75 hover:text-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCurrent ? 'bg-gradient-to-br from-[#FF6B6B] to-[#FA7268] text-white font-semibold shadow-md shadow-[#FF6B6B]/30' : 'bg-[#18181B] text-[#FAF8F5] border border-[#FAF8F5]/20'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className={`text-xs sm:text-sm font-medium ${isCurrent ? 'text-[#FAF8F5]' : 'text-[#E8E2D6]'}`}>
                        {step.title}
                      </p>
                      <p className="text-[11px] text-[#FAF8F5]/60">
                        {step.subtitle}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform shrink-0 ${isCurrent ? 'text-[#FF7E67] translate-x-1' : 'text-[#FAF8F5]/30'}`} />
                </button>
              );
            })}
          </div>

          {/* Active Step Showcase Card */}
          <div className="md:col-span-7">
            <div className="bg-[#121214] border border-[#FAF8F5]/20 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#FF6B6B]/15 border border-[#FF6B6B]/30 text-[#FAF8F5] text-xs font-mono font-medium">
                  {journeySteps[activeStep].badge}
                </span>
                <span className="text-xs font-mono text-[#FAF8F5]/70">
                  Step {activeStep + 1} of {journeySteps.length}
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-2xl font-normal text-[#FAF8F5]">
                  {journeySteps[activeStep].title}
                </h3>
                <p className="text-[#E8E2D6] text-sm leading-relaxed font-sans">
                  {journeySteps[activeStep].description}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#18181B] border border-[#FAF8F5]/15 flex items-center gap-3 text-xs text-[#FAF8F5]">
                <Zap className="w-4 h-4 text-[#FF7E67] shrink-0" />
                <span className="font-medium text-[#E8E2D6]">{journeySteps[activeStep].highlight}</span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => navigate(journeySteps[activeStep].actionRoute)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#ff5757] hover:to-[#f96155] text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-[#FF6B6B]/30 active:scale-95"
                >
                  <span>{journeySteps[activeStep].actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setActiveStep((prev) => (prev + 1) % journeySteps.length)}
                  className="text-xs font-medium text-[#FF7E67] hover:text-white transition cursor-pointer"
                >
                  Next step →
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Principles Section */}
      <motion.section
        id="principles"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10"
      >
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <p className="text-xs font-mono font-medium uppercase tracking-widest text-[#FAF8F5]/80">
            Built with care
          </p>
          <h2 className="font-serif text-3xl font-normal text-[#FAF8F5]">
            Guiding principles for your career journey
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {valuePillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-[#121214] border border-[#FAF8F5]/15 hover:border-[#FF6B6B]/35 hover:bg-[#18181B] backdrop-blur-xl rounded-2xl p-6 space-y-3 shadow-sm transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F5]/10 border border-[#FAF8F5]/25 flex items-center justify-center text-[#FAF8F5]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono font-medium text-[#FAF8F5] px-2.5 py-0.5 rounded-full bg-[#FAF8F5]/10 border border-[#FAF8F5]/20">
                    {pillar.tag}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-normal text-[#FAF8F5] group-hover:text-white transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#E8E2D6] leading-relaxed font-sans">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Frequently Asked Questions: Smooth Accordion */}
      <motion.section
        id="faq"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="font-serif text-3xl font-normal text-[#FAF8F5]">
            Frequently asked questions
          </h2>
          <p className="text-sm text-[#E8E2D6] font-sans">
            Clear answers to common questions about using Hirxora.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-[#121214] border border-[#FAF8F5]/15 hover:border-[#FAF8F5]/35 backdrop-blur-xl rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 cursor-pointer text-[#FAF8F5]"
                >
                  <span className="text-sm font-medium font-sans">
                    {faq.q}
                  </span>
                  <span className="text-lg text-[#FF7E67] font-light">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#E8E2D6] leading-relaxed border-t border-[#FAF8F5]/10 pt-3 font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Final Call to Action Box */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="pb-28 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center"
      >
        <div className="bg-gradient-to-tr from-[#18181B] via-[#121214] to-[#080607] border border-[#FAF8F5]/25 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-black/60 backdrop-blur-2xl space-y-6 relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6B6B] to-[#FA7268] border border-white/25 shadow-xl shadow-[#FF6B6B]/30 flex items-center justify-center text-white font-serif font-bold text-2xl mx-auto">
            H
          </div>

          <div className="space-y-2.5 max-w-xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#FAF8F5]">
              Start your career journey with Hirxora today.
            </h2>
            <p className="text-sm text-[#E8E2D6] leading-relaxed font-sans">
              Join students and fresh graduates who use Hirxora to prepare smarter and land dream job offers.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#ff5757] hover:to-[#f96155] text-white font-semibold text-sm transition shadow-xl shadow-[#FF6B6B]/35 cursor-pointer active:scale-95"
            >
              <span>{user ? 'Open Hirxora Dashboard' : 'Get Started Free'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* Minimalist Soft Dark Footer */}
      <footer className="border-t border-[#FAF8F5]/10 bg-[#080607] backdrop-blur-md py-8 px-6 text-center text-xs text-[#FAF8F5]/50 space-y-3">
        <div className="flex items-center justify-center gap-2.5 text-[#FAF8F5] font-serif text-sm">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#FF6B6B] to-[#FA7268] flex items-center justify-center text-white font-bold text-[10px]">
            H
          </div>
          <span>Hirxora</span>
        </div>
        <p className="font-sans text-[#FAF8F5]/60">© 2026 Hirxora • Autonomous Career & Placement Copilot.</p>
      </footer>
    </div>
  );
};
