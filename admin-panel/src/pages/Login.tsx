import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { setAuthToken, BASE_URL } from '../services/api';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.detail || 'Login failed');
      }

      if (data.data?.user?.role !== 'admin') {
        throw new Error('Access denied. Administrator privileges are required.');
      }

      setAuthToken(data.data.tokens.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141413] flex items-center justify-center p-4 relative overflow-hidden select-none bg-mesh-pattern">
      {/* Claude Terracotta Ambient Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#DA7756]/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D9A752]/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      <div className="w-full max-w-md glass-panel p-9 rounded-3xl border border-[#33322E] shadow-2xl relative z-10 bg-[#1E1E1B]/95">
        <div className="text-center mb-8">
          <img
            src="/hirxora-logo-2.jpg"
            alt="HireXora"
            className="w-16 h-16 rounded-2xl object-cover border border-[#DA7756]/40 shadow-xl shadow-[#DA7756]/30 mx-auto mb-4 animate-float"
          />
          <h2 className="text-3xl font-serif font-bold text-[#F4F3EE] tracking-tight">HireXora</h2>
          <p className="text-xs font-bold uppercase tracking-wider text-[#DA7756] mt-1 font-mono">Admin Command Center</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-[#DA7756]/15 border border-[#DA7756]/30 text-[#DA7756] flex items-start space-x-3 text-xs font-bold">
            <AlertCircle className="w-5 h-5 shrink-0 text-[#DA7756] mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#A6A49B] mb-2 font-mono">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A6A49B] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hirexora.com"
                className="w-full bg-[#141413] border border-[#33322E] rounded-2xl py-3.5 pl-11 pr-4 text-xs font-medium text-[#F4F3EE] placeholder-[#787770] focus:outline-none focus:border-[#DA7756] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#A6A49B] mb-2 font-mono">
              Security Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A6A49B] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#141413] border border-[#33322E] rounded-2xl py-3.5 pl-11 pr-4 text-xs font-medium text-[#F4F3EE] placeholder-[#787770] focus:outline-none focus:border-[#DA7756] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-[#DA7756] to-[#C86443] text-white font-bold shadow-lg shadow-[#DA7756]/30 hover:shadow-[#DA7756]/50 hover:scale-[1.02] transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider disabled:opacity-50 border border-[#E88A6A]/40 font-mono"
          >
            {loading ? (
              <span>Authenticating Admin...</span>
            ) : (
              <>
                <span>Access Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
