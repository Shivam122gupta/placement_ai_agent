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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#121214] border border-[#FAF8F5]/20 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 text-[#FAF8F5]">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 rounded-xl bg-white/10 text-[#FAF8F5] border border-white/15 shadow-md">
            <Sparkles className="h-5 w-5 text-[#FAF8F5]" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-normal text-white">AI Job Description Analyzer</h2>
            <p className="text-xs text-neutral-400">
              Paste any raw JD or LinkedIn post to extract verified hard requirements & skills instantly.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center space-x-3 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!result ? (
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-medium text-[#FAF8F5]/70 uppercase tracking-wider mb-2">
                  Role Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Junior Backend Engineer"
                  className="w-full bg-[#18181B] border border-[#FAF8F5]/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FAF8F5]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-medium text-[#FAF8F5]/70 uppercase tracking-wider mb-2">
                  Company Name (Optional)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-[#18181B] border border-[#FAF8F5]/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FAF8F5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-[#FAF8F5]/70 uppercase tracking-wider mb-2">
                Raw Job Description Text *
              </label>
              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the full job post, role overview, technical requirements, and responsibilities here..."
                required
                className="w-full bg-[#18181B] border border-[#FAF8F5]/15 rounded-xl p-4 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#FAF8F5] resize-none font-mono"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#FAF8F5]/10">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-[#FAF8F5]/15 text-neutral-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg shadow-[#FF6B6B]/25 transition-all duration-200 disabled:opacity-50 cursor-pointer active:scale-95 text-xs"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing JD with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                    <span>Run Intelligent Analysis</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-[#FAF8F5]/20 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">{result.title}</h3>
                <p className="text-xs font-mono text-[#FAF8F5]/80">{result.company}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Extraction Complete
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#18181B] border border-[#FAF8F5]/15">
                <div className="flex items-center space-x-2 mb-3 text-emerald-400 font-semibold text-xs font-mono uppercase">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Mandatory Required Skills ({result.requirements.required_skills?.length || 0})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.requirements.required_skills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-white/10 text-[#FAF8F5] border border-white/15"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#18181B] border border-[#FAF8F5]/15">
                <div className="flex items-center space-x-2 mb-3 text-[#FAF8F5] font-semibold text-xs font-mono uppercase">
                  <Sparkles className="h-4 w-4" />
                  <span>Bonus / Preferred Skills ({result.requirements.preferred_skills?.length || 0})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.requirements.preferred_skills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-black/40 text-neutral-300 border border-white/[0.08]"
                    >
                      {skill}
                    </span>
                  ))}
                  {(!result.requirements.preferred_skills || result.requirements.preferred_skills.length === 0) && (
                    <span className="text-xs text-neutral-500 italic">None specifically identified</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#18181B] border border-[#FAF8F5]/15 space-y-3">
              <div className="flex items-center space-x-2 text-white font-semibold text-xs font-mono uppercase">
                <ListChecks className="h-4 w-4 text-[#FAF8F5]" />
                <span>Extracted Key Responsibilities</span>
              </div>
              <ul className="space-y-1.5 text-xs text-neutral-300 pl-4 list-disc font-sans">
                {result.requirements.responsibilities?.map((resp, idx) => (
                  <li key={idx}>{resp}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#FAF8F5]/10">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl border border-[#FAF8F5]/20 text-neutral-300 hover:text-white hover:bg-white/5 text-xs font-medium transition-colors cursor-pointer"
              >
                Analyze Another JD
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white text-xs font-semibold shadow-lg shadow-[#FF6B6B]/25 transition-all cursor-pointer active:scale-95"
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

