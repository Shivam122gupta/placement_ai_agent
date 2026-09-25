import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-extrabold text-brand-500">404</h1>
      <h2 className="mt-4 text-2xl font-bold text-white">Page Not Found</h2>
      <p className="mt-2 text-sm text-gray-400">The career module or resource you are looking for does not exist.</p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-brand-600 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Dashboard</span>
      </Link>
    </div>
  );
};
