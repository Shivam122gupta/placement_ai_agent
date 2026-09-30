import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, Database, Eye, FileText } from 'lucide-react';
import { SEO } from '../components/common/SEO';

export const PrivacyPolicyPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#080607] text-[#FAF8F5] selection:bg-[#FF6B6B] selection:text-white">
      <SEO
        title="Privacy Policy — Hirxora"
        description="Read Hirxora's privacy policy, data encryption standards, and user data rights."
      />
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#FAF8F5]">Privacy Policy</h1>
              <p className="text-xs font-mono text-[#FAF8F5]/50 mt-1">Last Updated: September 2026 • Version 1.2</p>
            </div>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-[#121214] border border-[#FAF8F5]/15 rounded-2xl p-6 sm:p-8 space-y-4 text-sm sm:text-base text-[#E8E2D6] leading-relaxed font-sans">
          <p>
            At <strong>Hirxora</strong> (“we,” “our,” or “us”), we prioritize the privacy and security of your personal and professional data. This Privacy Policy explains what information we collect, how we process it to deliver autonomous career assistance, and your rights regarding your data.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8 text-sm sm:text-base text-[#E8E2D6] leading-relaxed font-sans">
          {/* Section 1 */}
          <section className="bg-[#121214] border border-[#FAF8F5]/10 rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2.5 text-[#FAF8F5] font-serif text-xl">
              <Database className="w-5 h-5 text-[#FF7E67]" />
              <h2>1. Information We Collect</h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-[#E8E2D6]/90">
              <li><strong>Account Information:</strong> Your name, email address, password hash, and basic profile settings when registering.</li>
              <li><strong>Career Documents & Resumes:</strong> PDF, DOCX, or text files uploaded to analyze skills, education, work experience, and projects.</li>
              <li><strong>Mock Interview & Assessment Data:</strong> Transcripts, audio recordings (if microphone is enabled), and AI feedback generated during practice interviews.</li>
              <li><strong>Usage Telemetry:</strong> Anonymized interaction metrics (feature usage, latency, device type) used solely to enhance system reliability.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-[#121214] border border-[#FAF8F5]/10 rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2.5 text-[#FAF8F5] font-serif text-xl">
              <Lock className="w-5 h-5 text-[#FF7E67]" />
              <h2>2. How We Protect & Process Your Data</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#E8E2D6]/90">
              All documents and personal data are encrypted in transit via TLS 1.3 and stored in isolated storage volumes. We do not sell your personal data or resume information to third-party recruiters without your explicit permission.
            </p>
            <p className="text-xs sm:text-sm text-[#E8E2D6]/90">
              When processing resumes with Large Language Models (LLMs), your data is handled strictly for inference and analysis. Your private resume data is <strong>never used to train public foundational models</strong>.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-[#121214] border border-[#FAF8F5]/10 rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2.5 text-[#FAF8F5] font-serif text-xl">
              <Eye className="w-5 h-5 text-[#FF7E67]" />
              <h2>3. Your Data Rights & Deletion</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#E8E2D6]/90">
              You retain full ownership of your data. You may at any time:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#E8E2D6]/90">
              <li>View and export your parsed resume and career profile data.</li>
              <li>Delete individual resumes, interview recordings, or job applications.</li>
              <li>Request complete account deletion and data wiping by contacting us at <a href="mailto:privacy@hirxora.ai" className="text-[#FF7E67] underline">privacy@hirxora.ai</a>.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-[#121214] border border-[#FAF8F5]/10 rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2.5 text-[#FAF8F5] font-serif text-xl">
              <FileText className="w-5 h-5 text-[#FF7E67]" />
              <h2>4. Cookies and Local Storage</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#E8E2D6]/90">
              We use essential cookies and browser local storage strictly for maintaining your secure authentication session, theme preferences, and essential user settings. We do not use intrusive third-party cross-site advertising trackers.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-[#FAF8F5]/10 pt-6 text-center text-xs text-[#FAF8F5]/50">
          <p>© 2026 Hirxora Inc. All rights reserved. • Questions? Email <a href="mailto:support@hirxora.ai" className="text-[#FF7E67] hover:underline">support@hirxora.ai</a></p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
