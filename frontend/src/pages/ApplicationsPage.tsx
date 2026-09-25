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
} from 'lucide-react';


import { applicationService } from '../services/applicationService';
import { Application, ApplicationCreate, PipelineStats, ApplicationStatus } from '../types/application';

const STAGES: { id: ApplicationStatus; label: string; color: string; bg: string }[] = [
  { id: 'SAVED', label: 'Saved', color: 'text-slate-400', bg: 'border-slate-700 bg-slate-900/40' },
  { id: 'APPLIED', label: 'Applied', color: 'text-blue-400', bg: 'border-blue-500/30 bg-blue-500/5' },
  { id: 'ASSESSMENT', label: 'Assessment', color: 'text-cyan-400', bg: 'border-cyan-500/30 bg-cyan-500/5' },
  { id: 'SHORTLISTED', label: 'Shortlisted', color: 'text-indigo-400', bg: 'border-indigo-500/30 bg-indigo-500/5' },
  { id: 'INTERVIEW', label: 'Interview', color: 'text-purple-400', bg: 'border-purple-500/30 bg-purple-500/5' },
  { id: 'OFFER', label: 'Offer Received', color: 'text-emerald-400', bg: 'border-emerald-500/30 bg-emerald-500/5' },
  { id: 'REJECTED', label: 'Rejected', color: 'text-rose-400', bg: 'border-rose-500/30 bg-rose-500/5' },
  { id: 'WITHDRAWN', label: 'Withdrawn', color: 'text-slate-500', bg: 'border-slate-800 bg-slate-950/40' },
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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold tracking-wide uppercase">
                <Briefcase className="w-3.5 h-3.5" />
                Application Lifecycle Command Center
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Job Applications & Pipeline
              </h1>
              <p className="text-slate-400 max-w-2xl text-sm sm:text-base">
                Track, organize, and advance opportunities across 8 distinct stages with duplicate prevention and automated milestone alerts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition-all shadow-lg shadow-brand-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Track New Opportunity
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Tracked</p>
              <p className="text-2xl font-bold text-white mt-1">{stats?.total_applications || 0}</p>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Pipeline</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{stats?.active_pipeline || 0}</p>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Interviews Scheduled</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{stats?.interviews_count || 0}</p>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Offers Received</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{stats?.offers_count || 0}</p>
            </div>
          </div>
        </div>

        {/* Controls: Search & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, job title, or notes..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Data Table
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading opportunity pipeline...</div>
        ) : viewMode === 'kanban' ? (
          /* Kanban Board View */
          <div className="overflow-x-auto pb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 min-w-[1200px]">
              {STAGES.map((stage) => {
                const stageApps = filteredApps.filter((a) => a.status === stage.id);

                return (
                  <div key={stage.id} className="flex flex-col space-y-3">
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className={`text-xs font-bold ${stage.color}`}>{stage.label}</span>
                      <span className="text-[11px] font-bold font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                        {stageApps.length}
                      </span>
                    </div>

                    {/* Column Cards */}
                    <div className="space-y-3 min-h-[350px] p-1.5 rounded-xl bg-slate-950/40 border border-slate-900">
                      {stageApps.map((app) => (
                        <div
                          key={app.id}
                          className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition shadow-sm space-y-2.5 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
                                {app.company_name}
                              </h4>
                              <p className="text-[11px] text-slate-400 line-clamp-1">{app.job_title}</p>
                            </div>
                            <button
                              onClick={() => handleDelete(app.id)}
                              className="text-slate-500 hover:text-red-400 p-0.5 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {app.match_score && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-[10px] font-mono text-brand-400">
                              <Sparkles className="w-2.5 h-2.5" />
                              {app.match_score}% Match
                            </div>
                          )}

                          {app.interview_date && (
                            <div className="flex items-center gap-1 text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                              <Calendar className="w-3 h-3" />
                              {new Date(app.interview_date).toLocaleDateString()}
                            </div>
                          )}

                          {/* Quick Stage Move Dropdown */}
                          <div className="pt-2 border-t border-slate-800">
                            <select
                              value={app.status}
                              onChange={(e) => handleStageChange(app.id, e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-brand-500 cursor-pointer"
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
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Company</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Stage</th>
                    <th className="py-3.5 px-4">Match</th>
                    <th className="py-3.5 px-4">Applied</th>
                    <th className="py-3.5 px-4">Next Action / Notes</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No applications found.
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-500" />
                          {app.company_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{app.job_title}</td>
                        <td className="py-3.5 px-4">
                          <select
                            value={app.status}
                            onChange={(e) => handleStageChange(app.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-brand-500 cursor-pointer"
                          >
                            {STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-400">
                          {app.match_score ? `${app.match_score}%` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {app.applied_date ? new Date(app.applied_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                          {app.next_action || app.notes || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="text-slate-500 hover:text-red-400 transition p-1"
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
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-brand-400" />
                  Track New Opportunity
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreateApplication} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={modalForm.company_name}
                    onChange={(e) => setModalForm({ ...modalForm, company_name: e.target.value })}
                    placeholder="e.g. Stripe, Razorpay, Google"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    value={modalForm.job_title}
                    onChange={(e) => setModalForm({ ...modalForm, job_title: e.target.value })}
                    placeholder="e.g. Junior Backend Developer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1">Initial Stage</label>
                    <select
                      value={modalForm.status}
                      onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    >
                      {STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1">Location</label>
                    <input
                      type="text"
                      value={modalForm.location || ''}
                      onChange={(e) => setModalForm({ ...modalForm, location: e.target.value })}
                      placeholder="Remote / Bengaluru"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1">Notes / Action</label>
                  <textarea
                    rows={3}
                    value={modalForm.notes || ''}
                    onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                    placeholder="Interview schedule, recruiter contact, or resume tweaks..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingApp || !modalForm.company_name?.trim() || !modalForm.job_title?.trim()}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {savingApp ? 'Saving...' : 'Add to Pipeline'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
