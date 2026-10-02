import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Database, Activity, LogOut, ChevronRight, Sparkles, X } from 'lucide-react';
import { removeAuthToken } from '../services/api';
import { wsClient } from '../services/ws';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    wsClient.disconnect();
    removeAuthToken();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', badge: 'Live' },
    { label: 'User Monitoring', icon: Users, path: '/users' },
    { label: 'Live Event Stream', icon: Activity, path: '/live' },
    { label: 'DB Maintenance', icon: Database, path: '/database' },
  ];

  const sidebarContent = (
    <div className="w-64 bg-[#131b26] border-r border-[#2a3649] flex flex-col justify-between h-full select-none text-white font-mono">
      <div>
        {/* Top Branding with Logo */}
        <div className="p-4 border-b border-[#2a3649] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <img
              src="/hirexora-logo.jpg"
              alt="HireXora Logo"
              className="w-8 h-8 rounded-sm border border-[#00ea64] object-cover shadow-sm"
            />
            <div>
              <h1 className="font-mono text-xs font-extrabold text-white tracking-tight uppercase">
                HIREXORA OPS
              </h1>
              <span className="text-[9px] font-mono text-[#00ea64] font-bold tracking-wider block -mt-0.5">
                ADMIN CONSOLE v2.0
              </span>
            </div>
          </div>

          {/* Close Mobile Drawer Button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 text-zinc-400 hover:text-white rounded-sm"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="p-3.5 space-y-4">
          <div>
            <span className="px-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#94a3b8] block mb-2">
              SYSTEM CONTROL MENU
            </span>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3.5 py-2.5 rounded-sm transition-all font-mono text-xs uppercase tracking-wide ${
                      isActive
                        ? 'bg-[#182230] text-[#00ea64] font-bold border-l-4 border-[#00ea64] shadow-sm'
                        : 'text-[#94a3b8] hover:text-white hover:bg-[#182230] border-l-4 border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center space-x-2.5">
                        <item.icon className={`w-4 h-4 ${isActive ? 'text-[#00ea64]' : 'text-[#94a3b8] group-hover:text-white'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-mono font-bold uppercase ${isActive ? 'bg-[#00ea64]/20 text-[#00ea64]' : 'bg-[#1e293b] text-[#94a3b8]'}`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* 1-Click PWA Install Button */}
          <PWAInstallButton variant="sidebar" />

          {/* Environment Card */}
          <div className="p-3 rounded-sm bg-[#182230] border border-[#2a3649] font-mono text-xs text-white">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1.5 text-[10px] font-bold text-[#00ea64] uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#00ea64]" />
                <span>ENVIRONMENT</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#00ea64] animate-ping" />
            </div>
            <p className="text-[10px] text-[#94a3b8] font-medium leading-tight">
              FastAPI + MongoDB + Qdrant Engine
            </p>
          </div>
        </div>
      </div>

      {/* Admin User Footer */}
      <div className="p-3.5 border-t border-[#2a3649] font-mono">
        <div className="p-2.5 rounded-sm bg-[#182230] border border-[#2a3649] flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2.5">
            <img
              src="/hirexora-logo.jpg"
              alt="HireXora Admin Avatar"
              className="w-7 h-7 rounded-sm border border-[#00ea64] object-cover"
            />
            <div>
              <p className="text-xs font-bold text-white leading-none">HireXora Admin</p>
              <span className="text-[9px] text-[#00ea64] font-bold uppercase tracking-wider block mt-0.5">ROOT ACCESS</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-sm bg-[#00ea64]/10 text-[#00ea64] border border-[#00ea64]/30 hover:bg-[#00ea64] hover:text-[#0e141e] transition-all text-xs font-mono font-bold uppercase tracking-wider"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>SIGN OUT ADMIN</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop Overlay */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />
          {/* Drawer Content */}
          <div className="relative z-10 flex-1 max-w-xs w-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
