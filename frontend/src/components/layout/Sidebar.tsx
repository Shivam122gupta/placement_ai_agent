import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  X,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Candidate Profile', path: '/profile', icon: User },
  { name: 'Resume Intelligence', path: '/resumes', icon: FileText },
  { name: 'Job Discovery', path: '/jobs', icon: Briefcase },
  { name: 'Matching & Gaps', path: '/skill-gaps', icon: GitCompare },
  { name: 'Semantic Memory', path: '/memory', icon: Database },
  { name: 'AI Career Copilot', path: '/assistant', icon: Bot },
  { name: 'Mock Interviews', path: '/interviews', icon: MessageSquare },
  { name: 'Applications Tracker', path: '/applications', icon: Send },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (onClose) onClose();
    try {
      await logout();
    } finally {
      navigate('/');
    }
  };

  const content = (
    <div className="flex flex-col justify-between h-full p-4 overflow-y-auto">
      <div className="space-y-1.5">
        {/* Header inside sidebar */}
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">
              Hirxora Hub
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <div className="space-y-1 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#FAF8F5]/15 text-[#FAF8F5] border border-[#FAF8F5]/30 shadow-[0_0_20px_rgba(250,248,245,0.08)] font-semibold'
                      : 'text-neutral-400 hover:bg-white/[0.04] hover:text-[#FAF8F5] border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-neutral-300 group-hover:text-[#FAF8F5] group-hover:border-[#FAF8F5]/30 transition shrink-0">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="tracking-tight truncate">{item.name}</span>
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Bottom User Profile & Logout Section */}
      <div className="pt-4 border-t border-[#FAF8F5]/10 space-y-2.5 mt-4">
        {/* User Card */}
        {user && (
          <NavLink
            to="/profile"
            onClick={() => onClose && onClose()}
            className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#121214] border border-[#FAF8F5]/15 hover:border-[#FAF8F5]/40 transition group"
          >
            <div className="h-8 w-8 rounded-xl bg-[#FAF8F5]/10 border border-[#FAF8F5]/20 flex items-center justify-center text-[#FAF8F5] shrink-0">
              <UserCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate group-hover:text-[#FAF8F5]">{user.email}</p>
              <span className="text-[10px] text-neutral-400 font-mono">View Profile & Settings</span>
            </div>
          </NavLink>
        )}

        {/* Clear, Prominent Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 px-3 py-2.5 text-xs font-semibold transition cursor-pointer active:scale-95 shadow-sm"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Log Out Account</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-[#FAF8F5]/10 bg-[#080607]/95 backdrop-blur-2xl flex-col min-h-[calc(100vh-4rem)] sticky top-16">
        {content}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
          />
          {/* Drawer Sheet */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#080607] border-r border-[#FAF8F5]/20 shadow-2xl z-50 animate-in slide-in-from-left duration-300 overflow-y-auto">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
