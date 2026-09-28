import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { PwaInstallPrompt } from '../common/PwaInstallPrompt';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#080607]">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/hirxora-logo-2.jpg"
            alt="Hirxora"
            className="w-12 h-12 rounded-2xl object-cover border border-white/20 shadow-lg shadow-[#FF6B6B]/20 animate-pulse"
          />
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FAF8F5]/20 border-t-[#FAF8F5]" />
          <p className="text-xs font-mono text-[#FAF8F5]">Initializing Hirxora Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080607] flex flex-col text-[#FAF8F5] selection:bg-[#FAF8F5] selection:text-black">
      <Navbar
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
      />
      <div className="flex flex-1 relative">
        {/* Subtle background ambient warm white glow */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-[#FAF8F5]/[0.02] blur-[140px]" />
          <div className="absolute top-1/2 left-1/3 h-96 w-96 rounded-full bg-white/[0.015] blur-[160px]" />
        </div>

        {isAuthenticated && (
          <Sidebar
            mobileOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
          />
        )}
        <main className="flex-1 overflow-y-auto p-3 xs:p-4 sm:p-6 md:p-8 pb-24 lg:pb-8 relative z-10">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      {isAuthenticated && <MobileBottomNav />}
      <PwaInstallPrompt />
    </div>
  );
};
