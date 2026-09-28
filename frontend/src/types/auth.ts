export interface User {
  id: string;
  email: string;
  role?: 'user' | 'admin' | string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponseData {
  user: User;
  tokens: TokenData;
}
