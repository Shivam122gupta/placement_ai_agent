import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Key, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';
import { setAuthToken, BASE_URL } from '../services/api';

const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isIdleLogout = searchParams.get('reason') === 'idle_timeout';

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;

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
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);

        if (nextFailed >= MAX_FAILED_ATTEMPTS) {
          setCooldown(COOLDOWN_SECONDS);
          setFailedAttempts(0);
          throw new Error(`Too many failed login attempts. Security cooldown active for ${COOLDOWN_SECONDS} seconds.`);
        }
        throw new Error(data.message || data.detail || 'Login failed');
      }

      if (data.data?.user?.role !== 'admin') {
        throw new Error('Access denied. Administrator privileges are required.');
      }

      setFailedAttempts(0);
      setAuthToken(data.data.tokens.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e141e] text-white flex flex-col justify-between font-sans select-none">
      {/* Top Header Navigation Bar */}
      <header className="bg-[#131b26] border-b border-[#2a3649] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2.5">
          <img
            src="/hirexora-logo.jpg"
            alt="HireXora Logo"
            className="w-8 h-8 rounded-sm border border-[#00ea64]/40 object-cover shadow-sm"
          />
          <div className="bg-[#00ea64] text-[#0e141e] px-2 py-0.5 font-mono font-extrabold text-[11px] uppercase tracking-wider rounded-sm">
            HIREXORA
          </div>
          <span className="font-mono font-bold text-xs sm:text-sm tracking-tight text-white uppercase hidden sm:inline-block">
            ADMIN CONSOLE
          </span>
        </div>

        <div className="bg-[#182230] border border-[#2a3649] px-2.5 py-1 rounded-sm font-mono text-[11px] sm:text-xs font-bold text-white flex items-center space-x-2">
          <span className="w-2 h-2 bg-[#00ea64] rounded-sm animate-pulse" />
          <span className="tracking-wide text-zinc-200">LIVE SYNC</span>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 my-4 sm:my-8">
        <div className="w-full max-w-xl bg-[#182230] border-2 border-[#2a3649] shadow-2xl p-5 sm:p-8 md:p-9 rounded-sm relative z-10">
          
          {/* Logo Badge Header */}
          <div className="text-center mb-6">
            <img
              src="/hirexora-logo.jpg"
              alt="HireXora Admin"
              className="w-16 h-16 rounded-sm border-2 border-[#00ea64] object-cover shadow-lg shadow-[#00ea64]/20 mx-auto mb-3"
            />
            <h2 className="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-tight uppercase">
              ADMIN COMMAND CENTER
            </h2>
            <p className="text-xs font-mono text-[#94a3b8] mt-1.5 leading-relaxed max-w-md mx-auto">
              Enter your Administrator credentials to access Placement Analytics, Candidate Monitoring, and AI Engine Controls.
            </p>
          </div>

          {/* Header Pill inside Card Header */}
          <div className="bg-[#131b26] border border-[#2a3649] text-white px-3 py-2 flex items-center justify-between font-mono text-xs font-bold rounded-sm mb-6">
            <div className="flex items-center space-x-2 text-[#00ea64]">
              <Key className="w-4 h-4 text-[#00ea64] shrink-0" />
              <span className="text-white tracking-wider text-[11px] sm:text-xs">HIREXORA ADMIN GATEWAY</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[#00ea64] text-[10px] sm:text-[11px] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ea64] animate-ping" />
              <span className="tracking-wider">SECURITY LOCKED</span>
            </div>
          </div>

          {/* Idle Logout Notice */}
          {isIdleLogout && !error && (
            <div className="mb-6 p-3 bg-[#131b26] border-2 border-amber-500 text-amber-300 flex items-center space-x-3 text-xs font-mono font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Session expired due to 15 minutes of inactivity. Please re-authenticate.</span>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="mb-6 p-3 bg-[#131b26] border-2 border-red-500 text-red-300 flex items-start space-x-3 text-xs font-mono font-bold">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-white mb-1.5">
                1. ADMIN EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hirexora.com"
                className="w-full bg-[#131b26] border-2 border-[#2a3649] text-white placeholder-[#94a3b8]/50 p-3 sm:p-3.5 font-mono text-xs focus:border-[#00ea64] focus:outline-none rounded-sm transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-white">
                  2. SECURITY PASSWORD
                </label>
                <span className="text-[10px] font-mono font-bold text-[#94a3b8] uppercase tracking-wider hidden sm:inline-block">
                  AES-256 ENCRYPTED
                </span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#131b26] border-2 border-[#2a3649] text-white placeholder-[#94a3b8]/50 p-3 sm:p-3.5 pr-10 font-mono text-xs focus:border-[#00ea64] focus:outline-none rounded-sm transition-colors"
                />
                <Lock className="w-4 h-4 text-[#94a3b8] absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading || cooldown > 0}
              className="w-full bg-[#00ea64] hover:bg-[#00c854] disabled:bg-zinc-600 text-[#0e141e] font-mono font-extrabold text-xs uppercase tracking-wider py-3.5 sm:py-4 px-4 flex items-center justify-center space-x-2 transition-all rounded-sm border border-[#00ea64] mt-5 sm:mt-6 shadow-md shadow-[#00ea64]/20"
            >
              {cooldown > 0 ? (
                <span>SECURITY COOLDOWN ({cooldown}S)</span>
              ) : loading ? (
                <span>AUTHENTICATING GATEWAY...</span>
              ) : (
                <>
                  <Key className="w-4 h-4 text-[#0e141e]" />
                  <span>ACCESS COMMAND CENTER →</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Security Notice */}
          <div className="mt-5 sm:mt-6 pt-2 flex items-center space-x-2 font-mono text-[10px] sm:text-[11px] text-[#94a3b8]">
            <CheckCircle2 className="w-4 h-4 text-[#00ea64] shrink-0" />
            <span>Authorized administrator credentials are secured with JWT session tickets.</span>
          </div>

        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="py-3 sm:py-4 text-center font-mono text-[10px] sm:text-[11px] text-[#94a3b8] border-t border-[#2a3649] bg-[#131b26]">
        HIREXORA OPERATOR SYSTEM v2.0 • HIGH PRIVILEGE SECURITY GATEWAY
      </footer>
    </div>
  );
};
