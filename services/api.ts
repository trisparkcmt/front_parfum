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
    'ngrok-skip-browser-warning': 'true',
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

// Intercepteur pour gérer globalement les erreurs (ex: token expiré)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Nettoyer le token invalide du localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }

      // Rediriger vers la page de login en cas de session expirée
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
