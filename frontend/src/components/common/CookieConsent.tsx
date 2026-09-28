import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'hirxora_cookie_consent_v1';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay slightly for smooth page entry
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'essential_only');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)]"
        >
          <div className="bg-[#121214]/95 border border-[#FAF8F5]/20 backdrop-blur-2xl rounded-2xl p-5 shadow-2xl shadow-black/80 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FF6B6B]/15 border border-[#FF6B6B]/30 flex items-center justify-center text-[#FF7E67] shrink-0">
                  <Cookie className="w-4 h-4" />
                </div>
                <h4 className="font-serif text-sm font-normal text-[#FAF8F5]">Privacy & Cookies</h4>
              </div>
              <button
                onClick={handleDecline}
                className="text-[#FAF8F5]/40 hover:text-white transition p-1 cursor-pointer"
                aria-label="Close cookie banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#E8E2D6]/80 font-sans leading-relaxed">
              We use essential cookies and session storage to securely authenticate your session, maintain your resume analysis state, and optimize platform speed. Read our{' '}
              <Link to="/privacy" className="text-[#FF7E67] hover:underline">
                Privacy Policy
              </Link>.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleAccept}
                className="flex-1 py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#ff5757] hover:to-[#f96155] text-white text-xs font-semibold transition shadow-md shadow-[#FF6B6B]/25 cursor-pointer"
              >
                Accept All
              </button>
              <button
                onClick={handleDecline}
                className="py-2 px-3.5 rounded-xl bg-[#18181B] hover:bg-[#222226] border border-[#FAF8F5]/15 text-[#FAF8F5]/80 text-xs font-medium transition cursor-pointer"
              >
                Essential Only
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
