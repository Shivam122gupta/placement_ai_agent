import React, { useEffect, useState } from 'react';
import { Briefcase, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { jobService } from '../services/jobService';
import { Job, JobSearchFilters } from '../types/job';
import { JobSearchFiltersBar } from '../components/jobs/JobSearchFilters';
import { JobCard } from '../components/jobs/JobCard';
import { JDAnalyzerModal } from '../components/jobs/JDAnalyzerModal';

export const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);

  const fetchJobs = async (filters?: JobSearchFilters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await jobService.listJobs(filters);
      setJobs(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch job opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearch = (filters: JobSearchFilters) => {
    fetchJobs(filters);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-[#FAF8F5]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#FAF8F5]/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-serif font-normal text-white">
              Job Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/25">
              Verified Pipeline
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

          <button
            onClick={() => fetchJobs()}
            disabled={loading}
            className="p-2 rounded-xl border border-[#FAF8F5]/20 bg-[#121214] hover:bg-[#FAF8F5]/10 text-[#FAF8F5] hover:text-white transition disabled:opacity-50 cursor-pointer"
            title="Refresh Listings"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <JobSearchFiltersBar onSearch={handleSearch} loading={loading} />

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center space-x-3 text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Job Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-64 rounded-3xl bg-[#121214] border border-[#FAF8F5]/15 animate-pulse p-6"
            />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-[#121214] border border-[#FAF8F5]/15 rounded-3xl p-12 text-center max-w-lg mx-auto backdrop-blur-xl">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-[#FAF8F5]/10 border border-[#FAF8F5]/20 flex items-center justify-center text-[#FAF8F5] mb-4">
            <Briefcase className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-semibold text-white">No Jobs Found</h3>
          <p className="text-[#E8E2D6]/75 text-xs mt-1 mb-5">
            Try tweaking your search keywords or location filters.
          </p>
          <button
            onClick={() => fetchJobs()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white font-semibold text-xs transition cursor-pointer shadow-md shadow-[#FF6B6B]/25 active:scale-95"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* JD Analyzer Modal */}
      <JDAnalyzerModal
        isOpen={isAnalyzerOpen}
        onClose={() => setIsAnalyzerOpen(false)}
      />
    </div>
  );
};
