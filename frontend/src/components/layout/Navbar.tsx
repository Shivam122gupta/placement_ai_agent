import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, LogOut, UserCircle, Bell, CheckCircle2, Briefcase, Calendar, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import { InAppNotification } from '../../types/notification';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const drawerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30s poll
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside to close notification drawer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setShowDrawer(false);
      }
    };
    if (showDrawer) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDrawer]);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.listNotifications();
      setNotifications(data);
    } catch (err) {
      console.debug('Failed to fetch notifications:', err);
    }
  };


  const handleMarkAsRead = async (notifId: string) => {
    try {
      await notificationService.markAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'INTERVIEW_REMINDER':
        return <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />;
      case 'JOB_ALERT':
        return <Briefcase className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
      case 'STATUS_UPDATE':
        return <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-800 bg-[#0B0F17]/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 text-white shadow-lg shadow-brand-500/20">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">AI Placement Agent</span>
            <span className="ml-2 rounded-md bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-400 border border-brand-500/20">
              v1.0
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            {/* Notification Bell Dropdown */}
            <div className="relative" ref={drawerRef}>
              <button
                onClick={() => setShowDrawer(!showDrawer)}
                className="relative p-2 rounded-xl bg-gray-800/60 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700/50 transition cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white shadow-md animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {showDrawer && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-xs font-semibold">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-brand-400 hover:text-brand-300 font-medium cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* List of notifications */}
                  <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                          className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                            notif.is_read
                              ? 'bg-slate-950/40 border-slate-800/60 opacity-70'
                              : 'bg-slate-950 border-brand-500/30 shadow-sm'
                          }`}
                        >
                          {getNotifIcon(notif.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-white truncate">{notif.title}</p>
                              <span className="text-[10px] text-slate-500">
                                {new Date(notif.created_at).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-lg bg-gray-800/60 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-800 border border-gray-700/50 transition"
            >
              <UserCircle className="h-4 w-4 text-brand-400" />
              <span className="font-medium">{user.email}</span>
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 shadow-md shadow-brand-500/20 transition"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
