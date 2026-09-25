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
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-indigo-100 to-indigo-400">
              Live Job Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Verified Pipeline
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Browse ingested internships and entry-level positions with real-time requirement parsing.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAnalyzerOpen(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-2.5 px-5 rounded-xl shadow-lg shadow-purple-600/20 transition-all duration-200 text-sm"
          >
            <Sparkles className="h-4 w-4" />
            <span>Analyze Custom JD</span>
          </button>

          <button
            onClick={() => fetchJobs()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors disabled:opacity-50"
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
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center space-x-3 text-red-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Job Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse p-6"
            />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-4">
            <Briefcase className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">No Jobs Found</h3>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            Try tweaking your search keywords or location filters.
          </p>
          <button
            onClick={() => fetchJobs()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
