import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, UserCircle, Bell, CheckCircle2, Briefcase, Calendar, Info, Menu, X, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import { InAppNotification } from '../../types/notification';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, isMobileMenuOpen = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDrawer(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleLogout = async () => {
    setShowUserMenu(false);
    try {
      await logout();
    } finally {
      navigate('/');
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
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#FAF8F5]/10 bg-[#080607]/95 px-3 sm:px-6 backdrop-blur-xl">
      {/* Left side: Hamburger + Brand */}
      <div className="flex items-center gap-2 sm:gap-3">
        {user && onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-white/[0.04] hover:bg-[#FAF8F5]/10 text-neutral-300 hover:text-white border border-[#FAF8F5]/15 transition cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        )}

        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 sm:gap-2.5 group">
          <img
            src="/hirxora-logo-2.jpg"
            alt="Hirxora"
            className="w-8 h-8 rounded-xl object-cover border border-white/20 shadow-md shadow-[#FF6B6B]/20 group-hover:scale-105 transition shrink-0"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-lg sm:text-xl font-normal tracking-tight text-[#FAF8F5] font-serif">Hirxora</span>
            <span className="hidden xs:inline-block rounded-full bg-[#FAF8F5]/10 px-1.5 py-0.5 text-[9px] font-mono font-medium text-[#FAF8F5] border border-[#FAF8F5]/25">
              AI Copilot
            </span>
          </div>
        </Link>
      </div>

      {/* Right side: Notifications + User Dropdown + Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {user ? (
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifDrawer(!showNotifDrawer)}
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

              {/* Notification Drawer Dropdown */}
              {showNotifDrawer && (
                <div className="absolute right-0 mt-2 w-72 sm:w-96 rounded-2xl bg-[#121214] border border-[#FAF8F5]/20 shadow-2xl shadow-black/80 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
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

            {/* User Profile & Logout Popover Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-xl bg-white/[0.03] hover:bg-[#FAF8F5]/10 px-2.5 sm:px-3 py-1.5 text-xs text-[#FAF8F5] border border-[#FAF8F5]/15 hover:border-[#FAF8F5]/35 transition cursor-pointer"
                title="Account Menu"
              >
                <UserCircle className="h-4 w-4 text-[#FAF8F5] shrink-0" />
                <span className="hidden sm:inline font-medium truncate max-w-[120px]">{user.email}</span>
                <ChevronDown className="h-3 w-3 text-neutral-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#121214] border border-[#FAF8F5]/20 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                  <div className="p-2.5 rounded-xl bg-[#18181B] border border-[#FAF8F5]/10">
                    <p className="text-xs font-semibold text-white truncate">{user.email}</p>
                    <span className="text-[10px] text-emerald-400 font-mono">Logged in & Active</span>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.04] rounded-xl transition"
                  >
                    <UserCircle className="h-4 w-4 text-[#FAF8F5]" />
                    <span>Candidate Profile & Settings</span>
                  </Link>

                  <div className="pt-2 border-t border-[#FAF8F5]/10">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition cursor-pointer font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Instant Logout Button on Desktop */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 px-3 py-1.5 text-xs font-medium transition cursor-pointer active:scale-95"
              title="Log Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-xl px-3 sm:px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE0] px-3.5 sm:px-4 py-2 text-xs font-semibold text-black shadow-md shadow-white/20 transition"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
