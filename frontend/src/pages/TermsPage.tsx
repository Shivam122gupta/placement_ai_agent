import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, CheckCircle2, AlertCircle, Scale } from 'lucide-react';

export const TermsPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Terms of Service — Hirxora Career AI';
  }, []);

  return (
    <div className="min-h-screen bg-[#080607] text-[#FAF8F5] selection:bg-[#FF6B6B] selection:text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-[#FF6B6B]/[0.04] blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#FAF8F5]/60 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 flex items-center justify-center text-[#FF7E67]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#FAF8F5]">Terms of Service</h1>
              <p className="text-xs font-mono text-[#FAF8F5]/50 mt-1">Effective Date: September 2026 • Version 1.0</p>
            </div>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-[#121214] border border-[#FAF8F5]/15 rounded-2xl p-6 sm:p-8 space-y-4 text-sm sm:text-base text-[#E8E2D6] leading-relaxed font-sans">
          <p>
            Welcome to <strong>Hirxora</strong>. By accessing or using our platform, autonomous career copilot features, resume analysis tools, or mock interview arenas, you agree to be bound by these Terms of Service.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8 text-sm sm:text-base text-[#E8E2D6] leading-relaxed font-sans">
          <section className="bg-[#121214] border border-[#FAF8F5]/10 rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2.5 text-[#FAF8F5] font-serif text-xl">
              <CheckCircle2 className="w-5 h-5 text-[#FF7E67]" />
              <h2>1. Platform Usage & Account Integrity</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#E8E2D6]/90">
              You agree to provide accurate and truthful information in your career profile. You are responsible for safeguarding your account credentials and must notify us immediately if you suspect unauthorized access.
            </p>
          </section>

          <section className="bg-[#121214] border border-[#FAF8F5]/10 rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2.5 text-[#FAF8F5] font-serif text-xl">
              <AlertCircle className="w-5 h-5 text-[#FF7E67]" />
              <h2>2. AI Output Disclaimer</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#E8E2D6]/90">
              Hirxora employs advanced artificial intelligence to analyze job matches, skill gaps, resume scores, and mock interview performance. While we strive for high precision, AI generated feedback and recommendations are intended as career advisory assistance and do not constitute an explicit guarantee of employment or hiring outcomes by any third-party company.
            </p>
          </section>

          <section className="bg-[#121214] border border-[#FAF8F5]/10 rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2.5 text-[#FAF8F5] font-serif text-xl">
              <BookOpen className="w-5 h-5 text-[#FF7E67]" />
              <h2>3. Intellectual Property & User Content</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#E8E2D6]/90">
              You retain all rights and intellectual property ownership over your original uploaded resumes, portfolio links, and personal project descriptions. Hirxora and its underlying AI models, UI systems, and design assets are the proprietary property of Hirxora Inc.
            </p>
          </section>

          <section className="bg-[#121214] border border-[#FAF8F5]/10 rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2.5 text-[#FAF8F5] font-serif text-xl">
              <Scale className="w-5 h-5 text-[#FF7E67]" />
              <h2>4. Termination & Modifications</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#E8E2D6]/90">
              We reserve the right to suspend or terminate accounts that engage in platform abuse, automated scraping, reverse engineering, or unauthorized access attempts. We may update these terms periodically with notice on this page.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-[#FAF8F5]/10 pt-6 text-center text-xs text-[#FAF8F5]/50">
          <p>© 2026 Hirxora Inc. All rights reserved. • Contact: <a href="mailto:legal@hirxora.ai" className="text-[#FF7E67] hover:underline">legal@hirxora.ai</a></p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
