import React, { useEffect, useState } from 'react';
import { Search, Filter, ShieldCheck, User, Trash2, RefreshCw, Clock } from 'lucide-react';
import { adminFetch } from '../services/api';
import { wsClient, WSEvent } from '../services/ws';

const formatDate = (isoStr: string | null | undefined) => {
  if (!isoStr) return '—';
  const hasTz = isoStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(isoStr);
  const normalized = hasTz ? isoStr : `${isoStr}Z`;
  return new Date(normalized).toLocaleString();
};

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const filterParam = statusFilter.toLowerCase() === 'all' ? '' : statusFilter.toLowerCase();
      const query = `/admin/users?page=${page}&limit=15&search=${encodeURIComponent(search)}&filter_status=${filterParam}`;
      const data = await adminFetch(query);
      setUsers(data.data.users);
      setTotalPages(data.data.total_pages);
      setTotalUsers(data.data.total);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const unsubscribe = wsClient.subscribe((event: WSEvent) => {
      if (['USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTERED', 'USER_DELETED', 'USER_ROLE_UPDATED'].includes(event.type)) {
        fetchUsers();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change role of user to '${newRole}'?`)) return;

    try {
      await adminFetch(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`⚠️ Are you sure you want to delete user '${email}' and all their data? This action CANNOT be undone.`)) return;

    try {
      await adminFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#F4F3EE] tracking-tight">User Activity & Status</h1>
          <p className="text-xs text-[#A6A49B] mt-1 font-medium">Real-time user status, login/logout timestamps, and account roles</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-[#1E1E1B] border border-[#33322E] px-4 py-2 rounded-2xl text-xs font-bold text-[#A6A49B]">
            <span>Total Accounts:</span>
            <span className="text-[#DA7756] font-bold text-sm font-mono">{totalUsers}</span>
          </div>
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-2xl bg-[#1E1E1B] hover:bg-[#252522] text-[#F4F3EE] border border-[#33322E] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-[#DA7756] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-5 rounded-3xl border border-[#33322E] flex flex-col md:flex-row items-center justify-between gap-4 bg-[#1E1E1B]">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#A6A49B] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts by email..."
            className="w-full bg-[#141413] border border-[#33322E] rounded-2xl py-2.5 pl-11 pr-4 text-xs font-medium text-[#F4F3EE] placeholder-[#787770] focus:outline-none focus:border-[#DA7756] transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#A6A49B] shrink-0" />
          {['All', 'Online', 'Offline', 'Admin'].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setStatusFilter(filter);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all uppercase tracking-wider ${
                statusFilter === filter
                  ? 'bg-gradient-to-r from-[#DA7756] to-[#C86443] text-white shadow-lg shadow-[#DA7756]/30 border border-[#E88A6A]/40'
                  : 'bg-[#141413] text-[#A6A49B] hover:text-[#F4F3EE] hover:bg-[#252522] border border-[#33322E]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-3xl border border-[#33322E] overflow-hidden bg-[#1E1E1B]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141413] text-[#A6A49B] uppercase text-[11px] font-bold tracking-wider border-b border-[#33322E]">
              <tr>
                <th className="px-6 py-4">User Account</th>
                <th className="px-6 py-4">Live Status</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4">Last Logout</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#33322E]/60 font-medium text-[#ECEAE2]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-[#A6A49B]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#DA7756] mb-2" />
                    Loading user account records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-[#A6A49B]">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#252522] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#DA7756] to-[#C86443] flex items-center justify-center text-white font-serif font-bold text-xs shadow-md border border-[#E88A6A]/30">
                          {u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#F4F3EE] text-xs">{u.email}</p>
                          <span className="text-[10px] text-[#A6A49B] font-mono">ID: {u.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {u.is_online ? (
                        <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DA7756]/15 text-[#DA7756] border border-[#DA7756]/30 glow-terracotta-pulse">
                          <span className="w-2 h-2 rounded-full bg-[#DA7756] animate-pulse" />
                          <span>Online</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#141413] text-[#787770] border border-[#33322E]">
                          <span className="w-2 h-2 rounded-full bg-[#787770]" />
                          <span>Offline</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DA7756]/15 text-[#DA7756] border border-[#DA7756]/30">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#DA7756]" />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#141413] text-[#A6A49B] border border-[#33322E]">
                          <User className="w-3.5 h-3.5 text-[#A6A49B]" />
                          <span>User</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-[#ECEAE2]">
                      {u.last_login_at ? (
                        <span className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#DA7756] shrink-0" />
                          <span className="font-mono text-[11px]">{formatDate(u.last_login_at)}</span>
                        </span>
                      ) : (
                        <span className="text-[#787770]">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-[#ECEAE2]">
                      {u.last_logout_at ? (
                        <span className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-mono text-[11px]">{formatDate(u.last_logout_at)}</span>
                        </span>
                      ) : (
                        <span className="text-[#787770]">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleRoleToggle(u.id, u.role)}
                        title="Toggle Admin Privilege"
                        className="px-3 py-1.5 rounded-xl bg-[#141413] hover:bg-[#252522] text-[#DA7756] font-bold border border-[#33322E] transition-all text-xs uppercase tracking-wider"
                      >
                        Toggle Role
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        title="Delete User Account"
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
