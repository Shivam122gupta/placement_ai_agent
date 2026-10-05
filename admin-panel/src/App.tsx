import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NotificationToastContainer } from './components/NotificationToast';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/Users';
import { DatabaseTools } from './pages/DatabaseTools';
import { LiveActivity } from './pages/LiveActivity';
import { getAuthToken, removeAuthToken } from './services/api';
import { wsClient } from './services/ws';

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 60 Minutes Idle Timeout

const ProtectedLayout: React.FC = () => {
  const token = getAuthToken();
  const [wsConnected, setWsConnected] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const idleTimerRef = useRef<any>(null);

  // Auto Logout Idle Session Protection
  const resetIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      wsClient.disconnect();
      removeAuthToken();
      window.location.href = '/login?reason=idle_timeout';
    }, IDLE_TIMEOUT_MS);
  };

  useEffect(() => {
    if (token) {
      wsClient.connect();
      setWsConnected(true);

      // Attach global activity listeners for idle session protection
      const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
      events.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { passive: true }));
      resetIdleTimer();

      return () => {
        events.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        wsClient.disconnect();
      };
    }
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#0e141e] text-white">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          wsConnected={wsConnected}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="p-4 sm:p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/live" element={<LiveActivity />} />
            <Route path="/database" element={<DatabaseTools />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <NotificationToastContainer />
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
