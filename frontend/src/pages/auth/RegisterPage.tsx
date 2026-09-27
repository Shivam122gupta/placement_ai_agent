import React from 'react';
import { AuthUI } from '@/components/ui/auth-ui';

export const RegisterPage: React.FC = () => {
  return <AuthUI initialMode="signup" />;
};
