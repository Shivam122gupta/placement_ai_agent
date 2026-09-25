import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0B0F17]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-400">Loading AI Placement Agent...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col text-gray-100">
      <Navbar />
      <div className="flex flex-1">
        {isAuthenticated && <Sidebar />}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
