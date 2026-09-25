import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, ListChecks } from 'lucide-react';
import { jobService } from '../../services/jobService';
import { JDAnalysisResponse } from '../../types/job';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const JDAnalyzerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JDAnalysisResponse | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rawText.trim().length < 20) {
      setError('Please provide at least 20 characters of job description text.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await jobService.analyzeJD({
        raw_text: rawText,
        title: title.trim() || undefined,
        company: company.trim() || undefined,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to analyze Job Description.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setRawText('');
    setTitle('');
    setCompany('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">AI Job Description Analyzer</h2>
            <p className="text-xs text-slate-400">
              Paste any raw JD or LinkedIn post to extract verified hard requirements & skills instantly.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center space-x-3 text-red-400 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!result ? (
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Role Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Junior Backend Engineer"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Company Name (Optional)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Raw Job Description Text *
              </label>
              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the full job post, role overview, technical requirements, and responsibilities here..."
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-mono"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing JD with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Run Intelligent Analysis</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100">{result.title}</h3>
                <p className="text-sm text-indigo-400">{result.company}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Extraction Complete
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center space-x-2 mb-3 text-indigo-400 font-semibold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Mandatory Required Skills ({result.requirements.required_skills?.length || 0})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.requirements.required_skills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-800/50"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center space-x-2 mb-3 text-purple-400 font-semibold text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>Bonus / Preferred Skills ({result.requirements.preferred_skills?.length || 0})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.requirements.preferred_skills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 border border-slate-700/60"
                    >
                      {skill}
                    </span>
                  ))}
                  {(!result.requirements.preferred_skills || result.requirements.preferred_skills.length === 0) && (
                    <span className="text-xs text-slate-500 italic">None specifically identified</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
                <ListChecks className="h-4 w-4 text-indigo-400" />
                <span>Extracted Key Responsibilities</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 pl-4 list-disc">
                {result.requirements.responsibilities?.map((resp, idx) => (
                  <li key={idx}>{resp}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Analyze Another JD
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-lg shadow-indigo-600/20 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
