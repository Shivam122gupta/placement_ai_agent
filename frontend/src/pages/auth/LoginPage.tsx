import React from 'react';
import { AuthUI } from '@/components/ui/auth-ui';

export const LoginPage: React.FC = () => {
  return <AuthUI initialMode="signin" />;
};
