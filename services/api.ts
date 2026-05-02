import axios from 'axios';

// Instance de base pour les requêtes vers le backend Django (qui sera prêt plus tard)
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Pour que Django puisse envoyer et lire le cookie HttpOnly JWT
});

// Intercepteur pour gérer globalement les erreurs (ex: token expiré)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Rediriger vers la page de login en cas de session expirée
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
