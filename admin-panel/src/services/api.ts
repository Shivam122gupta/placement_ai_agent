export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('admin_access_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('admin_access_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('admin_access_token');
}

export async function adminFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');
  headers.set('X-Requested-With', 'XMLHttpRequest');

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      if (!endpoint.includes('/auth/login')) {
        removeAuthToken();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    throw new Error(data.message || data.detail || 'API request failed');
  }

  return data;
}
