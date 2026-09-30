import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthUI } from '@/components/ui/auth-ui';
import { useAuth } from '@/context/AuthContext';
import { SEO } from '@/components/common/SEO';

export const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <SEO
        title="Create Account — Hirxora"
        description="Join Hirxora to unlock autonomous resume parsing, ATS scoring, JD requirement matching, and interactive AI mock interviews."
      />
      <AuthUI initialMode="signup" />
    </>
  );
};
