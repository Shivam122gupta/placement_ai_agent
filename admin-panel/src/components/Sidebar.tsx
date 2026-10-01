import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Database, Activity, LogOut, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import { removeAuthToken } from '../services/api';
import { wsClient } from '../services/ws';

export const Sidebar: React.FC = () => {
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

  return (
    <aside className="w-72 glass-panel border-r border-[#2D2C28] flex flex-col justify-between hidden md:flex h-screen sticky top-0 z-30 select-none bg-[#181816]">
      <div>
        {/* HireXora Brand Header */}
        <div className="p-6 border-b border-[#2D2C28] flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <img
                src="/hirxora-logo-2.jpg"
                alt="HireXora"
                className="w-11 h-11 rounded-2xl object-cover border border-[#DA7756]/40 shadow-lg shadow-[#DA7756]/20 shrink-0"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#DA7756] border-2 border-[#181816] rounded-full animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-serif text-lg font-bold text-[#F4F3EE] tracking-tight">HireXora</h1>
                <span className="bg-[#DA7756]/15 text-[#DA7756] text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#DA7756]/30 font-semibold">
                  v2.0
                </span>
              </div>
              <span className="text-[11px] text-[#DA7756] font-extrabold uppercase tracking-wider block -mt-0.5">
                Admin Console
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-4 space-y-6">
          <div>
            <span className="px-3 text-[11px] font-extrabold uppercase tracking-widest text-[#787770] block mb-2 font-mono">
              Main Menu
            </span>
            <nav className="space-y-1.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 font-semibold text-xs uppercase tracking-wider ${
                      isActive
                        ? 'bg-gradient-to-r from-[#DA7756] to-[#C86443] text-[#F4F3EE] shadow-lg shadow-[#DA7756]/25 border border-[#E88A6A]/40 font-bold'
                        : 'text-[#A6A49B] hover:text-[#F4F3EE] hover:bg-[#252522] border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center space-x-3.5">
                        <item.icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110 text-[#F4F3EE]' : 'group-hover:scale-110 text-[#A6A49B] group-hover:text-[#DA7756]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${isActive ? 'bg-white/20 text-white' : 'bg-[#DA7756]/15 text-[#DA7756] border border-[#DA7756]/30'}`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Environment Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#242420] to-[#1C1C19] border border-[#383732] relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#DA7756] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#DA7756]" />
                <span>Environment</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#DA7756] animate-ping" />
            </div>
            <p className="text-xs text-[#ECEAE2] font-medium leading-relaxed">
              FastAPI + MongoDB + Qdrant Vector Engine
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] text-[#DA7756] font-bold">
              <span>Status: Active</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Admin User Footer */}
      <div className="p-4 border-t border-[#2D2C28]">
        <div className="p-3 rounded-2xl bg-[#22221F] border border-[#33322E] flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#DA7756] to-[#C86443] flex items-center justify-center text-white font-serif font-bold text-base shadow-md border border-[#E88A6A]/30">
              H
            </div>
            <div>
              <p className="text-xs font-bold text-[#F4F3EE] leading-snug">HireXora Admin</p>
              <span className="text-[10px] text-[#DA7756] font-bold uppercase tracking-wider">Root Privilege</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-[#DA7756] hover:bg-[#DA7756]/10 hover:border-[#DA7756]/30 border border-transparent transition-all text-xs font-extrabold uppercase tracking-wider"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Admin</span>
        </button>
      </div>
    </aside>
  );
};
