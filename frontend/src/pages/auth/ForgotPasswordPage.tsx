import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthUI } from '@/components/ui/auth-ui';
import { useAuth } from '@/context/AuthContext';
import { SEO } from '@/components/common/SEO';

export const ForgotPasswordPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <SEO
        title="Forgot Password — Hirxora"
        description="Reset your Hirxora account password securely."
      />
      <AuthUI initialMode="forgot" />
    </>
  );
};
