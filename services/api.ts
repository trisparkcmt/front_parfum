import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';

export const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || API_BASE_URL || '').replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');

const getBaseURL = () => {
  const url = API_ROOT;
  if (url.endsWith('/api/v1')) {
    return `${url}/`;
  }
  return `${url}/api/v1/`;
};

// Instance de base pour les requêtes vers le backend Django (qui sera prêt plus tard)
export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Pour que Django puisse envoyer et lire le cookie HttpOnly JWT
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// Intercepteur pour ajouter le token d'authentification aux en-têtes (Fallback pour Mobile/Token auth)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Flag to prevent multiple refresh calls simultaneously
let isRefreshing = false;
// Queue to hold requests that are waiting for the new access token
let failedQueue: any[] = [];

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

// Intercepteur pour gérer globalement les erreurs et rafraîchir le token automatiquement
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
          if (isRefreshing) {
            // Wait in queue for token refresh to finish
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          isRefreshing = true;

          try {
            // Request fresh access token using refresh token
            // We use standard axios instead of api to avoid infinite interceptor loops
            const response = await axios.post(`${getBaseURL()}auth/token/refresh/`, {
              refresh: refreshToken,
            });

            const newAccessToken = response.data.access;

            // Save new token
            localStorage.setItem('auth_token', newAccessToken);

            // Update auth header for api instance & original request
            api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            processQueue(null, newAccessToken);
            isRefreshing = false;

            return api(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshing = false;

            // Refresh token failed/expired too -> Log out user
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            
            // Redirect to login page if we aren't already there
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login?expired=true';
            }
            return Promise.reject(refreshError);
          }
        }
      }

      // No refresh token available, clear invalid auth token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
