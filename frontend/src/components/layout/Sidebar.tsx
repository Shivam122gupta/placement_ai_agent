import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  GitCompare,
  MessageSquare,
  Send,
  Bot,
  Database,
  Settings,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Candidate Profile', path: '/profile', icon: User },
  { name: 'Resume Intelligence', path: '/resumes', icon: FileText, badge: 'AI Parse' },
  { name: 'Job Discovery', path: '/jobs', icon: Briefcase, badge: 'Match' },
  { name: 'Matching & Gaps', path: '/skill-gaps', icon: GitCompare, badge: 'Roadmap' },
  { name: 'Semantic Memory', path: '/memory', icon: Database, badge: 'RAG' },
  { name: 'AI Career Copilot', path: '/assistant', icon: Bot, badge: 'Agent' },
  { name: 'Mock Interviews', path: '/interviews', icon: MessageSquare, badge: 'Live Arena' },
  { name: 'Applications Tracker', path: '/applications', icon: Send, badge: 'Pipeline' },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-[#FAF8F5]/10 bg-[#080607]/95 backdrop-blur-2xl flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1.5">
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">
            Navigation
          </span>
          <span className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FAF8F5] animate-pulse" />
            Live
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#FAF8F5]/15 text-[#FAF8F5] border border-[#FAF8F5]/30 shadow-[0_0_20px_rgba(250,248,245,0.08)] font-semibold'
                    : 'text-neutral-400 hover:bg-white/[0.04] hover:text-[#FAF8F5] border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-neutral-300 group-hover:text-[#FAF8F5] group-hover:border-[#FAF8F5]/30 transition">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="tracking-tight">{item.name}</span>
              </div>
              {item.badge && (
                <span className="rounded-md bg-[#FAF8F5]/10 px-1.5 py-0.5 text-[9px] font-mono font-medium text-[#FAF8F5] border border-[#FAF8F5]/20">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="pt-4 border-t border-[#FAF8F5]/10 space-y-2">
        <div className="p-3.5 rounded-2xl bg-[#121214] border border-[#FAF8F5]/10 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#FAF8F5]">
            <Sparkles className="h-3.5 w-3.5 text-[#FAF8F5]" />
            <span>AI Copilot Ready</span>
          </div>
          <p className="text-[11px] text-[#E8E2D6]/70 mt-1 leading-relaxed">
            Multi-modal grounding active across Qdrant and MongoDB.
          </p>
        </div>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition ${
              isActive ? 'bg-[#FAF8F5]/15 text-white font-semibold' : 'text-neutral-400 hover:bg-white/[0.03] hover:text-[#FAF8F5]'
            }`
          }
        >
          <Settings className="h-3.5 w-3.5 text-[#FAF8F5]/70" />
          <span>Settings & Profile</span>
        </NavLink>
      </div>
    </aside>
  );
};
