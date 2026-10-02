import React, { useEffect, useState } from 'react';
import { Users, UserCheck, FileText, Video, Cpu, Server, Activity, RefreshCw, CheckCircle2, Sparkles, Key } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { adminFetch } from '../services/api';
import { wsClient, WSEvent } from '../services/ws';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  const fetchStats = async () => {
    try {
      const data = await adminFetch('/admin/stats');
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const unsubscribe = wsClient.subscribe((event: WSEvent) => {
      setRecentEvents((prev) => [
        {
          id: Math.random().toString(),
          type: event.type,
          data: event.data,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 12),
      ]);

      if (['USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTERED', 'USER_DELETED'].includes(event.type)) {
        fetchStats();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-5 sm:space-y-6 select-none font-sans text-white">
      {/* Top Banner */}
      <div className="bg-[#182230] p-5 sm:p-6 md:p-8 rounded-sm border border-[#2a3649] shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-sm bg-[#00ea64]/15 border border-[#00ea64]/30 text-[#00ea64] font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2.5">
              <Key className="w-3.5 h-3.5 text-[#00ea64] shrink-0" />
              <span>HIREXORA CONTROL CENTER</span>
              <span className="bg-[#00ea64] text-[#0e141e] px-1.5 py-0.5 rounded-sm text-[10px] font-extrabold ml-1.5">LIVE</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-mono font-extrabold text-white tracking-tight uppercase leading-tight">
              System Overview & Operations
            </h1>
            <p className="text-xs font-mono text-[#94a3b8] mt-1.5 sm:mt-2 max-w-2xl leading-relaxed">
              Track live user sessions, document indexes, vector search health, and trigger database maintenance tools.
            </p>
          </div>

          <button
            onClick={fetchStats}
            className="w-full lg:w-auto flex items-center justify-center space-x-2 px-5 py-3 rounded-sm bg-[#00ea64] hover:bg-[#00c854] text-[#0e141e] font-mono font-extrabold text-xs uppercase tracking-wider transition-all border border-[#00ea64] shadow-md shadow-[#00ea64]/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0e141e] ${loading ? 'animate-spin' : ''}`} />
            <span>SYNC REAL-TIME DATA</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatsCard
          title="Registered Accounts"
          value={stats?.total_users ?? '—'}
          subtitle={`${stats?.verified_users ?? 0} verified user accounts`}
          icon={Users}
          badgeText="Users"
        />

        <StatsCard
          title="Users Online Now"
          value={stats?.online_users ?? '—'}
          subtitle={`${stats?.offline_users ?? 0} currently offline`}
          icon={UserCheck}
          badgeText="Active Stream"
        />

        <StatsCard
          title="Resumes Uploaded"
          value={stats?.total_resumes ?? '—'}
          subtitle="Parsed PDF & DOCX candidate files"
          icon={FileText}
          badgeText="Documents"
        />

        <StatsCard
          title="AI Mock Interviews"
          value={stats?.total_interviews ?? '—'}
          subtitle="LLM evaluations completed"
          icon={Video}
          badgeText="AI Sessions"
        />
      </div>

      {/* Infrastructure Health & Live Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* System Health */}
        <div className="lg:col-span-2 bg-[#182230] p-5 sm:p-6 md:p-8 rounded-sm border border-[#2a3649] shadow-md space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2a3649] pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-sm bg-[#00ea64]/15 border border-[#00ea64]/30 text-[#00ea64] flex items-center justify-center font-mono font-bold shrink-0">
                <Server className="w-4 h-4 text-[#00ea64]" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-white text-sm sm:text-base uppercase">System Infrastructure Health</h3>
                <p className="text-[11px] sm:text-xs font-mono text-[#94a3b8]">Core API services, vector storage & cache node status</p>
              </div>
            </div>

            <div className="inline-flex items-center space-x-1.5 bg-[#00ea64]/15 text-[#00ea64] border border-[#00ea64]/30 px-3 py-1 rounded-sm font-mono text-xs font-bold uppercase self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00ea64]" />
              <span>SYSTEMS NORMAL</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#131b26] p-4 rounded-sm border border-[#2a3649] space-y-2 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#94a3b8] font-bold uppercase">Database</span>
                <span className="w-2 h-2 rounded-full bg-[#00ea64] animate-pulse" />
              </div>
              <p className="text-base sm:text-lg font-bold text-white">MongoDB Async</p>
              <p className="text-[10px] text-[#94a3b8]">Beanie Document ODM</p>
              <div className="w-full bg-[#2a3649] h-1.5 rounded-none overflow-hidden">
                <div className="bg-[#00ea64] h-full w-full" />
              </div>
            </div>

            <div className="bg-[#131b26] p-4 rounded-sm border border-[#2a3649] space-y-2 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#94a3b8] font-bold uppercase">Vector Store</span>
                <span className="w-2 h-2 rounded-full bg-[#00ea64] animate-pulse" />
              </div>
              <p className="text-base sm:text-lg font-bold text-white">Qdrant Cloud</p>
              <p className="text-[10px] text-[#94a3b8]">384-dim Embeddings</p>
              <div className="w-full bg-[#2a3649] h-1.5 rounded-none overflow-hidden">
                <div className="bg-[#00ea64] h-full w-full" />
              </div>
            </div>

            <div className="bg-[#131b26] p-4 rounded-sm border border-[#2a3649] space-y-2 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#94a3b8] font-bold uppercase">Event Broker</span>
                <span className="w-2 h-2 rounded-full bg-[#00ea64] animate-pulse" />
              </div>
              <p className="text-base sm:text-lg font-bold text-white">Redis & WS</p>
              <p className="text-[10px] text-[#94a3b8]">FastAPI Real-Time</p>
              <div className="w-full bg-[#2a3649] h-1.5 rounded-none overflow-hidden">
                <div className="bg-[#00ea64] h-full w-full" />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#2a3649] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] sm:text-xs font-mono text-[#94a3b8]">
            <span className="flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#00ea64]" />
              <span>Agent Execution Traces: <strong className="text-white font-bold">{stats?.total_agent_traces ?? 0}</strong></span>
            </span>
            <span>Server UTC: <strong className="text-white font-bold">{stats?.system_time ? new Date(stats.system_time).toLocaleTimeString() : '—'}</strong></span>
          </div>
        </div>

        {/* Live Ticker Feed Sidebar */}
        <div className="bg-[#182230] p-5 sm:p-6 md:p-8 rounded-sm border border-[#2a3649] shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#2a3649] pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#00ea64]" />
                <h3 className="font-mono font-bold text-white text-sm uppercase">Live Event Stream</h3>
              </div>
              <span className="w-2 h-2 bg-[#00ea64] rounded-sm animate-pulse" />
            </div>

            {recentEvents.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-[#94a3b8] space-y-2">
                <div className="w-10 h-10 rounded-sm bg-[#00ea64]/15 border border-[#00ea64]/30 text-[#00ea64] flex items-center justify-center mx-auto font-bold">
                  <Sparkles className="w-5 h-5 text-[#00ea64] animate-pulse" />
                </div>
                <p className="font-bold text-white uppercase">Listening for real-time user activity...</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {recentEvents.map((evt) => (
                  <div key={evt.id} className="p-3 bg-[#131b26] rounded-sm border border-[#2a3649] text-xs font-mono flex items-start justify-between">
                    <div>
                      <span className="font-bold text-white block uppercase text-[10px]">{evt.type}</span>
                      <p className="text-[#94a3b8] truncate max-w-[150px]">{evt.data?.email || JSON.stringify(evt.data)}</p>
                    </div>
                    <span className="text-[9px] font-bold text-[#00ea64] bg-[#00ea64]/15 border border-[#00ea64]/30 px-1.5 py-0.5 rounded-sm">{evt.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[10px] font-mono text-[#94a3b8] text-center mt-4 font-bold uppercase tracking-wider">HIREXORA REAL-TIME STREAM ENGINE</p>
        </div>
      </div>
    </div>
  );
};
