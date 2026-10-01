import React, { useEffect, useState } from 'react';
import { Users, UserCheck, FileText, Video, Cpu, Server, Activity, RefreshCw, Shield, Zap, CheckCircle2, Sparkles } from 'lucide-react';
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
    <div className="space-y-8 select-none">
      {/* Claude Theme Hero Banner */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-r from-[#282723] via-[#1E1E1B] to-[#252420] border border-[#DA7756]/30 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DA7756]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#DA7756]/15 border border-[#DA7756]/30 text-[#DA7756] text-xs font-bold uppercase tracking-wider mb-3 font-mono">
              <Sparkles className="w-4 h-4 text-[#DA7756]" />
              <span>HireXora Control Center</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-serif font-bold text-[#F4F3EE] tracking-tight">
              System Overview & Operations
            </h1>
            <p className="text-sm text-[#A6A49B] mt-2 max-w-2xl font-medium leading-relaxed">
              Track live user sessions, document indexes, vector search health, and trigger database maintenance tools.
            </p>
          </div>

          <button
            onClick={fetchStats}
            className="flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#DA7756] to-[#C86443] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#DA7756]/30 hover:shadow-[#DA7756]/50 hover:scale-105 transition-all self-start lg:self-auto border border-[#E88A6A]/40"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Real-Time Data</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Registered Users"
          value={stats?.total_users ?? '—'}
          subtitle={`${stats?.verified_users ?? 0} verified accounts`}
          icon={Users}
          badgeText="Platform Users"
        />

        <StatsCard
          title="Users Online Now"
          value={stats?.online_users ?? '—'}
          subtitle={`${stats?.offline_users ?? 0} currently offline`}
          icon={UserCheck}
          badgeText="Live Stream"
        />

        <StatsCard
          title="Resumes Uploaded"
          value={stats?.total_resumes ?? '—'}
          subtitle="Parsed candidate files"
          icon={FileText}
          badgeText="Documents"
        />

        <StatsCard
          title="AI Mock Interviews"
          value={stats?.total_interviews ?? '—'}
          subtitle="Evaluations completed"
          icon={Video}
          badgeText="AI Sessions"
        />
      </div>

      {/* Infrastructure Health & Live Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Health */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-3xl border border-[#33322E] space-y-6 bg-[#1E1E1B]">
          <div className="flex items-center justify-between border-b border-[#33322E] pb-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#DA7756]/15 border border-[#DA7756]/30 flex items-center justify-center text-[#DA7756]">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-[#F4F3EE] text-lg">System Infrastructure Health</h3>
                <p className="text-xs text-[#A6A49B] font-medium">Core API services, vector storage & cache node status</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-[#DA7756]/15 text-[#DA7756] border border-[#DA7756]/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-[#DA7756]" />
              <span>Systems Normal</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="glass-card p-5 rounded-2xl space-y-3 bg-[#181816]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#A6A49B] font-bold uppercase tracking-wider font-mono">Database</span>
                <span className="w-2 h-2 rounded-full bg-[#DA7756] animate-pulse" />
              </div>
              <p className="text-xl font-bold text-[#F4F3EE]">MongoDB Async</p>
              <p className="text-[11px] text-[#A6A49B] font-medium">Beanie Document ODM</p>
              <div className="w-full bg-[#2A2925] h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#DA7756] to-[#C86443] h-full w-full" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-3 bg-[#181816]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#A6A49B] font-bold uppercase tracking-wider font-mono">Vector Store</span>
                <span className="w-2 h-2 rounded-full bg-[#DA7756] animate-pulse" />
              </div>
              <p className="text-xl font-bold text-[#F4F3EE]">Qdrant Cloud</p>
              <p className="text-[11px] text-[#A6A49B] font-medium">384-dim Embeddings</p>
              <div className="w-full bg-[#2A2925] h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#DA7756] to-[#C86443] h-full w-full" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-3 bg-[#181816]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#A6A49B] font-bold uppercase tracking-wider font-mono">Event Broker</span>
                <span className="w-2 h-2 rounded-full bg-[#DA7756] animate-pulse" />
              </div>
              <p className="text-xl font-bold text-[#F4F3EE]">Redis & WS</p>
              <p className="text-[11px] text-[#A6A49B] font-medium">FastAPI Real-Time</p>
              <div className="w-full bg-[#2A2925] h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#DA7756] to-[#C86443] h-full w-full" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#33322E] flex items-center justify-between text-xs text-[#A6A49B] font-medium">
            <span className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-[#DA7756]" />
              <span>Agent Execution Traces: <strong className="text-[#F4F3EE] font-bold">{stats?.total_agent_traces ?? 0}</strong></span>
            </span>
            <span>Server UTC Time: <strong className="text-[#F4F3EE] font-bold">{stats?.system_time ? new Date(stats.system_time).toLocaleTimeString() : '—'}</strong></span>
          </div>
        </div>

        {/* Live Ticker Feed Sidebar */}
        <div className="glass-panel p-8 rounded-3xl border border-[#33322E] flex flex-col justify-between bg-[#1E1E1B]">
          <div>
            <div className="flex items-center justify-between border-b border-[#33322E] pb-4 mb-4">
              <div className="flex items-center space-x-2.5">
                <Activity className="w-5 h-5 text-[#DA7756]" />
                <h3 className="font-serif font-bold text-[#F4F3EE] text-base">Live Event Stream</h3>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#DA7756] animate-pulse" />
            </div>

            {recentEvents.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#A6A49B] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#181816] flex items-center justify-center mx-auto text-[#DA7756] border border-[#33322E]">
                  <Zap className="w-6 h-6 animate-pulse" />
                </div>
                <p className="font-bold text-[#ECEAE2]">Listening for live user logins and system events...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {recentEvents.map((evt) => (
                  <div key={evt.id} className="glass-card p-3.5 rounded-2xl border border-[#33322E] text-xs flex items-start justify-between bg-[#181816]">
                    <div>
                      <span className="font-bold text-[#F4F3EE] block uppercase tracking-wider text-[11px] font-mono">{evt.type}</span>
                      <p className="text-[#A6A49B] mt-0.5 truncate max-w-[170px] font-medium">{evt.data?.email || JSON.stringify(evt.data)}</p>
                    </div>
                    <span className="text-[10px] text-[#DA7756] font-bold px-2 py-0.5 rounded-full bg-[#DA7756]/15 border border-[#DA7756]/30">{evt.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-[#787770] text-center mt-4 font-bold uppercase tracking-wider font-mono">HireXora Real-Time Engine</p>
        </div>
      </div>
    </div>
  );
};
