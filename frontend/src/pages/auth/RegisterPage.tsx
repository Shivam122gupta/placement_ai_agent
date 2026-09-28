import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthUI } from '@/components/ui/auth-ui';
import { useAuth } from '@/context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AuthUI initialMode="signup" />;
};
