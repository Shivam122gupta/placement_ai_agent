import React, { useEffect, useState } from 'react';
import { Bell, UserCheck, UserPlus, LogOut, Trash2, X } from 'lucide-react';
import { WSEvent, wsClient } from '../services/ws';

interface ToastItem {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
}

export const NotificationToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = wsClient.subscribe((event: WSEvent) => {
      let title = '';
      let message = '';

      if (event.type === 'USER_LOGIN') {
        title = '🟢 User Logged In';
        message = `${event.data.email} just logged in.`;
      } else if (event.type === 'USER_REGISTERED') {
        title = '🎉 New User Registered';
        message = `${event.data.email} created a new account.`;
      } else if (event.type === 'USER_LOGOUT') {
        title = '⚪ User Logged Out';
        message = `${event.data.email} logged out.`;
      } else if (event.type === 'DB_CLEANUP_EXECUTED') {
        title = '🧹 DB Cleanup Executed';
        message = `Cleanup triggered by ${event.data.admin_email}.`;
      } else {
        return;
      }

      const newToast: ToastItem = {
        id: Math.random().toString(),
        type: event.type,
        title,
        message,
        timestamp: new Date().toLocaleTimeString(),
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 6000);
    });

    return () => unsubscribe();
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="glass-panel p-4 rounded-2xl border border-[#DA7756]/30 shadow-2xl flex items-start justify-between bg-[#1E1E1B]/95 backdrop-blur-md"
        >
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#DA7756]/20 text-[#DA7756] flex items-center justify-center shrink-0 mt-0.5 border border-[#DA7756]/30">
              {toast.type === 'USER_REGISTERED' ? (
                <UserPlus className="w-4 h-4 text-emerald-400" />
              ) : toast.type === 'USER_LOGIN' ? (
                <UserCheck className="w-4 h-4 text-[#DA7756]" />
              ) : toast.type === 'USER_LOGOUT' ? (
                <LogOut className="w-4 h-4 text-amber-400" />
              ) : (
                <Trash2 className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#F4F3EE]">{toast.title}</h4>
              <p className="text-xs text-[#A6A49B] mt-0.5">{toast.message}</p>
              <span className="text-[10px] text-[#787770] font-mono mt-1 block">{toast.timestamp}</span>
            </div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-[#787770] hover:text-[#F4F3EE] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
