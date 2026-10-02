import React, { useEffect, useState } from 'react';
import { Trash2, Circle, Terminal, Sparkles } from 'lucide-react';
import { wsClient, WSEvent } from '../services/ws';

export const LiveActivity: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const wsDisplayUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v1/admin/ws';

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
    <div className="space-y-6 select-none font-sans text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-extrabold text-white tracking-tight uppercase">Live Event Stream Console</h1>
          <p className="text-xs font-mono text-[#94a3b8] mt-1">Real-time WebSocket event feed streaming directly from backend broker</p>
        </div>
        <button
          onClick={clearLogs}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-sm bg-[#00ea64] hover:bg-[#00c854] text-[#0e141e] text-xs font-mono font-extrabold uppercase tracking-wider transition-colors border border-[#00ea64] self-start sm:self-auto shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5 text-[#0e141e]" />
          <span>Clear Console Logs</span>
        </button>
      </div>

      <div className="bg-[#182230] p-6 rounded-sm border border-[#2a3649] shadow-md font-mono">
        <div className="flex items-center justify-between border-b border-[#2a3649] pb-3 mb-4">
          <div className="flex items-center space-x-2 text-xs text-[#00ea64] font-bold">
            <Terminal className="w-4 h-4 text-[#00ea64]" />
            <span>{wsDisplayUrl}</span>
          </div>
          <span className="text-[11px] text-[#00ea64] font-bold uppercase bg-[#00ea64]/15 px-2.5 py-1 rounded-sm border border-[#00ea64]/30">
            {logs.length} EVENTS CAPTURED
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#94a3b8] space-y-2 font-mono">
            <div className="w-10 h-10 rounded-sm bg-[#00ea64]/15 border border-[#00ea64]/30 text-[#00ea64] flex items-center justify-center mx-auto font-bold">
              <Sparkles className="w-5 h-5 text-[#00ea64] animate-pulse" />
            </div>
            <p className="font-bold text-white uppercase">Listening for real-time user logins, signups, and DB triggers...</p>
            <p className="text-[10px] text-[#94a3b8] max-w-sm mx-auto">
              Interact with the HireXora platform or sign in to see live events stream here instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-sm bg-[#131b26] border border-[#2a3649] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-[#00ea64] transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Circle className="w-2 h-2 fill-current shrink-0 text-[#00ea64]" />
                  <span className="font-bold text-white uppercase font-mono">{log.type}</span>
                  <span className="text-[#94a3b8] font-mono text-[11px]">{log.data?.email || JSON.stringify(log.data)}</span>
                </div>
                <span className="text-[10px] text-[#00ea64] font-bold px-2 py-0.5 rounded-sm bg-[#00ea64]/15 border border-[#00ea64]/30 self-end sm:self-auto font-mono">
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
