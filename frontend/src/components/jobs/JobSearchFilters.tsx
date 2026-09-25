import React, { useState } from 'react';
import { Search, MapPin, Briefcase, Filter } from 'lucide-react';
import { JobSearchFilters } from '../../types/job';

interface Props {
  onSearch: (filters: JobSearchFilters) => void;
  loading: boolean;
}

export const JobSearchFiltersBar: React.FC<Props> = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      query: query.trim() || undefined,
      location: location.trim() || undefined,
      employment_type: employmentType || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Role title, keywords, company..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, State, or Remote..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="relative">
          <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 appearance-none transition-colors"
          >
            <option value="">All Employment Types</option>
            <option value="Internship">Internship</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-200 disabled:opacity-50"
        >
          <Filter className="h-4 w-4" />
          <span>{loading ? 'Searching...' : 'Filter Jobs'}</span>
        </button>
      </div>
    </form>
  );
};
