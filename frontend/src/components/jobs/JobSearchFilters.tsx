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
    <form onSubmit={handleSubmit} className="bg-[#121214] border border-[#FAF8F5]/15 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Role title, keywords, company..."
            className="w-full bg-[#18181B] border border-[#FAF8F5]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FAF8F5] transition-colors"
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, State, or Remote..."
            className="w-full bg-[#18181B] border border-[#FAF8F5]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FAF8F5] transition-colors"
          />
        </div>

        <div className="relative">
          <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500 pointer-events-none" />
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="w-full bg-[#18181B] border border-[#FAF8F5]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FAF8F5] cursor-pointer appearance-none transition-colors"
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
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg shadow-[#FF6B6B]/25 transition-all duration-200 disabled:opacity-50 cursor-pointer active:scale-95 text-xs"
        >
          <Filter className="h-4 w-4" />
          <span>{loading ? 'Searching...' : 'Filter Jobs'}</span>
        </button>
      </div>
    </form>
  );
};

