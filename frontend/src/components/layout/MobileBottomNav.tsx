import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Bot,
  User,
} from 'lucide-react';

const mobileNavItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Resumes', path: '/resumes', icon: FileText },
  { name: 'Jobs', path: '/jobs', icon: Briefcase },
  { name: 'AI Copilot', path: '/assistant', icon: Bot },
  { name: 'Profile', path: '/profile', icon: User },
];

export const MobileBottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden border-t border-[#FAF8F5]/15 bg-[#080607]/95 backdrop-blur-2xl px-2 py-1.5 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 select-none ${
                  isActive
                    ? 'text-[#FAF8F5] font-semibold scale-105'
                    : 'text-neutral-400 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1 rounded-lg transition ${
                      isActive
                        ? 'bg-[#FAF8F5]/15 text-[#FAF8F5] shadow-sm'
                        : 'text-neutral-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
