import React, { useState } from 'react';
import { Database, Trash2, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
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
    <div className="space-y-6 max-w-5xl select-none font-sans text-white">
      <div>
        <h1 className="text-2xl font-mono font-extrabold text-white tracking-tight uppercase">Database Maintenance & Cleanup</h1>
        <p className="text-xs font-mono text-[#94a3b8] mt-1">Purge temporary debug traces, clear test interviews, and perform collection maintenance</p>
      </div>

      {/* Warning Card */}
      <div className="p-4 rounded-sm bg-[#182230] border border-[#2a3649] text-white flex items-start space-x-3 font-mono">
        <AlertTriangle className="w-5 h-5 shrink-0 text-[#00ea64] mt-0.5" />
        <div>
          <h4 className="font-bold text-[#00ea64] text-xs uppercase tracking-wider">High Privilege Action Guard</h4>
          <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
            Database cleanup actions permanently delete records from your MongoDB database. Re-entering your password is required to verify identity.
          </p>
        </div>
      </div>

      <div className="bg-[#182230] p-6 md:p-8 rounded-sm border border-[#2a3649] shadow-md space-y-6 font-mono">
        <div className="flex items-center space-x-3 border-b border-[#2a3649] pb-4">
          <div className="w-9 h-9 rounded-sm bg-[#00ea64]/15 border border-[#00ea64]/30 text-[#00ea64] flex items-center justify-center font-bold">
            <Database className="w-4 h-4 text-[#00ea64]" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base uppercase">Select Maintenance Task</h3>
            <p className="text-xs text-[#94a3b8]">Choose between custom target collections or complete test data wipe</p>
          </div>
        </div>

        <form onSubmit={handleExecuteCleanup} className="space-y-6">
          {/* Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setCleanupType('selective')}
              className={`p-4 rounded-sm border cursor-pointer transition-all ${
                cleanupType === 'selective'
                  ? 'bg-[#131b26] text-[#00ea64] border-[#00ea64] shadow-md'
                  : 'bg-[#131b26] border-[#2a3649] text-[#94a3b8] hover:border-[#00ea64]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider">Selective Collection Purge</span>
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${cleanupType === 'selective' ? 'border-[#00ea64] bg-[#00ea64]' : 'border-zinc-500'}`}>
                  {cleanupType === 'selective' && <div className="w-1.5 h-1.5 bg-[#0e141e] rounded-full" />}
                </span>
              </div>
              <p className={`text-[11px] mt-2 leading-relaxed ${cleanupType === 'selective' ? 'text-zinc-300' : 'text-[#94a3b8]'}`}>
                Select specific target collections to wipe (traces, unverified accounts, logs).
              </p>
            </div>

            <div
              onClick={() => setCleanupType('full_test_reset')}
              className={`p-4 rounded-sm border cursor-pointer transition-all ${
                cleanupType === 'full_test_reset'
                  ? 'bg-[#131b26] text-[#00ea64] border-[#00ea64] shadow-md'
                  : 'bg-[#131b26] border-[#2a3649] text-[#94a3b8] hover:border-[#00ea64]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider">Full Test Data Wipe</span>
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${cleanupType === 'full_test_reset' ? 'border-[#00ea64] bg-[#00ea64]' : 'border-zinc-500'}`}>
                  {cleanupType === 'full_test_reset' && <div className="w-1.5 h-1.5 bg-[#0e141e] rounded-full" />}
                </span>
              </div>
              <p className={`text-[11px] mt-2 leading-relaxed ${cleanupType === 'full_test_reset' ? 'text-zinc-300' : 'text-[#94a3b8]'}`}>
                Clear all test interviews, agent traces, and system notifications in 1 click.
              </p>
            </div>
          </div>

          {/* Selective Options */}
          {cleanupType === 'selective' && (
            <div className="space-y-3 bg-[#131b26] p-4 rounded-sm border border-[#2a3649]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00ea64] block mb-2 font-mono">
                Target Database Collections
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                {[
                  { key: 'traces', label: 'Agent Debug Traces (agent_tool_calls)' },
                  { key: 'notifications', label: 'System Notifications (notifications)' },
                  { key: 'interviews', label: 'Mock Interview Sessions (mock_interviews)' },
                  { key: 'unverified_users', label: 'Unverified Test Accounts (users)' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center space-x-2.5 text-zinc-300 cursor-pointer p-2 rounded-sm hover:bg-[#182230] transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(item.key)}
                      onChange={() => toggleCollection(item.key)}
                      className="rounded-sm bg-[#0e141e] border-[#2a3649] text-[#00ea64] focus:ring-[#00ea64] w-4 h-4"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Password Input */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-white font-mono">
              Re-enter Admin Password for Verification
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-[#131b26] border-2 border-[#2a3649] p-3 pr-10 text-xs text-white placeholder-[#94a3b8]/50 focus:outline-none focus:border-[#00ea64] rounded-sm font-mono"
              />
              <Lock className="w-4 h-4 text-[#94a3b8] absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-[#131b26] border border-red-500 text-red-300 text-xs font-bold font-mono">
              {error}
            </div>
          )}

          {result && (
            <div className="p-4 bg-[#131b26] text-[#00ea64] border border-[#00ea64] space-y-2 text-xs font-mono">
              <div className="flex items-center space-x-2 font-bold text-sm uppercase">
                <CheckCircle2 className="w-4 h-4 text-[#00ea64]" />
                <span>Database Cleanup Executed Successfully!</span>
              </div>
              <pre className="bg-[#0e141e] p-3 rounded-sm text-white font-mono text-xs border border-[#2a3649] overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-sm bg-[#00ea64] hover:bg-[#00c854] text-[#0e141e] font-mono font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 border border-[#00ea64] disabled:opacity-50 shadow-md shadow-[#00ea64]/20"
          >
            {loading ? (
              <span>Executing Database Wipe...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4 text-[#0e141e]" />
                <span>Execute One-Click Cleanup</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
