import React from 'react';
import { ShieldCheck, Search, Radio, Sparkles } from 'lucide-react';

interface HeaderProps {
  wsConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ wsConnected }) => {
  return (
    <header className="h-20 glass-panel border-b border-[#2D2C28] px-8 flex items-center justify-between sticky top-0 z-20 select-none bg-[#181816]/90">
      {/* Search Input */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3 bg-[#22221F] border border-[#33322E] px-4 py-2.5 rounded-2xl w-80 focus-within:border-[#DA7756]/60 transition-colors">
          <Search className="w-4 h-4 text-[#A6A49B] shrink-0" />
          <input
            type="text"
            placeholder="Search command or module..."
            className="bg-transparent border-none text-xs text-[#F4F3EE] placeholder-[#787770] focus:outline-none w-full font-medium"
          />
        </div>
      </div>

      {/* Badges & HireXora Branding */}
      <div className="flex items-center space-x-4">
        {/* WebSocket Stream Indicator */}
        <div className="flex items-center space-x-2.5 bg-[#22221F] px-4 py-2 rounded-2xl border border-[#33322E]">
          <span className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'bg-[#DA7756] animate-pulse glow-terracotta-pulse' : 'bg-zinc-600'}`} />
          <span className="text-xs font-bold text-[#F4F3EE] uppercase tracking-wider">
            {wsConnected ? 'WS Stream' : 'WS Offline'}
          </span>
          <span className="text-[10px] text-[#DA7756] px-2 py-0.5 rounded-md bg-[#DA7756]/15 border border-[#DA7756]/30 font-mono font-bold">
            {wsConnected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {/* Security Badge */}
        <div className="hidden sm:flex items-center space-x-2 bg-[#DA7756]/10 text-[#DA7756] border border-[#DA7756]/30 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-[#DA7756]" />
          <span>HireXora Security Active</span>
        </div>

        {/* HireXora Brand Icon */}
        <div className="w-10 h-10 rounded-2xl bg-[#22221F] border border-[#DA7756]/40 flex items-center justify-center shadow-md overflow-hidden">
          <img src="/hirxora-logo-2.jpg" alt="HireXora" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
};
