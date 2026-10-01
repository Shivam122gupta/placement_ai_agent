import React, { useEffect, useState } from 'react';
import { Activity, Trash2, Circle, Terminal, Zap, Flame, Sparkles } from 'lucide-react';
import { wsClient, WSEvent } from '../services/ws';

export const LiveActivity: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = wsClient.subscribe((event: WSEvent) => {
      setLogs((prev) => [
        {
          id: Math.random().toString(),
          type: event.type,
          data: event.data,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    });

    return () => unsubscribe();
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="space-y-6 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#F4F3EE] tracking-tight">Live Event Stream Console</h1>
          <p className="text-xs text-[#A6A49B] mt-1 font-medium">Real-time WebSocket event feed streaming directly from backend broker</p>
        </div>
        <button
          onClick={clearLogs}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-[#1E1E1B] border border-[#33322E] hover:bg-[#252522] text-xs font-bold text-[#DA7756] uppercase tracking-wider transition-colors self-start sm:self-auto"
        >
          <Trash2 className="w-4 h-4 text-[#DA7756]" />
          <span>Clear Console Logs</span>
        </button>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-[#33322E] font-mono bg-[#1E1E1B]">
        <div className="flex items-center justify-between border-b border-[#33322E] pb-4 mb-4">
          <div className="flex items-center space-x-3 text-xs text-[#DA7756] font-bold">
            <Terminal className="w-4 h-4 text-[#DA7756]" />
            <span>ws://localhost:8000/api/v1/admin/ws</span>
          </div>
          <span className="text-xs text-[#DA7756] font-sans font-bold uppercase tracking-wider bg-[#DA7756]/15 px-3 py-1 rounded-full border border-[#DA7756]/30">
            {logs.length} Events Captured
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="py-24 text-center text-xs text-[#A6A49B] space-y-3 font-sans">
            <div className="w-12 h-12 rounded-2xl bg-[#141413] flex items-center justify-center mx-auto text-[#DA7756] border border-[#33322E]">
              <Sparkles className="w-6 h-6 animate-pulse text-[#DA7756]" />
            </div>
            <p className="font-bold text-[#F4F3EE] uppercase tracking-wider">Listening for real-time user logins, signups, and DB triggers...</p>
            <p className="text-[11px] text-[#A6A49B] max-w-sm mx-auto font-medium">
              Interact with the HireXora platform or sign in to see live events stream here instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-[#141413] border border-[#33322E] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#DA7756]/40 transition-all"
              >
                <div className="flex items-center space-x-3.5">
                  <Circle className="w-2.5 h-2.5 fill-current shrink-0 text-[#DA7756] glow-terracotta-pulse" />
                  <span className="font-bold text-[#F4F3EE] uppercase tracking-wider font-mono">{log.type}</span>
                  <span className="text-[#A6A49B] font-sans font-medium">{log.data?.email || JSON.stringify(log.data)}</span>
                </div>
                <span className="text-[10px] text-[#DA7756] font-sans font-bold px-2.5 py-1 rounded-lg bg-[#DA7756]/15 border border-[#DA7756]/30 self-end sm:self-auto font-mono">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
