const rawBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').trim();

export const BASE_URL = rawBaseUrl.endsWith('/api/v1')
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/+$/, '')}/api/v1`;

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && typeof payload.exp === 'number') {
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp <= currentTime;
    }
    return false;
  } catch {
    return true; // Malformed token treated as expired
  }
}

export function getAuthToken(): string | null {
  const token = localStorage.getItem('admin_access_token');
  if (!token) return null;
  
  if (isTokenExpired(token)) {
    removeAuthToken();
    return null;
  }
  return token;
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

  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${formattedEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '15';
      const msg = data.error?.message || data.message || `Rate limit exceeded. System protection active. Please wait ${retryAfter} seconds before trying again.`;
      throw new Error(msg);
    }
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
