import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { authService } from '@/services/authService';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLengthValid = newPassword.length >= 8;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Missing or invalid password reset token. Please request a new link.');
      return;
    }
    if (!isLengthValid) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!isMatch) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await authService.resetPassword(token, newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        'Failed to reset password. The link may have expired or is invalid.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080607] text-[#FAF8F5] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-[#FF6B6B] selection:text-white">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/3 h-96 w-96 rounded-full bg-[#FF6B6B]/[0.05] blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/3 h-96 w-96 rounded-full bg-[#FAF8F5]/[0.03] blur-[180px]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Glowing border wrapper */}
        <div className="relative rounded-[26px] p-[1.5px] overflow-hidden bg-gradient-to-b from-[#FAF8F5]/25 via-[#FAF8F5]/10 to-transparent shadow-2xl shadow-black/80">
          <div className="bg-[#121214]/95 backdrop-blur-2xl rounded-[24px] p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <Link to="/" className="inline-block hover:scale-105 transition transform">
                <img
                  src="/hirxora-logo-2.jpg"
                  alt="Hirxora"
                  className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-xl shadow-[#FF6B6B]/25 mx-auto mb-2"
                />
              </Link>
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#FAF8F5]">
                {isSuccess ? 'Password Reset Complete' : 'Create New Password'}
              </h1>
              <p className="text-xs sm:text-sm text-[#E8E2D6]/80 font-sans">
                {isSuccess
                  ? 'Your account password has been updated securely.'
                  : 'Enter your new credentials below to regain access to your account.'}
              </p>
            </div>

            {!token && !isSuccess && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-4 text-xs text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-300" />
                  <span>No Reset Token Found</span>
                </div>
                <p className="text-amber-200/80 leading-relaxed">
                  This page requires a valid security token from your email. Please request a new password reset link.
                </p>
                <div className="pt-1">
                  <Link
                    to="/forgot-password"
                    className="inline-flex items-center gap-1.5 text-[#FF7E67] hover:text-[#FFA07A] font-semibold underline text-xs"
                  >
                    Request new link →
                  </Link>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 p-3.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center py-2"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs text-[#FAF8F5]/80 leading-relaxed">
                  You can now log in to your account with your newly configured password.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#ff5757] hover:to-[#f96155] text-white font-semibold text-sm transition shadow-lg shadow-[#FF6B6B]/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Sign In to Hirxora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              token && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/80">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="flex h-11 w-full rounded-xl border border-[#FAF8F5]/20 bg-[#18181B]/80 px-4 pe-10 py-2 text-sm text-[#FAF8F5] placeholder:text-[#FAF8F5]/40 focus:border-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#FAF8F5]/20 font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 end-0 flex items-center justify-center px-3 text-[#FAF8F5]/50 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/80">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="flex h-11 w-full rounded-xl border border-[#FAF8F5]/20 bg-[#18181B]/80 px-4 py-2 text-sm text-[#FAF8F5] placeholder:text-[#FAF8F5]/40 focus:border-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#FAF8F5]/20 font-sans"
                    />
                  </div>

                  {/* Password requirements indicators */}
                  <div className="space-y-1 text-[11px] font-mono pt-1">
                    <div className={`flex items-center gap-1.5 ${isLengthValid ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      <span className="text-xs">{isLengthValid ? '✓' : '•'}</span>
                      <span>At least 8 characters long</span>
                    </div>
                    {confirmPassword.length > 0 && (
                      <div className={`flex items-center gap-1.5 ${isMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <span className="text-xs">{isMatch ? '✓' : '✗'}</span>
                        <span>{isMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !isLengthValid || !isMatch}
                    className="w-full mt-2 py-3 px-6 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#ff5757] hover:to-[#f96155] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition shadow-lg shadow-[#FF6B6B]/30 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{isSubmitting ? 'Resetting Password...' : 'Save New Password'}</span>
                  </button>
                </form>
              )
            )}

            <div className="text-center pt-2 border-t border-[#FAF8F5]/10">
              <Link
                to="/login"
                className="text-xs font-mono text-neutral-400 hover:text-white transition"
              >
                ← Return to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
