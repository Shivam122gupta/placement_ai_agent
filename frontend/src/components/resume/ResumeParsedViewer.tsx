import React, { useState } from 'react';
import { ParsedResumeData } from '../../types/resume';
import { Award, Briefcase, GraduationCap, FileText } from 'lucide-react';

interface Props {
  parsedData: ParsedResumeData;
}

export const ResumeParsedViewer: React.FC<Props> = ({ parsedData }) => {
  const [activeTab, setActiveTab] = useState<'skills' | 'projects' | 'experience' | 'education'>('skills');

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-2xl border border-gray-800 bg-[#111827]/80 p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{parsedData.full_name || 'Extracted Candidate Profile'}</h2>
            <p className="mt-1 text-xs text-gray-400 flex flex-wrap items-center gap-2">
              {parsedData.contact_email && (
                <a
                  href={`mailto:${parsedData.contact_email}`}
                  className="text-[#FF7E67] hover:underline transition"
                >
                  {parsedData.contact_email}
                </a>
              )}
              {parsedData.phone && (
                <>
                  <span>•</span>
                  <a
                    href={`tel:${parsedData.phone.replace(/[^+\d]/g, '')}`}
                    className="text-[#FF7E67] hover:underline transition"
                  >
                    {parsedData.phone}
                  </a>
                </>
              )}
              {parsedData.location && (
                <>
                  <span>•</span>
                  <span>{parsedData.location}</span>
                </>
              )}
            </p>
          </div>
          {parsedData.summary && (
            <div className="max-w-md rounded-xl bg-gray-900/60 p-3 text-xs text-gray-300 border border-gray-800 italic">
              "{parsedData.summary}"
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-800 pt-4">
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'skills'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-gray-850 text-gray-400 hover:text-gray-200'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>Skills ({parsedData.skills?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'projects'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-gray-850 text-gray-400 hover:text-gray-200'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Projects ({parsedData.projects?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('experience')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'experience'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-gray-850 text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Experience ({parsedData.experience?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('education')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'education'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-gray-850 text-gray-400 hover:text-gray-200'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Education ({parsedData.education?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border border-gray-800 bg-[#111827]/80 p-6 shadow-xl">
        {activeTab === 'skills' && (
          <div>
            <h3 className="text-sm font-bold text-white mb-3">Extracted Skills</h3>
            <div className="flex flex-wrap gap-2">
              {parsedData.skills?.map((skill, i) => (
                <span
                  key={i}
                  className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-300"
                >
                  {skill.name} <span className="text-[10px] text-gray-400">({skill.category})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Extracted Projects</h3>
            {parsedData.projects?.map((proj, i) => (
              <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                <h4 className="text-sm font-bold text-white">{proj.name}</h4>
                <p className="mt-1 text-xs text-gray-400">{proj.description}</p>
                {proj.technologies && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {proj.technologies.map((t, idx) => (
                      <span key={idx} className="rounded bg-gray-800 px-2 py-0.5 text-[10px] text-gray-300">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Work & Internship Experience</h3>
            {parsedData.experience?.length ? (
              parsedData.experience.map((exp, i) => (
                <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{exp.role} @ {exp.company}</h4>
                    <span className="text-xs text-gray-400">{exp.duration}</span>
                  </div>
                  {exp.highlights?.length ? (
                    <ul className="mt-2 list-disc list-inside text-xs text-gray-400 space-y-1">
                      {exp.highlights.map((h, idx) => (
                        <li key={idx}>{h}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">No work experience listed.</p>
            )}
          </div>
        )}

        {activeTab === 'education' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Education Details</h3>
            {parsedData.education?.map((edu, i) => (
              <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                <h4 className="text-sm font-bold text-white">{edu.degree}</h4>
                <p className="text-xs text-gray-400">{edu.college} {edu.graduation_year ? `• ${edu.graduation_year}` : ''}</p>
                {edu.cgpa && <p className="mt-1 text-xs text-brand-400">CGPA / Score: {edu.cgpa}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
