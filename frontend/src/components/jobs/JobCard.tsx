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
    <div className="group bg-[#121214] hover:bg-[#18181B] border border-[#FAF8F5]/15 hover:border-[#FAF8F5]/35 rounded-3xl p-6 transition-all duration-300 shadow-xl hover:shadow-white/5 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-[#FAF8F5]/15 flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-[#FAF8F5]" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white group-hover:text-[#FAF8F5] transition-colors">
                {job.title}
              </h3>
              <p className="text-neutral-400 text-xs font-medium mt-0.5">{job.company}</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-white/10 text-[#FAF8F5] border border-white/15 shrink-0">
            {job.employment_type}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-4 text-xs text-neutral-400 font-mono">
          <div className="flex items-center space-x-1.5">
            <MapPin className="h-3.5 w-3.5 text-neutral-500" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Briefcase className="h-3.5 w-3.5 text-neutral-500" />
            <span>{job.requirements?.min_experience_years || 0} yrs min</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Calendar className="h-3.5 w-3.5 text-neutral-500" />
            <span>Verified: {new Date(job.last_verified_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Skills Tag Pills */}
        <div className="mt-5 space-y-2">
          {reqSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono font-medium text-[#FAF8F5] uppercase tracking-wider mr-1">Required:</span>
              {reqSkills.slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium bg-white/10 text-[#FAF8F5] border border-white/15"
                >
                  {skill}
                </span>
              ))}
              {reqSkills.length > 4 && (
                <span className="text-xs text-neutral-400 self-center">+{reqSkills.length - 4} more</span>
              )}
            </div>
          )}

          {prefSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-wider mr-1">Bonus:</span>
              {prefSkills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg text-xs font-mono font-medium bg-black/40 text-neutral-300 border border-white/[0.08]"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-[#FAF8F5]/10 flex items-center justify-between">
        <span className="text-xs text-neutral-500 font-mono">Source: <strong className="text-neutral-400 font-medium">{job.source}</strong></span>
        <Link
          to={`/jobs/${job.id}`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#FAF8F5] hover:text-white group-hover:translate-x-0.5 transition-all"
        >
          <span>View Breakdown</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

