import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthUI } from '@/components/ui/auth-ui';
import { useAuth } from '@/context/AuthContext';
import { SEO } from '@/components/common/SEO';

export const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <SEO
        title="Sign In — Hirxora"
        description="Access your Hirxora career dashboard, AI resume parser, mock interview arena, and application tracking pipeline."
      />
      <AuthUI initialMode="signin" />
    </>
  );
};
