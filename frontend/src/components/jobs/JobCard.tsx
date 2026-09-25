import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Briefcase, Calendar, ChevronRight } from 'lucide-react';
import { Job } from '../../types/job';

interface Props {
  job: Job;
}

export const JobCard: React.FC<Props> = ({ job }) => {
  const reqSkills = job.requirements?.required_skills || [];
  const prefSkills = job.requirements?.preferred_skills || [];

  return (
    <div className="group bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-indigo-500/10 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-100 group-hover:text-indigo-400 transition-colors">
                {job.title}
              </h3>
              <p className="text-slate-400 text-sm font-medium">{job.company}</p>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            {job.employment_type}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-4 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-500" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Briefcase className="h-3.5 w-3.5 text-slate-500" />
            <span>{job.requirements?.min_experience_years || 0} yrs min exp</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>Verified: {new Date(job.last_verified_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Skills Tag Pills */}
        <div className="mt-5 space-y-2">
          {reqSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Required:</span>
              {reqSkills.slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-800/50"
                >
                  {skill}
                </span>
              ))}
              {reqSkills.length > 4 && (
                <span className="text-xs text-slate-400 self-center">+{reqSkills.length - 4} more</span>
              )}
            </div>
          )}

          {prefSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">Bonus:</span>
              {prefSkills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-xs text-slate-500">Source: <strong className="text-slate-400 font-medium">{job.source}</strong></span>
        <Link
          to={`/jobs/${job.id}`}
          className="inline-flex items-center space-x-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 group-hover:translate-x-0.5 transition-all"
        >
          <span>View Breakdown</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};
