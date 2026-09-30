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
import { SEO } from '../components/common/SEO';
import {
  MemorySearchResultItem,
  MemoryStatsResponse,
  CandidateNoteCreate,
} from '../types/memory';

export const MemoryExplorerPage: React.FC = () => {
  const [stats, setStats] = useState<MemoryStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'success' | 'error' | null>(null);
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
      setSyncStatus(null);
      const res = await memoryService.syncMemory();
      setSyncStatus('success');
      setSyncMessage(`Successfully indexed ${res.chunks_indexed} knowledge chunks (${res.profile_chunks} profile items, ${res.resume_chunks} resume sections).`);
      await fetchStats();
    } catch (err: any) {
      setSyncStatus('error');
      setSyncMessage(err.response?.data?.detail || 'Memory synchronization failed. Please ensure a resume or profile is available.');
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
          color: 'bg-[#FAF8F5]/15 text-[#FAF8F5] border-[#FAF8F5]/30',
          icon: FolderGit2,
        };
      case 'profile_experience':
      case 'EXPERIENCE':
        return {
          label: 'EXPERIENCE',
          color: 'bg-[#FAF8F5]/15 text-[#E8E2D6] border-[#FAF8F5]/30',
          icon: Briefcase,
        };
      case 'resume':
      case 'RESUME':
        return {
          label: 'RESUME',
          color: 'bg-[#FAF8F5]/15 text-[#FAF8F5] border-[#FAF8F5]/30',
          icon: FileText,
        };
      case 'candidate_note':
      case 'NOTES':
        return {
          label: 'NOTE',
          color: 'bg-[#FAF8F5]/15 text-[#FAF8F5] border-[#FAF8F5]/30',
          icon: BookOpen,
        };
      default:
        return {
          label: docType.toUpperCase(),
          color: 'bg-[#FAF8F5]/10 text-neutral-300 border-[#FAF8F5]/20',
          icon: Layers,
        };
    }
  };

  return (
    <div className="space-y-8 pb-16 text-[#FAF8F5]">
      <SEO
        title="Semantic Memory Explorer — Hirxora"
        description="Inspect your Qdrant vector memory embeddings, knowledge chunks, and candidate context used by the AI copilot."
      />
      {/* Header & Qdrant Status */}
      <div className="bg-[#121214] border border-[#FAF8F5]/20 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F5]/10 border border-[#FAF8F5]/25 text-[#FAF8F5] text-xs font-mono tracking-wide uppercase">
              <span className="p-1 rounded bg-[#FAF8F5]/20">
                <Database className="w-3.5 h-3.5 text-[#FAF8F5]" />
              </span>
              Qdrant Cloud Vector Engine Active
            </div>
            <h1 className="text-2xl md:text-4xl font-normal tracking-tight text-white font-serif">
              Semantic Candidate Memory
            </h1>
            <p className="text-neutral-400 max-w-2xl text-xs md:text-sm leading-relaxed font-sans">
              User-isolated vector embeddings power zero-hallucination agent retrieval across your resumes, projects, work experience, and custom study notes.
            </p>
          </div>

          {/* Sync & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white font-semibold text-xs transition-all shadow-md shadow-[#FF6B6B]/25 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Knowledge'}
            </button>

            <button
              onClick={() => setShowNoteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 text-[#FFA07A] border border-[#FF6B6B]/25 font-medium text-xs transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#FFA07A]" />
              Add Learning Note
            </button>
          </div>
        </div>

        {/* Sync Message Notification */}
        {syncMessage && (
          <div
            className={`mt-4 p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs transition-all relative z-10 ${
              syncStatus === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-[#FAF8F5]/10 border-[#FAF8F5]/30 text-[#FAF8F5] shadow-md'
            }`}
          >
            {syncStatus === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#FAF8F5] flex-shrink-0" />
            )}
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Stats Bar */}
        <div className="mt-6 pt-6 border-t border-[#FAF8F5]/10 grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
          <div className="bg-[#18181B]/80 p-4 rounded-2xl border border-[#FAF8F5]/15">
            <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Total Chunks</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">
              {loadingStats ? '...' : stats?.total_chunks || 0}
            </p>
          </div>
          <div className="bg-[#18181B]/80 p-4 rounded-2xl border border-[#FAF8F5]/15">
            <p className="text-[11px] font-mono text-[#FAF8F5]/70 uppercase tracking-wider">Vector Space</p>
            <p className="text-xs font-mono font-semibold text-[#FAF8F5] mt-2 truncate">
              384-dim Cosine
            </p>
          </div>
          <div className="bg-[#18181B]/80 p-4 rounded-2xl border border-[#FAF8F5]/15">
            <p className="text-[11px] font-mono text-[#FAF8F5]/70 uppercase tracking-wider">Multi-Tenant Isolation</p>
            <p className="text-xs font-mono font-semibold text-white mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Enforced
            </p>
          </div>
          <div className="bg-[#18181B]/80 p-4 rounded-2xl border border-[#FAF8F5]/15">
            <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Collection</p>
            <p className="text-xs font-mono text-neutral-300 mt-2 truncate">
              candidate_memory
            </p>
          </div>
        </div>
      </div>

      {/* Semantic Search Playground */}
      <div className="bg-[#121214] border border-[#FAF8F5]/20 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-serif font-medium text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FAF8F5]" />
            Semantic Search Explorer
          </h2>
          <p className="text-neutral-400 text-xs font-sans">
            Query your personal vector database in natural language to inspect contextual memory retrieval.
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., 'Kafka event streaming distributed architecture' or 'FastAPI JWT auth project'"
              className="w-full bg-[#18181B] border border-[#FAF8F5]/20 rounded-2xl pl-11 pr-28 py-3 text-xs md:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#FAF8F5] transition-all font-sans"
            />
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="absolute right-2 top-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white font-semibold text-xs transition-all shadow-md shadow-[#FF6B6B]/25 disabled:opacity-40 cursor-pointer active:scale-95"
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    selectedDocType === tab.id
                      ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] text-white font-semibold border-transparent shadow-md shadow-[#FF6B6B]/25'
                      : 'bg-[#18181B] border-[#FAF8F5]/15 text-neutral-400 hover:border-[#FAF8F5]/40 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#FAF8F5]/70">Top-K:</span>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="bg-[#18181B] border border-[#FAF8F5]/20 rounded-xl px-2.5 py-1 text-xs text-neutral-300 focus:outline-none focus:border-[#FAF8F5] cursor-pointer"
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
          <div className="py-12 text-center text-[#FAF8F5] space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FAF8F5]" />
            <p className="text-xs font-mono">Calculating cosine similarity across 384-d vector space...</p>
          </div>
        ) : hasSearched && searchResults.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 space-y-2 border border-dashed border-[#FAF8F5]/20 rounded-2xl bg-[#18181B]/30">
            <AlertCircle className="w-8 h-8 mx-auto text-[#FAF8F5]/40" />
            <p className="text-xs font-medium text-neutral-300">No vector matches found for your query.</p>
            <p className="text-[11px] text-neutral-500">Try broader keywords or click &quot;Sync Knowledge&quot; to index your latest profile.</p>
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
                  className="bg-[#18181B] border border-[#FAF8F5]/20 rounded-2xl p-5 hover:border-[#FAF8F5]/50 transition-all space-y-3 group hover:shadow-lg hover:shadow-white/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${badge.color}`}
                      >
                        <IconComponent className="w-3 h-3" />
                        {badge.label}
                      </span>
                      <h3 className="text-xs md:text-sm font-semibold text-white group-hover:text-[#FAF8F5] transition-colors">
                        {item.title}
                      </h3>
                    </div>

                    {/* Score Gauge */}
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF8F5]/10 border border-[#FAF8F5]/25 text-xs">
                        <span className="text-[10px] font-mono text-[#FAF8F5]/70">Score:</span>
                        <span className="font-mono font-bold text-[#FAF8F5]">
                          {scorePercent}%
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteChunk(item.chunk_id)}
                        title="Delete chunk"
                        className="p-1 text-neutral-500 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content text */}
                  <div className="bg-[#121214] rounded-xl p-3.5 border border-[#FAF8F5]/15 font-mono text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
                    {item.content}
                  </div>

                  {/* Skills & Metadata footer */}
                  {item.skills && item.skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-mono text-[#FAF8F5]/70 font-medium">Keywords:</span>
                      {item.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-[#FAF8F5]/10 text-[#FAF8F5] border border-[#FAF8F5]/20 text-[10px] font-mono"
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#FAF8F5]/30 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#FAF8F5]/20 pb-4">
              <h3 className="text-sm md:text-base font-serif font-medium text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#FAF8F5]" />
                Add Knowledge / Learning Note
              </h3>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer p-1 rounded-lg hover:bg-white/[0.05] transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-semibold text-[#FAF8F5]/70 uppercase mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  required
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  placeholder="e.g., Kafka Architecture & Partitioning Strategies"
                  className="w-full bg-[#18181B] border border-[#FAF8F5]/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold text-[#FAF8F5]/70 uppercase mb-1">
                  Tags (Comma-Separated)
                </label>
                <input
                  type="text"
                  value={noteForm.tags}
                  onChange={(e) => setNoteForm({ ...noteForm, tags: e.target.value })}
                  placeholder="Kafka, System Design, Messaging, Python"
                  className="w-full bg-[#18181B] border border-[#FAF8F5]/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold text-[#FAF8F5]/70 uppercase mb-1">
                  Content / Technical Details
                </label>
                <textarea
                  required
                  rows={4}
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  placeholder="Key concepts, implementation takeaways, or project architecture details..."
                  className="w-full bg-[#18181B] border border-[#FAF8F5]/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#FAF8F5] font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#FAF8F5]/20">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNote || !noteForm.title.trim() || !noteForm.content.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white text-xs font-semibold transition-all shadow-md shadow-[#FF6B6B]/25 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {savingNote ? 'Vectorizing...' : 'Save & Vectorize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
