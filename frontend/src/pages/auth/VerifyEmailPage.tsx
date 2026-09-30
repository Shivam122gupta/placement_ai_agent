import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { authService } from '@/services/authService';
import { SEO } from '@/components/common/SEO';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setError('No email verification token was provided in the link.');
      return;
    }

    const verify = async () => {
      try {
        const msg = await authService.verifyEmail(token);
        setIsSuccess(true);
        setMessage(msg || 'Your email address has been verified successfully!');
      } catch (err: any) {
        const errMsg =
          err.response?.data?.error?.message ||
          'Email verification failed. The link may have expired or is invalid.';
        setError(errMsg);
      } finally {
        setIsLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen w-full bg-[#080607] text-[#FAF8F5] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-[#FF6B6B] selection:text-white">
      <SEO
        title="Verify Email — Hirxora"
        description="Verify your email address to activate your Hirxora account."
      />
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/3 h-96 w-96 rounded-full bg-[#FF6B6B]/[0.05] blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/3 h-96 w-96 rounded-full bg-[#FAF8F5]/[0.03] blur-[180px]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="relative rounded-[26px] p-[1.5px] overflow-hidden bg-gradient-to-b from-[#FAF8F5]/25 via-[#FAF8F5]/10 to-transparent shadow-2xl shadow-black/80">
          <div className="bg-[#121214]/95 backdrop-blur-2xl rounded-[24px] p-6 sm:p-8 space-y-6 text-center">
            <div>
              <Link to="/" className="inline-block hover:scale-105 transition transform">
                <img
                  src="/hirxora-logo-2.jpg"
                  alt="Hirxora"
                  className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-xl shadow-[#FF6B6B]/25 mx-auto mb-2"
                />
              </Link>
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#FAF8F5]">
                Email Verification
              </h1>
              <p className="text-xs sm:text-sm text-[#E8E2D6]/80 font-sans mt-1">
                Hirxora Autonomous Career Copilot
              </p>
            </div>

            {isLoading && (
              <div className="py-8 space-y-4">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#FAF8F5]/20 border-t-[#FF6B6B] mx-auto" />
                <p className="text-xs font-mono text-neutral-400 animate-pulse">
                  Verifying your security credentials...
                </p>
              </div>
            )}

            {!isLoading && isSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 py-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-white text-base">Verification Confirmed</h3>
                  <p className="text-xs text-[#E8E2D6] leading-relaxed">
                    {message} You now have complete access to autonomous job intelligence, profile grounding, and AI interviews.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#ff5757] hover:to-[#f96155] text-white font-semibold text-sm transition shadow-lg shadow-[#FF6B6B]/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Proceed to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {!isLoading && error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 py-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-xl shadow-rose-500/20">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-rose-300 text-base">Verification Issue</h3>
                  <p className="text-xs text-rose-200/80 leading-relaxed">
                    {error}
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-3 px-6 rounded-xl bg-[#18181B] hover:bg-[#202024] border border-[#FAF8F5]/20 text-white font-semibold text-sm transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            <div className="text-center pt-2 border-t border-[#FAF8F5]/10">
              <Link
                to="/"
                className="text-xs font-mono text-neutral-400 hover:text-white transition"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
