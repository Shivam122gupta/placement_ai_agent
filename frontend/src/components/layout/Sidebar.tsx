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
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Candidate Profile', path: '/profile', icon: User },
  { name: 'Resumes', path: '/resumes', icon: FileText, badge: 'Phase 2' },
  { name: 'Job Discovery', path: '/jobs', icon: Briefcase, badge: 'Phase 3' },
  { name: 'Matching & Gaps', path: '/skill-gaps', icon: GitCompare, badge: 'Phase 4' },
  { name: 'Semantic Memory', path: '/memory', icon: Database, badge: 'Phase 6' },
  { name: 'AI Career Copilot', path: '/assistant', icon: Bot, badge: 'Phase 5' },
  { name: 'Mock Interviews', path: '/interviews', icon: MessageSquare, badge: 'Phase 7' },
  { name: 'Applications', path: '/applications', icon: Send, badge: 'Phase 8' },
];


export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-800 bg-[#0B0F17] flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Career Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 font-semibold'
                    : 'text-gray-400 hover:bg-gray-850 hover:text-gray-200'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="rounded-md bg-gray-800/80 px-2 py-0.5 text-[10px] font-medium text-gray-400 border border-gray-700/50">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="pt-4 border-t border-gray-800">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
              isActive ? 'bg-brand-500/15 text-brand-400' : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
            }`
          }
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};
