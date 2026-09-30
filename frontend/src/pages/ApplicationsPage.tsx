import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Calendar,
  Sparkles,
  Trash2,
  Building2,
  X,
} from 'lucide-react';

import { applicationService } from '../services/applicationService';
import { Application, ApplicationCreate, PipelineStats, ApplicationStatus } from '../types/application';
import { SEO } from '../components/common/SEO';

const STAGES: { id: ApplicationStatus; label: string; dotColor: string; badgeBg: string }[] = [
  { id: 'SAVED', label: 'Saved', dotColor: 'bg-neutral-500', badgeBg: 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20' },
  { id: 'APPLIED', label: 'Applied', dotColor: 'bg-[#FAF8F5]/60', badgeBg: 'bg-white/10 text-[#FAF8F5] border-white/20' },
  { id: 'ASSESSMENT', label: 'Assessment', dotColor: 'bg-[#FAF8F5]/80', badgeBg: 'bg-white/15 text-[#FAF8F5] border-white/30' },
  { id: 'SHORTLISTED', label: 'Shortlisted', dotColor: 'bg-[#FAF8F5]', badgeBg: 'bg-white/20 text-[#FAF8F5] border-white/40' },
  { id: 'INTERVIEW', label: 'Interview', dotColor: 'bg-amber-400', badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { id: 'OFFER', label: 'Offer Received', dotColor: 'bg-emerald-400', badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { id: 'REJECTED', label: 'Rejected', dotColor: 'bg-rose-500', badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { id: 'WITHDRAWN', label: 'Withdrawn', dotColor: 'bg-neutral-600', badgeBg: 'bg-neutral-600/10 text-neutral-400 border-neutral-600/20' },
];

export const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalForm, setModalForm] = useState<ApplicationCreate>({
    company_name: '',
    job_title: '',
    status: 'SAVED',
    location: '',
    salary_offered: '',
    notes: '',
  });
  const [savingApp, setSavingApp] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsData, statsData] = await Promise.all([
        applicationService.listApplications(),
        applicationService.getStats(),
      ]);
      setApplications(appsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load application pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.company_name?.trim() || !modalForm.job_title?.trim()) return;

    try {
      setSavingApp(true);
      setModalError(null);
      await applicationService.createApplication(modalForm);
      setShowModal(false);
      setModalForm({
        company_name: '',
        job_title: '',
        status: 'SAVED',
        location: '',
        salary_offered: '',
        notes: '',
      });
      await fetchData();
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to save application.');
    } finally {
      setSavingApp(false);
    }
  };

  const handleStageChange = async (appId: string, newStatus: string) => {
    try {
      await applicationService.updateApplication(appId, { status: newStatus });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
      const updatedStats = await applicationService.getStats();
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  const handleDelete = async (appId: string) => {
    try {
      await applicationService.deleteApplication(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      const updatedStats = await applicationService.getStats();
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  const filteredApps = applications.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.company_name.toLowerCase().includes(q) ||
      a.job_title.toLowerCase().includes(q) ||
      (a.notes && a.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 pb-16">
      <SEO
        title="Applications Tracker — Hirxora"
        description="Track your job applications, interview stages, offer statuses, and upcoming follow-ups."
      />
      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-[#121214] border border-[#FAF8F5]/15 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/[0.02] rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-[#FAF8F5]/15 text-[#FAF8F5] text-xs font-mono font-medium">
              <span className="p-1 rounded bg-white/10">
                <Briefcase className="w-3 h-3 text-[#FAF8F5]" />
              </span>
              Application Lifecycle
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-[#FAF8F5]">
              Opportunity Pipeline
            </h1>
            <p className="text-neutral-400 max-w-2xl text-sm leading-relaxed font-sans">
              Track, organize, and advance opportunities across 8 distinct stages with live match metrics and interview milestones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white font-semibold text-sm transition-all shadow-lg shadow-[#FF6B6B]/25 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Track New Opportunity
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-8 pt-6 border-t border-[#FAF8F5]/10 grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
          <div className="bg-[#18181B]/80 p-4 rounded-2xl border border-[#FAF8F5]/10">
            <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Total Tracked</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">{stats?.total_applications || 0}</p>
          </div>
          <div className="bg-[#18181B]/80 p-4 rounded-2xl border border-[#FAF8F5]/10">
            <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Active Pipeline</p>
            <p className="text-2xl font-bold font-mono text-[#FAF8F5] mt-1">{stats?.active_pipeline || 0}</p>
          </div>
          <div className="bg-[#18181B]/80 p-4 rounded-2xl border border-[#FAF8F5]/10">
            <p className="text-[10px] text-amber-400 font-mono uppercase tracking-wider">Interviews</p>
            <p className="text-2xl font-bold font-mono text-amber-300 mt-1">{stats?.interviews_count || 0}</p>
          </div>
          <div className="bg-[#18181B]/80 p-4 rounded-2xl border border-[#FAF8F5]/10">
            <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">Offers Received</p>
            <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{stats?.offers_count || 0}</p>
          </div>
        </div>
      </div>

      {/* Controls: Search & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, job title, or notes..."
            className="w-full bg-[#121214] border border-[#FAF8F5]/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#FAF8F5]/50 transition-all font-sans"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#121214] border border-[#FAF8F5]/15 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] text-white font-semibold shadow-md shadow-[#FF6B6B]/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Kanban Board
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] text-white font-semibold shadow-md shadow-[#FF6B6B]/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            Data Table
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-20 text-center text-[#FAF8F5]/70 font-mono text-sm flex items-center justify-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FAF8F5] animate-ping" />
          Loading opportunity pipeline...
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div className="overflow-x-auto pb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3.5 min-w-[1280px]">
            {STAGES.map((stage) => {
              const stageApps = filteredApps.filter((a) => a.status === stage.id);

              return (
                <div key={stage.id} className="flex flex-col space-y-3">
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#121214] border border-[#FAF8F5]/15">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
                      <span className="text-xs font-medium text-white">{stage.label}</span>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-[#FAF8F5] bg-white/10 px-2 py-0.5 rounded-md border border-white/15">
                      {stageApps.length}
                    </span>
                  </div>

                  {/* Column Cards */}
                  <div className="space-y-2.5 min-h-[400px] p-2 rounded-2xl bg-[#18181B]/40 border border-[#FAF8F5]/10">
                    {stageApps.map((app) => (
                      <div
                        key={app.id}
                        className="bg-[#121214] border border-[#FAF8F5]/15 hover:border-[#FAF8F5]/40 rounded-xl p-3.5 transition-all shadow-sm space-y-3 group hover:shadow-lg hover:shadow-white/5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-semibold text-white group-hover:text-[#FAF8F5] transition-colors line-clamp-1">
                              {app.company_name}
                            </h4>
                            <p className="text-[11px] text-neutral-400 line-clamp-1">{app.job_title}</p>
                          </div>
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="text-neutral-600 hover:text-rose-400 p-0.5 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {app.match_score && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] font-mono font-medium text-[#FAF8F5]">
                              <Sparkles className="w-2.5 h-2.5 text-[#FAF8F5]" />
                              {app.match_score}% Match
                            </span>
                          )}

                          {app.interview_date && (
                            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              <Calendar className="w-3 h-3" />
                              {new Date(app.interview_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Quick Stage Move Dropdown */}
                        <div className="pt-2 border-t border-[#FAF8F5]/10">
                          <select
                            value={app.status}
                            onChange={(e) => handleStageChange(app.id, e.target.value)}
                            className="w-full bg-[#18181B] border border-[#FAF8F5]/15 rounded-lg px-2 py-1 text-[10px] text-neutral-300 focus:outline-none focus:border-[#FAF8F5]/50 cursor-pointer"
                          >
                            {STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                Move: {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Data Table View */
        <div className="bg-[#121214] border border-[#FAF8F5]/15 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181B] border-b border-[#FAF8F5]/15 text-neutral-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-medium">Company</th>
                  <th className="py-3.5 px-4 font-medium">Role</th>
                  <th className="py-3.5 px-4 font-medium">Stage</th>
                  <th className="py-3.5 px-4 font-medium">Match</th>
                  <th className="py-3.5 px-4 font-medium">Applied</th>
                  <th className="py-3.5 px-4 font-medium">Next Action / Notes</th>
                  <th className="py-3.5 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF8F5]/10">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-500 font-mono">
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2.5">
                        <span className="p-1 rounded bg-white/10 border border-white/15">
                          <Building2 className="w-3.5 h-3.5 text-[#FAF8F5]" />
                        </span>
                        {app.company_name}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-300">{app.job_title}</td>
                      <td className="py-3.5 px-4">
                        <select
                          value={app.status}
                          onChange={(e) => handleStageChange(app.id, e.target.value)}
                          className="bg-[#18181B] border border-[#FAF8F5]/15 rounded-lg px-2.5 py-1 text-xs text-neutral-300 focus:outline-none focus:border-[#FAF8F5]/50 cursor-pointer"
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-[#FAF8F5]">
                        {app.match_score ? `${app.match_score}%` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-400 font-mono text-[11px]">
                        {app.applied_date ? new Date(app.applied_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-400 max-w-xs truncate">
                        {app.next_action || app.notes || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="text-neutral-500 hover:text-rose-400 transition p-1 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Track New Opportunity Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#FAF8F5]/20 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#FAF8F5]/15">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-white/10 border border-[#FAF8F5]/20">
                  <Briefcase className="w-4 h-4 text-[#FAF8F5]" />
                </span>
                <h3 className="text-lg font-serif font-medium text-white">
                  Track New Opportunity
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateApplication} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono text-[10px] text-[#FAF8F5]/80 uppercase tracking-wider mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.company_name}
                  onChange={(e) => setModalForm({ ...modalForm, company_name: e.target.value })}
                  placeholder="e.g. Stripe, OpenAI, Google"
                  className="w-full bg-[#18181B] border border-[#FAF8F5]/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#FAF8F5]/50"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] text-[#FAF8F5]/80 uppercase tracking-wider mb-1.5">
                  Job Title
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.job_title}
                  onChange={(e) => setModalForm({ ...modalForm, job_title: e.target.value })}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full bg-[#18181B] border border-[#FAF8F5]/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#FAF8F5]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] text-[#FAF8F5]/80 uppercase tracking-wider mb-1.5">
                    Initial Stage
                  </label>
                  <select
                    value={modalForm.status}
                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                    className="w-full bg-[#18181B] border border-[#FAF8F5]/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FAF8F5]/50 cursor-pointer"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-[#FAF8F5]/80 uppercase tracking-wider mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={modalForm.location || ''}
                    onChange={(e) => setModalForm({ ...modalForm, location: e.target.value })}
                    placeholder="Remote / Bengaluru"
                    className="w-full bg-[#18181B] border border-[#FAF8F5]/15 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#FAF8F5]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-[#FAF8F5]/80 uppercase tracking-wider mb-1.5">
                  Notes / Next Action
                </label>
                <textarea
                  rows={3}
                  value={modalForm.notes || ''}
                  onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                  placeholder="Interview schedule, recruiter contact, or resume tweaks..."
                  className="w-full bg-[#18181B] border border-[#FAF8F5]/15 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#FAF8F5]/50 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#FAF8F5]/15">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingApp || !modalForm.company_name?.trim() || !modalForm.job_title?.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white font-semibold text-xs transition shadow-md shadow-[#FF6B6B]/25 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {savingApp ? 'Saving...' : 'Add to Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

