import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, UserCircle, Bell, CheckCircle2, Briefcase, Calendar, Info } from 'lucide-react';
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
        return <Calendar className="w-4 h-4 text-[#FAF8F5] flex-shrink-0" />;
      case 'JOB_ALERT':
        return <Briefcase className="w-4 h-4 text-[#E8E2D6] flex-shrink-0" />;
      case 'STATUS_UPDATE':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-[#FAF8F5]/80 flex-shrink-0" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#FAF8F5]/10 bg-[#080607]/90 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-[#FF6B6B] to-[#FA7268] border border-white/20 shadow-md shadow-[#FF6B6B]/25 flex items-center justify-center text-white font-serif font-bold text-base group-hover:scale-105 transition">
            H
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-normal tracking-tight text-[#FAF8F5] font-serif">Hirxora</span>
            <span className="rounded-full bg-[#FAF8F5]/10 px-2 py-0.5 text-[10px] font-mono font-medium text-[#FAF8F5] border border-[#FAF8F5]/25">
              Copilot
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            {/* Notification Bell Dropdown */}
            <div className="relative" ref={drawerRef}>
              <button
                onClick={() => setShowDrawer(!showDrawer)}
                className="relative p-2 rounded-xl bg-white/[0.03] hover:bg-[#FAF8F5]/10 text-neutral-300 hover:text-white border border-[#FAF8F5]/15 hover:border-[#FAF8F5]/35 transition cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-[#FAF8F5]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FAF8F5] text-[10px] font-bold text-black shadow-md shadow-white/20 px-1">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {showDrawer && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#121214] border border-[#FAF8F5]/20 shadow-2xl shadow-black/80 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#FAF8F5]/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5]/15 text-[#FAF8F5] text-[11px] font-mono font-medium border border-[#FAF8F5]/30">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-[#FAF8F5] hover:text-white transition font-medium cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* List of notifications */}
                  <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-neutral-500 text-xs font-mono">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                          className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                            notif.is_read
                              ? 'bg-white/[0.01] border-white/[0.04] opacity-60'
                              : 'bg-[#FAF8F5]/[0.06] border-[#FAF8F5]/25 shadow-sm hover:border-[#FAF8F5]/45'
                          }`}
                        >
                          <div className="p-1.5 rounded-lg bg-[#FAF8F5]/10 border border-[#FAF8F5]/20">
                            {getNotifIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-semibold text-white truncate">{notif.title}</p>
                              <span className="text-[10px] font-mono text-neutral-500">
                                {new Date(notif.created_at).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-[#E8E2D6] mt-0.5 leading-relaxed">
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
              className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3.5 py-1.5 text-xs text-[#FAF8F5] hover:bg-[#FAF8F5]/10 hover:text-white border border-[#FAF8F5]/15 hover:border-[#FAF8F5]/35 transition"
            >
              <UserCircle className="h-4 w-4 text-[#FAF8F5]" />
              <span className="font-medium truncate max-w-[140px]">{user.email}</span>
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-neutral-400 hover:bg-[#FAF8F5]/10 hover:text-white border border-transparent hover:border-[#FAF8F5]/20 transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE0] px-4 py-2 text-xs font-semibold text-black shadow-md shadow-white/20 transition"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
