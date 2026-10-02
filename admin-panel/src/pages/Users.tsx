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
    <div className="space-y-6 select-none font-sans text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-extrabold text-white tracking-tight uppercase">User Activity & Status</h1>
          <p className="text-xs font-mono text-[#94a3b8] mt-1">Real-time user status, login/logout timestamps, and account roles</p>
        </div>
        <div className="flex items-center space-x-3 font-mono">
          <div className="flex items-center space-x-2 bg-[#182230] border border-[#2a3649] px-4 py-2 rounded-sm text-xs font-bold text-white">
            <span>TOTAL ACCOUNTS:</span>
            <span className="text-[#00ea64] font-bold text-sm">{totalUsers}</span>
          </div>
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-sm bg-[#00ea64] hover:bg-[#00c854] text-[#0e141e] border border-[#00ea64] transition-colors font-bold shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-[#0e141e] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#182230] p-4 rounded-sm border border-[#2a3649] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts by email..."
            className="w-full bg-[#131b26] border border-[#2a3649] rounded-sm py-2 pl-10 pr-3 font-mono text-xs text-white placeholder-[#94a3b8]/50 focus:outline-none focus:border-[#00ea64]"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto font-mono text-xs">
          <Filter className="w-4 h-4 text-[#94a3b8] shrink-0" />
          {['All', 'Online', 'Offline', 'Admin'].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setStatusFilter(filter);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-sm font-bold transition-all uppercase tracking-wider ${
                statusFilter === filter
                  ? 'bg-[#00ea64] text-[#0e141e] border border-[#00ea64]'
                  : 'bg-[#131b26] text-[#94a3b8] hover:text-white hover:bg-[#1f2d40] border border-[#2a3649]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#182230] rounded-sm border border-[#2a3649] shadow-md overflow-hidden">
        <div className="overflow-x-auto font-mono">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#131b26] text-[#00ea64] uppercase text-[11px] font-bold tracking-wider border-b border-[#2a3649]">
              <tr>
                <th className="px-5 py-3.5">User Account</th>
                <th className="px-5 py-3.5">Live Status</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Last Login</th>
                <th className="px-5 py-3.5">Last Logout</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3649] text-zinc-200 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#94a3b8]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#00ea64] mb-2" />
                    Loading user account records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#94a3b8]">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#131b26] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-sm bg-[#00ea64] text-[#0e141e] font-mono font-bold text-xs flex items-center justify-center">
                          {u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{u.email}</p>
                          <span className="text-[10px] text-[#94a3b8]">ID: {u.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {u.is_online ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase bg-[#00ea64]/15 text-[#00ea64] border border-[#00ea64]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00ea64] animate-pulse" />
                          <span>ONLINE</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase bg-[#131b26] text-[#94a3b8] border border-[#2a3649]">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                          <span>OFFLINE</span>
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase bg-[#00ea64]/15 text-[#00ea64] border border-[#00ea64]/30">
                          <ShieldCheck className="w-3 h-3 text-[#00ea64]" />
                          <span>ADMIN</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase bg-[#131b26] text-[#94a3b8] border border-[#2a3649]">
                          <User className="w-3 h-3 text-[#94a3b8]" />
                          <span>USER</span>
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-zinc-300">
                      {u.last_login_at ? (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-[#00ea64] shrink-0" />
                          <span className="text-[10px]">{formatDate(u.last_login_at)}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-zinc-300">
                      {u.last_logout_at ? (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="text-[10px]">{formatDate(u.last_logout_at)}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleRoleToggle(u.id, u.role)}
                        title="Toggle Admin Privilege"
                        className="px-2.5 py-1 rounded-sm bg-[#131b26] hover:bg-[#00ea64] hover:text-[#0e141e] text-[#00ea64] font-bold border border-[#00ea64]/40 transition-all text-[10px] uppercase"
                      >
                        Toggle Role
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        title="Delete User Account"
                        className="p-1.5 rounded-sm bg-[#131b26] hover:bg-red-500 hover:text-white text-red-400 border border-red-500/30 transition-all"
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
