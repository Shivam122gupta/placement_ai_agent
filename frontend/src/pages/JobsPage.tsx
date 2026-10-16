import React, { useState } from 'react';
import {
  Sparkles,
  Globe,
  Cpu,
  Clock,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { JobSearchFilters } from '../types/job';
import { JobSearchFiltersBar } from '../components/jobs/JobSearchFilters';
import { JDAnalyzerModal } from '../components/jobs/JDAnalyzerModal';
import { SEO } from '../components/common/SEO';

export const JobsPage: React.FC = () => {
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);

  const handleSearch = (_filters: JobSearchFilters) => {
    setSearchNotice(
      'Live job ingestion pipeline is currently in development. In the meantime, you can analyze any custom job description with our AI Copilot below!'
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-[#FAF8F5]">
      <SEO
        title="Job Intelligence & Discovery — Hirxora"
        description="Autonomous tech job discovery, verified ATS ingestion, and live candidate fit scoring coming soon to Hirxora."
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#FAF8F5]/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-serif font-normal text-white">
              Job Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#FF6B6B]/15 text-[#FF7E67] border border-[#FF6B6B]/30 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B6B] animate-pulse" />
              Verified Pipeline • Coming Soon
            </span>
          </div>
          <p className="text-[#E8E2D6]/75 text-xs mt-1">
            Browse ingested internships and developer positions with real-time requirement parsing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAnalyzerOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white font-semibold py-2 px-4 rounded-xl shadow-md shadow-[#FF6B6B]/25 transition-all text-xs cursor-pointer active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span>Analyze Custom JD</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Preview mode) */}
      <div className="space-y-3">
        <JobSearchFiltersBar onSearch={handleSearch} loading={false} />

        {searchNotice && (
          <div className="p-3.5 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 flex items-center justify-between gap-3 text-xs text-[#E8E2D6] animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2.5">
              <Zap className="h-4 w-4 text-[#FF7E67] shrink-0" />
              <span>{searchNotice}</span>
            </div>
            <button
              onClick={() => setIsAnalyzerOpen(true)}
              className="text-[#FF7E67] hover:underline font-semibold text-xs whitespace-nowrap cursor-pointer"
            >
              Open Analyzer →
            </button>
          </div>
        )}
      </div>

      {/* Coming Soon Showcase Card */}
      <div className="relative rounded-[28px] p-[1.5px] overflow-hidden bg-gradient-to-b from-[#FAF8F5]/25 via-[#FAF8F5]/10 to-transparent shadow-2xl shadow-black/80">
        <div className="bg-[#121214]/95 backdrop-blur-3xl rounded-[26px] p-8 sm:p-14 text-center relative overflow-hidden">
          {/* Ambient Glow Orbs */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF6B6B]/15 blur-[120px] rounded-full" />
          <div className="pointer-events-none absolute -bottom-24 right-10 w-80 h-80 bg-[#FAF8F5]/5 blur-[100px] rounded-full" />

          {/* Pulsing Status Pill */}
          <div className="relative z-10 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-[#FF6B6B]/10 text-[#FF7E67] border border-[#FF6B6B]/30 mb-5 shadow-lg shadow-[#FF6B6B]/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B6B] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6B6B]" />
            </span>
            <span>Live Job Intelligence Engine • Coming Soon</span>
          </div>

          {/* Heading */}
          <h2 className="relative z-10 text-2xl sm:text-4xl md:text-5xl font-serif font-normal text-[#FAF8F5] max-w-3xl mx-auto leading-tight">
            Autonomous Ingestion & Verified Pipeline
          </h2>

          {/* Subtitle */}
          <p className="relative z-10 text-xs sm:text-sm md:text-base text-[#E8E2D6]/80 max-w-2xl mx-auto mt-4 leading-relaxed font-sans">
            We are actively building our real-time engineering crawlers and direct ATS connectors to index developer roles, engineering internships, and early-career campus openings with instant semantic fit scoring.
          </p>

          {/* 3 Feature Preview Cards */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-10 text-left">
            {/* Feature 1 */}
            <div className="rounded-2xl p-5 bg-[#18181B]/80 border border-[#FAF8F5]/15 backdrop-blur-md hover:border-[#FF6B6B]/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 flex items-center justify-center text-[#FF7E67] mb-3 group-hover:scale-105 transition transform">
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-sm font-semibold text-white">Direct ATS Crawling</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FAF8F5]/5 text-neutral-400 border border-[#FAF8F5]/10">
                  Greenhouse / Lever
                </span>
              </div>
              <p className="text-xs text-[#E8E2D6]/70 leading-relaxed">
                Direct indexing from verified engineering career portals. Zero agency spam, zero ghost listings.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl p-5 bg-[#18181B]/80 border border-[#FAF8F5]/15 backdrop-blur-md hover:border-[#FF6B6B]/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 flex items-center justify-center text-[#FF7E67] mb-3 group-hover:scale-105 transition transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-sm font-semibold text-white">Semantic Fit Matrix</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FAF8F5]/5 text-neutral-400 border border-[#FAF8F5]/10">
                  Vector Match
                </span>
              </div>
              <p className="text-xs text-[#E8E2D6]/70 leading-relaxed">
                Vector similarity scoring compares your active resume against required vs bonus tech stacks.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl p-5 bg-[#18181B]/80 border border-[#FAF8F5]/15 backdrop-blur-md hover:border-[#FF6B6B]/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 flex items-center justify-center text-[#FF7E67] mb-3 group-hover:scale-105 transition transform">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-sm font-semibold text-white">1-Click Tailored Prep</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FAF8F5]/5 text-neutral-400 border border-[#FAF8F5]/10">
                  AI Grounding
                </span>
              </div>
              <p className="text-xs text-[#E8E2D6]/70 leading-relaxed">
                Instant custom resume bullet points and dedicated mock interview arenas generated per job.
              </p>
            </div>
          </div>

          {/* Action Area */}
          <div className="relative z-10 mt-10 pt-8 border-t border-[#FAF8F5]/10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setIsAnalyzerOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#ff5757] hover:to-[#f96155] text-white font-semibold text-sm transition shadow-lg shadow-[#FF6B6B]/30 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze Any Custom Job Description</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 px-3 py-2 rounded-xl bg-[#18181B]/60 border border-[#FAF8F5]/10">
              <Clock className="w-3.5 h-3.5 text-[#FF7E67]" />
              <span>Engine Calibration in Progress • Q4 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* JD Analyzer Modal */}
      <JDAnalyzerModal
        isOpen={isAnalyzerOpen}
        onClose={() => setIsAnalyzerOpen(false)}
      />
    </div>
  );
};

export default JobsPage;
