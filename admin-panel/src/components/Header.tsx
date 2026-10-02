import React from 'react';
import { Search, Menu, X } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  wsConnected: boolean;
  onToggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  wsConnected,
  onToggleMobileMenu,
  mobileMenuOpen,
}) => {
  return (
    <header className="h-16 bg-[#131b26] border-b border-[#2a3649] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none text-white">
      {/* Mobile Menu Button & Search Input */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={onToggleMobileMenu}
          aria-label="Toggle Navigation Drawer"
          className="md:hidden p-2 rounded-sm bg-[#182230] border border-[#2a3649] text-[#00ea64] hover:bg-[#1f2d40] focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-[#00ea64]" /> : <Menu className="w-5 h-5 text-[#00ea64]" />}
        </button>

        {/* Search Input */}
        <div className="hidden sm:flex items-center space-x-2.5 bg-[#182230] border border-[#2a3649] px-3.5 py-1.5 rounded-sm w-48 sm:w-64 md:w-72 focus-within:border-[#00ea64] transition-colors">
          <Search className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" />
          <input
            type="text"
            placeholder="Search command or module..."
            className="bg-transparent border-none text-xs text-white placeholder-[#94a3b8]/60 focus:outline-none w-full font-mono font-medium"
          />
        </div>
      </div>

      {/* Badges, PWA 1-Click Install & Branding */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        {/* 1-Click PWA Install Button */}
        <PWAInstallButton variant="header" />

        {/* WebSocket Stream Indicator */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 bg-[#182230] border border-[#2a3649] px-2.5 sm:px-3 py-1 rounded-sm font-mono text-[11px] sm:text-xs text-white">
          <span className={`w-2 h-2 rounded-sm ${wsConnected ? 'bg-[#00ea64] animate-pulse' : 'bg-zinc-500'}`} />
          <span className="font-bold tracking-wider uppercase">
            {wsConnected ? 'LIVE SYNC' : 'OFFLINE'}
          </span>
        </div>

        {/* Brand Logo Icon */}
        <div className="w-8 h-8 rounded-sm bg-[#0e141e] border border-[#00ea64]/40 flex items-center justify-center overflow-hidden shadow-sm">
          <img src="/hirexora-logo.jpg" alt="HireXora Logo" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
};
