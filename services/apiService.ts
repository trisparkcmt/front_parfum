/**
 * @file services/apiService.ts
 * @description Centralized API Service Layer for all Django backend endpoints.
 * Implements all endpoints from the API documentation.
 */

import { api } from './api';
import type {
  User,
  Essence,
  Product,
  Order,
  CustomComposition,
  Accessory,
} from '@/types';

// ============================================================================
// AUTHENTICATION & USER MANAGEMENT
// ============================================================================

export const authService = {
  /**
   * Web login - JWT tokens stored in HttpOnly cookies by server
   */
  webLogin: async (emailOrPhone: string, password: string): Promise<{ user: User }> => {
    try {
      const payload = emailOrPhone.includes('@')
        ? { email: emailOrPhone, password }
        : { telephone: emailOrPhone, password };
      const response = await api.post('auth/web/login/', payload);
      return response.data;
    } catch (error) {
      console.error('authService: webLogin failed', error);
      throw error;
    }
  },

  /**
   * Mobile/API login - JWT tokens returned in response body
   */
  mobileLogin: async (
    emailOrPhone: string,
    password: string
  ): Promise<{ access: string; refresh: string; user: any }> => {
    const payload = emailOrPhone.includes('@')
      ? { email: emailOrPhone, password }
      : { telephone: emailOrPhone, password };
    const response = await api.post('auth/mobile/login/', payload);
    return response.data;
  },

  /**
   * Get current user profile with favorites, carts, and orders
   */
  getMe: async (): Promise<User> => {
    const response = await api.get('auth/me/');
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (data: {
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    telephone?: string;
  }) => {
    const response = await api.post('auth/registration/', data);
    return response.data;
  },

  /**
   * Logout current user
   */
  logout: async () => {
    const response = await api.post('auth/logout/');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    telephone?: string;
    current_password?: string;
  }) => {
    const response = await api.patch('auth/me/', data);
    return response.data;
  },

  /**
   * Change email with verification
   */
  changeEmail: async (email: string, current_password: string) => {
    const response = await api.post('auth/me/change-email/', {
      email,
      current_password,
    });
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (
    oldPassword: string,
    newPassword: string,
    newPasswordConfirm: string
  ) => {
    const response = await api.post('auth/password/change/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
    return response.data;
  },
};

// ============================================================================
// SHOP & CATALOG
// ============================================================================

export const shopService = {
  /**
   * Get paginated list of perfumes with filters
   */
  getPerfumes: async (params?: {
    search?: string;
    prix_min?: number;
    prix_max?: number;
    famille_olfactive?: string;
    genre?: string;
    est_nouveau?: boolean;
    est_bestseller?: boolean;
    ordering?: string;
    page?: number;
  }) => {
    const response = await api.get('shop/parfums/', { params });
    return response.data;
  },

  /**
   * Get perfume details by slug
   */
  getPerfumeBySlug: async (slug: string): Promise<Product> => {
    const response = await api.get(`shop/parfums/${slug}/`);
    return response.data;
  },

  /**
   * Add/remove perfume from favorites
   */
  togglePerfumeFavorite: async (slug: string) => {
    const response = await api.post(`shop/parfums/${slug}/favori/`);
    return response.data;
  },

  /**
   * Get paginated list of accessories with filters
   */
  getAccessories: async (params?: {
    type_accessoire?: number;
    couleur?: string;
    matiere?: string;
    taille?: string;
    prix_min?: number;
    prix_max?: number;
    en_stock?: boolean;
    page?: number;
  }) => {
    const response = await api.get('shop/accessoires/', { params });
    return response.data;
  },

  /**
   * Get accessory details by slug
   */
  getAccessoryBySlug: async (slug: string): Promise<Accessory> => {
    const response = await api.get(`shop/accessoires/${slug}/`);
    return response.data;
  },

  /**
   * Add/remove accessory from favorites
   */
  toggleAccessoryFavorite: async (slug: string) => {
    const response = await api.post(`shop/accessoires/${slug}/favori/`);
    return response.data;
  },

  /**
   * Get list of available bottles for DIY creation
   */
  getBottles: async () => {
    const response = await api.get('shop/flacons/');
    return response.data;
  },

  /**
   * Get user's favorites
   */
  getFavorites: async () => {
    const response = await api.get('shop/favoris/');
    return response.data;
  },
};

// ============================================================================
// LABORATORY & DIY
// ============================================================================

export const labService = {
  /**
   * Get list of essences with filters
   */
  getEssences: async (params?: {
    famille_olfactive?: string;
    genre?: string;
    intensite?: string;
    saison?: string;
    prix_min?: number;
    prix_max?: number;
  }): Promise<Essence[]> => {
    const response = await api.get('lab/essences/', { params });
    return response.data.resultats || response.data.results || response.data;
  },

  /**
   * Get list of base ingredients
   */
  getIngredients: async (): Promise<Essence[]> => {
    const response = await api.get('/lab/ingredients/');
    return response.data.resultats || response.data.results || response.data;
  },

  /**
   * Get user's custom perfume compositions
   */
  getCustomPerfumes: async () => {
    const response = await api.get('/lab/parfums-perso/');
    return response.data;
  },

  /**
   * Create custom perfume with formulas
   */
  createCustomPerfume: async (data: {
    nom: string;
    description?: string;
    flacon: number;
    lignes: Array<{
      essence_catalogue?: number;
      essence_personnalisee?: number;
      quantite_ml: number;
    }>;
  }): Promise<CustomComposition> => {
    const response = await api.post('lab/parfums-perso/', data);
    return response.data;
  },

  /**
   * Recalculate prices for custom perfume
   */
  recalculateCustomPerfume: async (id: number) => {
    const response = await api.post(`lab/parfums-perso/${id}/recalculer/`);
    return response.data;
  },

  /**
   * Create custom essence from raw ingredients
   */
  createCustomEssence: async (data: {
    nom: string;
    lignes: Array<{
      ingredient: number;
      quantite_ml: number;
    }>;
  }) => {
    const response = await api.post('lab/essences-perso/', data);
    return response.data;
  },

  /**
   * Get AI recommendation based on prompt
   */
  getAIRecommendation: async (prompt: string) => {
    const response = await api.post('lab/ia-recommandation/', { prompt });
    return response.data;
  },
};

// ============================================================================
// PARTNER & PROVIDER SPACE
// ============================================================================

export const partnerService = {
  /**
   * Apply to become a partner/provider
   */
  applyAsPartner: async () => {
    const response = await api.post('/auth/prestataire/apply/');
    return response.data;
  },

  /**
   * Get partner dashboard stats and earnings
   */
  getPartnerDashboard: async () => {
    const response = await api.get('/auth/prestataire/dashboard/');
    return response.data;
  },

  /**
   * Get partner earnings history
   */
  getPartnerHistory: async (params?: { type_operation?: string }) => {
    const response = await api.get('/auth/prestataire/historique/', { params });
    return response.data;
  },

  /**
   * Get partner payout requests
   */
  getPartnerPayouts: async () => {
    const response = await api.get('/auth/prestataire/payouts/');
    return response.data;
  },
};

// ============================================================================
// DELIVERY SPACE
// ============================================================================

export const deliveryService = {
  /**
   * Get delivery driver dashboard
   */
  getDeliveryDashboard: async () => {
    const response = await api.get('/auth/livreur/dashboard/');
    return response.data;
  },

  /**
   * Get assigned deliveries
   */
  getDeliveries: async (params?: { statut_livraison?: string }) => {
    const response = await api.get('/auth/livreur/livraisons/', { params });
    return response.data;
  },

  /**
   * Update delivery status
   */
  updateDeliveryStatus: async (
    id: number,
    data: { action: 'livrer' | 'echouer'; motif?: string }
  ) => {
    const response = await api.post(`/auth/livreur/livraisons/${id}/statut/`, data);
    return response.data;
  },
};

// ============================================================================
// ADMIN OPERATIONS
// ============================================================================

export const adminService = {
  /**
   * Get paginated list of all users
   */
  getUsers: async (params?: { search?: string; page?: number }) => {
    const response = await api.get('/auth/admin/users/', { params });
    return response.data;
  },

  /**
   * Toggle user active status
   */
  toggleUserStatus: async (userId: number) => {
    const response = await api.patch(
      `/auth/admin/users/${userId}/toggle-status/`
    );
    return response.data;
  },

  /**
   * Get all providers
   */
  getProviders: async (params?: { statut?: string; page?: number }) => {
    const response = await api.get('/auth/admin/prestataires/', { params });
    return response.data;
  },

  /**
   * Validate provider application
   */
  validateProvider: async (
    providerId: number,
    data: {
      taux_commission: number;
      reduction_client_pourcentage: number;
    }
  ) => {
    const response = await api.patch(
      `/auth/admin/prestataires/validate/${providerId}/`,
      data
    );
    return response.data;
  },

  /**
   * Update provider details
   */
  updateProvider: async (providerId: number, data: any) => {
    const response = await api.patch(
      `/auth/admin/prestataires/${providerId}/update/`,
      data
    );
    return response.data;
  },

  /**
   * Initiate provider payout via Monetbil
   */
  initiateProviderPayout: async (providerId: number, montant: number) => {
    const response = await api.post(
      `/auth/admin/prestataires/${providerId}/payout/`,
      { montant }
    );
    return response.data;
  },

  /**
   * Get all delivery drivers
   */
  getDeliveryDrivers: async () => {
    const response = await api.get('/auth/admin/livreurs/');
    return response.data;
  },

  /**
   * Promote user to delivery driver
   */
  promoteToDriver: async (userId: number) => {
    const response = await api.post('/auth/admin/livreurs/promote/', {
      user_id: userId,
    });
    return response.data;
  },

  /**
   * Assign delivery driver to order
   */
  assignDriverToOrder: async (orderId: number, driverId: number) => {
    const response = await api.post(
      `/auth/admin/commandes/${orderId}/affecter-livreur/`,
      { livreur_id: driverId }
    );
    return response.data;
  },
};

// ============================================================================
// NOTIFICATIONS & REQUESTS
// ============================================================================

export const notificationService = {
  /**
   * Get admin notifications
   */
  getNotifications: async () => {
    const response = await api.get('/utilisateur/notifications/');
    return response.data;
  },

  /**
   * Get pending provider requests
   */
  getProviderRequests: async () => {
    const response = await api.get('/utilisateur/prestataire-requests/');
    return response.data;
  },
};

// ============================================================================
// ORDERS & CART (Currently disabled but endpoints defined)
// ============================================================================

export const orderService = {
  /**
   * Note: Order endpoints are currently disabled in the backend.
   * This is a placeholder for when they are re-enabled.
   */
  note: 'Order endpoints are defined in api/v1/urls/order_urls.py but currently disabled',
};
