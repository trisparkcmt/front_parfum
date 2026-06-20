import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';

export const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || API_BASE_URL || '').replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');

export const getBaseURL = () => {
  const url = API_ROOT;
  if (url.endsWith('/api/v1')) {
    return `${url}/`;
  }
  return `${url}/api/v1/`;
};

/** Routes where a 401 must not trigger the global refresh interceptor. */
const AUTH_PATHS_SKIP_REFRESH = /auth\/(mobile|web)\/login|auth\/registration|auth\/token\/refresh|auth\/logout/;

/**
 * Plain axios instance without interceptors.
 * Used for login and background checks so they never lock isRefreshing.
 */
export const rawApi = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Instance de base pour les requêtes vers le backend Django (qui sera prêt plus tard)
export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Cookie auth (web login) when no Bearer token in localStorage
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// Intercepteur pour ajouter le token d'authentification aux en-têtes (Mobile/Token auth)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Don't send HttpOnly cookies alongside Bearer — stale cookies can override the header
      config.withCredentials = false;
    } else {
      delete config.headers.Authorization;
      config.withCredentials = true;
    }
  }
  return config;
});

// Flag to prevent multiple refresh calls simultaneously
let isRefreshing = false;
// Queue to hold requests that are waiting for the new access token
let failedQueue: any[] = [];
// Proactive refresh timer
let refreshTimer: NodeJS.Timeout | null = null;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Proactively refresh token before expiration
const scheduleTokenRefresh = () => {
  if (typeof window === 'undefined') return;
  
  // Clear any existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  const token = localStorage.getItem('auth_token');
  if (!token) return;

  try {
    // Decode token to get expiration
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    const expiresAt = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    // Refresh 30 seconds before actual expiration (or if expires in less than 1 minute)
    const refreshBeforeExpiry = 30 * 1000; // 30 seconds
    const timeUntilRefresh = Math.max(timeUntilExpiry - refreshBeforeExpiry, 5000); // At least 5 seconds

    if (timeUntilRefresh > 0) {
      refreshTimer = setTimeout(() => {
        performProactiveRefresh();
      }, timeUntilRefresh);
    } else {
      // Token expires very soon, try to refresh immediately
      performProactiveRefresh();
    }
  } catch (error) {
    console.error('Failed to schedule token refresh:', error);
  }
};

const performProactiveRefresh = async () => {
  if (typeof window === 'undefined') return;
  if (isRefreshing) return;

  try {
    // When using HttpOnly cookies, just call the refresh endpoint
    // The backend will use the httponly refresh token automatically
    const response = await axios.post(
      `${getBaseURL()}auth/token/refresh/`,
      {},
      { withCredentials: true } // Include cookies
    );

    if (response.data.access) {
      localStorage.setItem('auth_token', response.data.access);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      // Schedule next refresh
      scheduleTokenRefresh();
    }
  } catch (error) {
    console.error('Proactive token refresh failed:', error);
    // Don't clear auth on refresh failure - let the reactive interceptor handle it
  }
};

// Intercepteur pour gérer globalement les erreurs et rafraîchir le token automatiquement
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── Network error (server unreachable / sleeping) ──────────────────────
    // error.response is undefined when there is no HTTP response at all.
    // We must NOT treat this as an auth error; just propagate it so callers
    // can display an appropriate "connexion impossible" message.
    if (!error.response) {
      return Promise.reject(error);
    }

    // ── 401 Unauthorized ───────────────────────────────────────────────────
    const requestUrl = originalRequest?.url ?? '';

    // Never refresh on public auth routes (login, registration, refresh itself).
    if (AUTH_PATHS_SKIP_REFRESH.test(requestUrl)) {
      return Promise.reject(error);
    }

    // Only attempt a token refresh on the first failure (_retry flag prevents loops).
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refresh_token');
        const hasStoredAccess = !!localStorage.getItem('auth_token');
        // Mobile: refresh via JSON body. Web: refresh via HttpOnly cookies (no localStorage tokens).
        const canRefresh = !!refreshToken || !hasStoredAccess;

        if (canRefresh) {
          // ── Another refresh is already in flight: queue this request ──────
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                originalRequest.withCredentials = false;
                return api(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          // ── Start refreshing ───────────────────────────────────────────────
          isRefreshing = true;

          try {
            // Use plain axios to avoid triggering this interceptor again
            const response = await axios.post(
              `${getBaseURL()}auth/token/refresh/`,
              refreshToken ? { refresh: refreshToken } : {},
              { withCredentials: !refreshToken }
            );

            const newAccessToken = response.data.access;

            if (newAccessToken) {
              localStorage.setItem('auth_token', newAccessToken);
              // Update refresh token if provided
              if (response.data.refresh) {
                localStorage.setItem('refresh_token', response.data.refresh);
              }
              api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              originalRequest.withCredentials = false;
            }

            processQueue(null, newAccessToken);
            isRefreshing = false;

            // Schedule next proactive refresh after successful refresh
            scheduleTokenRefresh();

            return api(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshing = false;

            // Refresh failed → full logout (refresh token in HttpOnly cookie will be cleared by backend)
            localStorage.removeItem('auth_token');
            delete api.defaults.headers.common['Authorization'];

            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login?expired=true';
            }
            return Promise.reject(refreshError);
          }
        }

        // ── No way to refresh (stale access token, no refresh token) ────────
        localStorage.removeItem('auth_token');
        delete api.defaults.headers.common['Authorization'];

        const protectedRoutes = ['/dashboard', '/profile', '/checkout'];
        const isProtected = protectedRoutes.some((r) =>
          window.location.pathname.startsWith(r)
        );
        if (isProtected) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Export function to initialize token refresh on login
export const initializeTokenRefresh = () => {
  if (typeof window !== 'undefined') {
    scheduleTokenRefresh();
  }
};
