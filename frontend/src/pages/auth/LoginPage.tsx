import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#111827]/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-400 text-white shadow-lg shadow-brand-500/25">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
          <p className="mt-1 text-sm text-gray-400">Sign in to your AI Placement Agent</p>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-sm text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Email Address
            </label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@university.edu"
                className="w-full rounded-xl border border-gray-700 bg-gray-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Password
              </label>
            </div>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-700 bg-gray-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:from-brand-500 hover:to-brand-400 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300">
            Create Profile
          </Link>
        </p>
      </div>
    </div>
  );
};
