import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  RefreshCw,
  Plus,
  BookOpen,
  Briefcase,
  FolderGit2,
  FileText,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';

import { memoryService } from '../services/memoryService';
import {
  MemorySearchResultItem,
  MemoryStatsResponse,
  CandidateNoteCreate,
} from '../types/memory';

export const MemoryExplorerPage: React.FC = () => {
  const [stats, setStats] = useState<MemoryStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const [topK, setTopK] = useState<number>(5);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<MemorySearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Add Note Modal
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [noteForm, setNoteForm] = useState<{ title: string; content: string; tags: string }>({
    title: '',
    content: '',
    tags: '',
  });
  const [savingNote, setSavingNote] = useState<boolean>(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const data = await memoryService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load memory stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      const res = await memoryService.syncMemory();
      setSyncMessage(`Successfully indexed ${res.chunks_indexed} chunks (${res.profile_chunks} profile, ${res.resume_chunks} resume).`);
      await fetchStats();
    } catch (err: any) {
      setSyncMessage(err.response?.data?.detail || 'Memory synchronization failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setHasSearched(true);
      const docTypes = selectedDocType === 'all' ? undefined : [selectedDocType];
      const res = await memoryService.searchMemory({
        query: searchQuery.trim(),
        doc_types: docTypes,
        top_k: topK,
      });
      setSearchResults(res.results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.title.trim() || !noteForm.content.trim()) return;

    try {
      setSavingNote(true);
      const tagsArray = noteForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload: CandidateNoteCreate = {
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
        tags: tagsArray,
      };

      await memoryService.addNote(payload);
      setNoteForm({ title: '', content: '', tags: '' });
      setShowNoteModal(false);
      await fetchStats();
      if (searchQuery) handleSearch();
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteChunk = async (chunkId: string) => {
    try {
      await memoryService.deleteChunk(chunkId);
      setSearchResults((prev) => prev.filter((r) => r.chunk_id !== chunkId));
      fetchStats();
    } catch (err) {
      console.error('Failed to delete chunk:', err);
    }
  };

  const getDocTypeBadge = (docType: string) => {
    switch (docType) {
      case 'profile_project':
      case 'PROJECTS':
        return {
          label: 'PROJECT',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: FolderGit2,
        };
      case 'profile_experience':
      case 'EXPERIENCE':
        return {
          label: 'EXPERIENCE',
          color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          icon: Briefcase,
        };
      case 'resume':
      case 'RESUME':
        return {
          label: 'RESUME',
          color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          icon: FileText,
        };
      case 'candidate_note':
      case 'NOTES':
        return {
          label: 'NOTE',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: BookOpen,
        };
      default:
        return {
          label: docType.toUpperCase(),
          color: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
          icon: Layers,
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header & Qdrant Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
                <Database className="w-3.5 h-3.5" />
                Qdrant Vector Engine Active
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Semantic Candidate Memory
              </h1>
              <p className="text-slate-400 max-w-2xl text-sm sm:text-base">
                User-isolated vector embeddings power zero-hallucination agent retrieval across your resumes, projects, work experience, and custom study notes.
              </p>
            </div>

            {/* Sync & Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Knowledge'}
              </button>

              <button
                onClick={() => setShowNoteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                Add Learning Note
              </button>
            </div>
          </div>

          {/* Sync Message Notification */}
          {syncMessage && (
            <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{syncMessage}</span>
            </div>
          )}

          {/* Stats Bar */}
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Chunks</p>
              <p className="text-2xl font-bold text-white mt-1">
                {loadingStats ? '...' : stats?.total_chunks || 0}
              </p>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Embedding Model</p>
              <p className="text-sm font-semibold text-indigo-400 mt-2 truncate">
                384-dim (Cosine)
              </p>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Multi-Tenant Isolation</p>
              <p className="text-sm font-semibold text-emerald-400 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
              </p>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Collection</p>
              <p className="text-sm font-semibold text-slate-300 mt-2 font-mono truncate">
                candidate_memory
              </p>
            </div>
          </div>
        </div>

        {/* Semantic Search Playground */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Semantic Search Playground
            </h2>
            <p className="text-slate-400 text-sm">
              Query your personal vector database in natural language to test contextual memory retrieval.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., 'Kafka event streaming distributed architecture' or 'FastAPI JWT auth project'"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-28 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="absolute right-2 top-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Filter Tabs & Top-K Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'All Knowledge' },
                  { id: 'profile_project', label: 'Projects' },
                  { id: 'profile_experience', label: 'Experience' },
                  { id: 'resume', label: 'Resumes' },
                  { id: 'candidate_note', label: 'Notes' },
                  { id: 'skills', label: 'Skills' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedDocType(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      selectedDocType === tab.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Top-K:</span>
                <select
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value={3}>3 Results</option>
                  <option value={5}>5 Results</option>
                  <option value={8}>8 Results</option>
                  <option value={12}>12 Results</option>
                </select>
              </div>
            </div>
          </form>

          {/* Search Results Display */}
          {searching ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
              <p className="text-sm">Calculating cosine distance over high-dimensional vector space...</p>
            </div>
          ) : hasSearched && searchResults.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-xl">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-medium">No vector matches found for your query.</p>
              <p className="text-xs">Try broader keywords or click &quot;Sync Knowledge&quot; to index your latest profile.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((item) => {
                const badge = getDocTypeBadge(item.doc_type);
                const IconComponent = badge.icon;
                const scorePercent = Math.round(item.score * 100);

                return (
                  <div
                    key={item.chunk_id}
                    className="bg-slate-950 border border-slate-800/90 rounded-xl p-5 hover:border-slate-700 transition-all space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}
                        >
                          <IconComponent className="w-3 h-3" />
                          {badge.label}
                        </span>
                        <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {item.title}
                        </h3>
                      </div>

                      {/* Score Gauge */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs">
                          <span className="text-slate-400">Score:</span>
                          <span
                            className={`font-mono font-bold ${
                              scorePercent >= 70
                                ? 'text-emerald-400'
                                : scorePercent >= 40
                                ? 'text-indigo-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {scorePercent}%
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteChunk(item.chunk_id)}
                          title="Delete chunk"
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Content text */}
                    <div className="bg-slate-900/60 rounded-lg p-3.5 border border-slate-800/60 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {item.content}
                    </div>

                    {/* Skills & Metadata footer */}
                    {item.skills && item.skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-500 font-medium">Keywords:</span>
                        {item.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[11px]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Note Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  Add Knowledge / Learning Note
                </h3>
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Note Title
                  </label>
                  <input
                    type="text"
                    required
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    placeholder="e.g., Kafka Architecture & Partitioning Strategies"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Tags (Comma-Separated)
                  </label>
                  <input
                    type="text"
                    value={noteForm.tags}
                    onChange={(e) => setNoteForm({ ...noteForm, tags: e.target.value })}
                    placeholder="Kafka, System Design, Messaging, Python"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Content / Technical Details
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                    placeholder="Key concepts, implementation takeaways, or project architecture details..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowNoteModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingNote || !noteForm.title.trim() || !noteForm.content.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {savingNote ? 'Vectorizing...' : 'Save & Vectorize'}
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
