import { apiClient } from './api';
import { AuthResponseData, User } from '../types/auth';
import { StandardResponse } from '../types/common';

export const authService = {
  async register(email: string, password: string, fullName?: string): Promise<AuthResponseData> {
    const response = await apiClient.post<StandardResponse<AuthResponseData>>('/auth/register', {
      email,
      password,
      full_name: fullName,
    });
    return response.data.data!;
  },

  async login(email: string, password: string): Promise<AuthResponseData> {
    const response = await apiClient.post<StandardResponse<AuthResponseData>>('/auth/login', {
      email,
      password,
    });
    return response.data.data!;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<StandardResponse<User>>('/auth/me');
    return response.data.data!;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  async forgotPassword(email: string): Promise<string> {
    const response = await apiClient.post<StandardResponse<{ message: string }>>('/auth/forgot-password', {
      email,
    });
    return response.data.message;
  },

  async resetPassword(token: string, newPassword: string): Promise<string> {
    const response = await apiClient.post<StandardResponse<{ message: string }>>('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data.message;
  },

  async verifyEmail(token: string): Promise<string> {
    const response = await apiClient.post<StandardResponse<{ message: string }>>('/auth/verify-email', {
      token,
    });
    return response.data.message;
  },

  async resendVerification(): Promise<string> {
    const response = await apiClient.post<StandardResponse<{ message: string }>>('/auth/resend-verification');
    return response.data.message;
  },
};
