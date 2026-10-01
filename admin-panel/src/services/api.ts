const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // Unauthenticated or unauthorized
      if (!endpoint.includes('/auth/login')) {
        removeAuthToken();
        window.location.href = '/login';
      }
    }
    throw new Error(data.message || data.detail || 'API request failed');
  }

  return data;
}
