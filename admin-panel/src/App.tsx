import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NotificationToastContainer } from './components/NotificationToast';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/Users';
import { DatabaseTools } from './pages/DatabaseTools';
import { LiveActivity } from './pages/LiveActivity';
import { getAuthToken } from './services/api';
import { wsClient } from './services/ws';

const ProtectedLayout: React.FC = () => {
  const token = getAuthToken();
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    if (token) {
      wsClient.connect();
      setWsConnected(true);
    }
    return () => {
      wsClient.disconnect();
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#141413] bg-mesh-pattern text-[#F4F3EE]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header wsConnected={wsConnected} />
        <main className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
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
