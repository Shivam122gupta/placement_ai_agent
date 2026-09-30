import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/common/SEO';

export const NotFoundPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <SEO
        title="404 Page Not Found — Hirxora"
        description="The career intelligence module or resource you are looking for does not exist or has been relocated."
      />
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center space-y-4 px-4 py-12">
        <span className="text-8xl font-mono font-bold text-white/10 select-none drop-shadow-[0_0_25px_rgba(255,255,255,0.05)]">404</span>
        <h2 className="text-3xl font-serif font-normal text-[#FAF8F5]">Page Not Found</h2>
        <p className="text-sm text-neutral-400 max-w-sm font-sans leading-relaxed">
          The career intelligence module or resource you are looking for does not exist or has been relocated.
        </p>
        <Link
          to={isAuthenticated ? "/dashboard" : "/"}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white px-5 py-2.5 text-xs font-semibold transition shadow-lg shadow-[#FF6B6B]/25 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{isAuthenticated ? "Back to Dashboard" : "Back to Home"}</span>
        </Link>
      </div>
    </>
  );
};


