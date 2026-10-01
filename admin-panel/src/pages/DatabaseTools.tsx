import React, { useState } from 'react';
import { Database, Trash2, AlertTriangle, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { adminFetch } from '../services/api';

export const DatabaseTools: React.FC = () => {
  const [cleanupType, setCleanupType] = useState<'selective' | 'full_test_reset'>('selective');
  const [selectedCollections, setSelectedCollections] = useState<string[]>(['traces']);
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleCollection = (name: string) => {
    setSelectedCollections((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const handleExecuteCleanup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) {
      alert('Please enter your admin password to confirm');
      return;
    }

    const confirmMsg =
      cleanupType === 'full_test_reset'
        ? '⚠️ WARNING: You are about to purge ALL test interviews, traces, and notifications! Proceed?'
        : 'Confirm selective collection cleanup?';

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await adminFetch('/admin/db/cleanup', {
        method: 'POST',
        body: JSON.stringify({
          cleanup_type: cleanupType,
          target_collections: selectedCollections,
          admin_password_confirm: adminPassword,
        }),
      });

      setResult(data.data?.summary || {});
      setAdminPassword('');
    } catch (err: any) {
      setError(err.message || 'Cleanup operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl select-none">
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#F4F3EE] tracking-tight">Database Maintenance & Cleanup</h1>
        <p className="text-xs text-[#A6A49B] mt-1 font-medium">Purge temporary debug traces, clear test interviews, and perform collection maintenance</p>
      </div>

      {/* Warning Card */}
      <div className="p-5 rounded-3xl bg-[#DA7756]/10 border border-[#DA7756]/30 text-[#F4F3EE] flex items-start space-x-4">
        <AlertTriangle className="w-6 h-6 shrink-0 text-[#DA7756] mt-0.5" />
        <div>
          <h4 className="font-bold text-[#F4F3EE] text-sm uppercase tracking-wider font-mono">High Privilege Action Guard</h4>
          <p className="text-xs text-[#A6A49B] mt-1 leading-relaxed font-medium">
            Database cleanup actions permanently delete records from your MongoDB database. Re-entering your password is required to verify identity.
          </p>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-[#33322E] space-y-6 bg-[#1E1E1B]">
        <div className="flex items-center space-x-3 border-b border-[#33322E] pb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#DA7756]/15 border border-[#DA7756]/30 flex items-center justify-center text-[#DA7756]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-[#F4F3EE] text-lg">Select Maintenance Task</h3>
            <p className="text-xs text-[#A6A49B] font-medium">Choose between custom target collections or complete test data wipe</p>
          </div>
        </div>

        <form onSubmit={handleExecuteCleanup} className="space-y-6">
          {/* Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div
              onClick={() => setCleanupType('selective')}
              className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                cleanupType === 'selective'
                  ? 'bg-[#DA7756]/15 border-[#DA7756] text-[#F4F3EE] shadow-lg shadow-[#DA7756]/10'
                  : 'bg-[#141413] border-[#33322E] text-[#A6A49B] hover:border-[#DA7756]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#F4F3EE] uppercase tracking-wider font-mono">Selective Collection Purge</span>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${cleanupType === 'selective' ? 'border-[#DA7756] bg-[#DA7756]' : 'border-[#33322E]'}`}>
                  {cleanupType === 'selective' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </span>
              </div>
              <p className="text-xs text-[#A6A49B] mt-2 leading-relaxed font-medium">Select specific target collections to wipe (traces, unverified accounts, logs).</p>
            </div>

            <div
              onClick={() => setCleanupType('full_test_reset')}
              className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                cleanupType === 'full_test_reset'
                  ? 'bg-[#DA7756]/15 border-[#DA7756] text-[#F4F3EE] shadow-lg shadow-[#DA7756]/10'
                  : 'bg-[#141413] border-[#33322E] text-[#A6A49B] hover:border-[#DA7756]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#DA7756] uppercase tracking-wider font-mono">Full Test Data Wipe</span>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${cleanupType === 'full_test_reset' ? 'border-[#DA7756] bg-[#DA7756]' : 'border-[#33322E]'}`}>
                  {cleanupType === 'full_test_reset' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </span>
              </div>
              <p className="text-xs text-[#A6A49B] mt-2 leading-relaxed font-medium">Clear all test interviews, agent traces, and system notifications in 1 click.</p>
            </div>
          </div>

          {/* Selective Options */}
          {cleanupType === 'selective' && (
            <div className="space-y-3 bg-[#141413] p-5 rounded-2xl border border-[#33322E]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#DA7756] block mb-3 font-mono">
                Target Database Collections
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
                {[
                  { key: 'traces', label: 'Agent Debug Traces (agent_tool_calls)' },
                  { key: 'notifications', label: 'System Notifications (notifications)' },
                  { key: 'interviews', label: 'Mock Interview Sessions (mock_interviews)' },
                  { key: 'unverified_users', label: 'Unverified Test Accounts (users)' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center space-x-3 text-[#ECEAE2] cursor-pointer p-2 rounded-xl hover:bg-[#252522] transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(item.key)}
                      onChange={() => toggleCollection(item.key)}
                      className="rounded bg-[#181816] border-[#33322E] text-[#DA7756] focus:ring-[#DA7756] w-4 h-4"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Password Input */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#A6A49B] font-mono">
              Re-enter Admin Password for Verification
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A6A49B] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-[#141413] border border-[#33322E] rounded-2xl py-3 pl-11 pr-4 text-xs text-[#F4F3EE] placeholder-[#787770] focus:outline-none focus:border-[#DA7756] font-medium"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
              {error}
            </div>
          )}

          {result && (
            <div className="p-5 rounded-2xl bg-[#DA7756]/15 border border-[#DA7756]/30 text-[#F4F3EE] space-y-3 text-xs">
              <div className="flex items-center space-x-2 font-bold text-sm text-[#DA7756] uppercase tracking-wider font-mono">
                <CheckCircle2 className="w-5 h-5 text-[#DA7756]" />
                <span>Database Cleanup Executed Successfully!</span>
              </div>
              <pre className="bg-[#141413] p-3 rounded-xl text-[#ECEAE2] font-mono text-xs overflow-x-auto border border-[#33322E]">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#DA7756] to-[#C86443] text-white font-bold shadow-lg shadow-[#DA7756]/30 hover:from-[#E28A6D] hover:to-[#DA7756] transition-all flex items-center justify-center space-x-2.5 text-xs uppercase tracking-wider disabled:opacity-50 border border-[#E88A6A]/40"
          >
            {loading ? (
              <span>Executing Database Wipe...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Execute One-Click Cleanup</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
