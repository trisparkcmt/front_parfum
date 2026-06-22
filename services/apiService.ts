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
    } catch (error: any) {
      console.error('authService: webLogin failed. Error details:', error.response?.data || error.message);
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

  /**
   * Verify email verification key
   */
  verifyEmail: async (key: string) => {
    const response = await api.post('auth/registration/verify-email/', { key });
    return response.data;
  },

  /**
   * Resend email verification link
   */
  resendVerificationEmail: async (email: string) => {
    const response = await api.post('auth/registration/resend-email/', { email });
    return response.data;
  },

  /**
   * Request password reset link
   */
  requestPasswordReset: async (email: string) => {
    const response = await api.post('auth/password/reset/', { email });
    return response.data;
  },

  /**
   * Confirm password reset with token
   */
  confirmPasswordReset: async (data: {
    uid: string;
    token: string;
    new_password: string;
    new_password_confirm: string;
  }) => {
    const response = await api.post('auth/password/reset/confirm/', data);
    return response.data;
  },

  /**
   * Refresh JWT token
   */
  refreshToken: async (refresh: string) => {
    const response = await api.post('auth/token/refresh/', { refresh });
    return response.data;
  },

  /**
   * Verify JWT token validity
   */
  verifyToken: async (token: string) => {
    const response = await api.post('auth/token/verify/', { token });
    return response.data;
  },

  /**
   * Google OAuth2 Login
   */
  googleLogin: async (accessToken: string, code: string) => {
    const response = await api.post('auth/google/', {
      access_token: accessToken,
      code,
    });
    return response.data;
  },

  /**
   * Get direct user details (email, first_name, last_name)
   */
  getUserDetails: async () => {
    const response = await api.get('auth/user/');
    return response.data;
  },

  /**
   * Update direct user details
   */
  updateUserDetails: async (data: {
    first_name?: string;
    last_name?: string;
    email?: string;
  }) => {
    const response = await api.patch('auth/user/', data);
    return response.data;
  },

  /**
   * Alias for getMe() - Get current user profile
   */
  getCurrentUser: async () => {
    const response = await api.get('auth/me/');
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
    marque?: string;
    prix_min?: number;
    prix_max?: number;
    famille_olfactive?: string;
    genre?: string;
    est_nouveau?: boolean;
    est_bestseller?: boolean;
    ordering?: string;
    page?: number;
    limit?: number;
    contenance_ml?: number;
    humeur?: string;
    intensite?: string;
    occasion?: string;
    saison?: string;
    tags?: string;
  }) => {
    const response = await api.get('shop/parfums/', { params });
    return response.data;
  },

  /**
   * Create new perfume (Admin)
   */
  createPerfume: async (data: any) => {
    const response = await api.post('shop/parfums/', data);
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
   * Update perfume details (Admin)
   */
  updatePerfume: async (slug: string, data: any) => {
    const response = await api.patch(`shop/parfums/${slug}/`, data);
    return response.data;
  },

  /**
   * Delete perfume (Admin)
   */
  deletePerfume: async (slug: string) => {
    const response = await api.delete(`shop/parfums/${slug}/`);
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
   * Get historical bestsellers perfumes (Top 20)
   */
  getPerfumeBestsellers: async () => {
    const response = await api.get('shop/parfums/bestsellers/');
    return response.data;
  },

  /**
   * Get hotsellers perfumes of current month (Top 10)
   */
  getPerfumeHotsellers: async () => {
    const response = await api.get('shop/parfums/hotsellers/');
    return response.data;
  },

  /**
   * Get paginated list of accessories with filters
   */
  getAccessories: async (params?: {
    type_accessoire?: number;
    type_nom?: string;
    marque?: string;
    couleur?: string;
    matiere?: string;
    taille?: string;
    prix_min?: number;
    prix_max?: number;
    en_stock?: boolean;
    page?: number;
    search?: string;
    ordering?: string;
  }) => {
    const response = await api.get('shop/accessoires/', { params });
    return response.data;
  },

  /**
   * Create new accessory (Admin)
   */
  createAccessory: async (data: any) => {
    const response = await api.post('shop/accessoires/', data);
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
   * Update accessory details (Admin)
   */
  updateAccessory: async (slug: string, data: any) => {
    const response = await api.patch(`shop/accessoires/${slug}/`, data);
    return response.data;
  },

  /**
   * Delete accessory (Admin)
   */
  deleteAccessory: async (slug: string) => {
    const response = await api.delete(`shop/accessoires/${slug}/`);
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
   * Get historical bestsellers accessories
   */
  getAccessoryBestsellers: async () => {
    const response = await api.get('shop/accessoires/bestsellers/');
    return response.data;
  },

  /**
   * Get hotsellers accessories of current month
   */
  getAccessoryHotsellers: async () => {
    const response = await api.get('shop/accessoires/hotsellers/');
    return response.data;
  },

  /**
   * Get list of available bottles for DIY creation
   */
  getBottles: async (params?: {
    type_flacon?: number;
    type_nom?: string;
    contenance_ml?: number;
    contenance_min?: number;
    contenance_max?: number;
    stock_min?: number;
    stock_max?: number;
    couleur?: string;
    en_stock?: boolean;
    matiere?: string;
    search?: string;
    ordering?: string;
    page?: number;
  }) => {
    const response = await api.get('shop/flacons/', { params });
    return response.data;
  },

  /**
   * Create new bottle (Admin)
   */
  createBottle: async (data: any) => {
    const response = await api.post('shop/flacons/', data);
    return response.data;
  },

  /**
   * Get bottle details by ID
   */
  getBottleById: async (id: number) => {
    const response = await api.get(`shop/flacons/${id}/`);
    return response.data;
  },

  /**
   * Update bottle details (Admin)
   */
  updateBottle: async (id: number, data: any) => {
    const response = await api.patch(`shop/flacons/${id}/`, data);
    return response.data;
  },

  /**
   * Delete bottle (Admin)
   */
  deleteBottle: async (id: number) => {
    const response = await api.delete(`shop/flacons/${id}/`);
    return response.data;
  },

  /**
   * Get user's favorites list
   */
  getFavorites: async () => {
    const response = await api.get('shop/favoris/');
    return response.data;
  },

  /**
   * Add a product to favorites by ID
   */
  addFavorite: async (data: { parfum?: number; accessoire?: number }) => {
    const response = await api.post('shop/favoris/', data);
    return response.data;
  },

  /**
   * Delete a favorite by ID
   */
  deleteFavorite: async (id: number) => {
    const response = await api.delete(`shop/favoris/${id}/`);
    return response.data;
  },

  // ==========================================
  // CLASSIFICATIONS & METADATA
  // ==========================================

  /**
   * Get all classification tags
   */
  getTags: async () => {
    const response = await api.get('shop/tags/');
    return response.data;
  },

  /**
   * Create new tag (Admin)
   */
  createTag: async (data: any) => {
    const response = await api.post('shop/tags/', data);
    return response.data;
  },

  /**
   * Get tag details by slug
   */
  getTagBySlug: async (slug: string) => {
    const response = await api.get(`shop/tags/${slug}/`);
    return response.data;
  },

  /**
   * Update tag (Admin)
   */
  updateTag: async (slug: string, data: any) => {
    const response = await api.patch(`shop/tags/${slug}/`, data);
    return response.data;
  },

  /**
   * Delete tag (Admin)
   */
  deleteTag: async (slug: string) => {
    const response = await api.delete(`shop/tags/${slug}/`);
    return response.data;
  },

  /**
   * Get perfume categories
   */
  getPerfumeCategories: async () => {
    const response = await api.get('shop/categories-parfum/');
    return response.data;
  },

  /**
   * Create perfume category (Admin)
   */
  createPerfumeCategory: async (data: any) => {
    const response = await api.post('shop/categories-parfum/', data);
    return response.data;
  },

  /**
   * Get perfume category by ID
   */
  getPerfumeCategoryById: async (id: number) => {
    const response = await api.get(`shop/categories-parfum/${id}/`);
    return response.data;
  },

  /**
   * Update perfume category (Admin)
   */
  updatePerfumeCategory: async (id: number, data: any) => {
    const response = await api.patch(`shop/categories-parfum/${id}/`, data);
    return response.data;
  },

  /**
   * Delete perfume category (Admin)
   */
  deletePerfumeCategory: async (id: number) => {
    const response = await api.delete(`shop/categories-parfum/${id}/`);
    return response.data;
  },

  /**
   * Get accessory types
   */
  getAccessoryTypes: async () => {
    const response = await api.get('shop/types-accessoire/');
    return response.data;
  },

  /**
   * Create accessory type (Admin)
   */
  createAccessoryType: async (data: any) => {
    const response = await api.post('shop/types-accessoire/', data);
    return response.data;
  },

  /**
   * Get accessory type by ID
   */
  getAccessoryTypeById: async (id: number) => {
    const response = await api.get(`shop/types-accessoire/${id}/`);
    return response.data;
  },

  /**
   * Update accessory type (Admin)
   */
  updateAccessoryType: async (id: number, data: any) => {
    const response = await api.patch(`shop/types-accessoire/${id}/`, data);
    return response.data;
  },

  /**
   * Delete accessory type (Admin)
   */
  deleteAccessoryType: async (id: number) => {
    const response = await api.delete(`shop/types-accessoire/${id}/`);
    return response.data;
  },

  /**
   * Get bottle types
   */
  getBottleTypes: async () => {
    const response = await api.get('shop/types-flacon/');
    return response.data;
  },

  /**
   * Create bottle type (Admin)
   */
  createBottleType: async (data: any) => {
    const response = await api.post('shop/types-flacon/', data);
    return response.data;
  },

  /**
   * Get bottle type by ID
   */
  getBottleTypeById: async (id: number) => {
    const response = await api.get(`shop/types-flacon/${id}/`);
    return response.data;
  },

  /**
   * Update bottle type (Admin)
   */
  updateBottleType: async (id: number, data: any) => {
    const response = await api.patch(`shop/types-flacon/${id}/`, data);
    return response.data;
  },

  /**
   * Delete bottle type (Admin)
   */
  deleteBottleType: async (id: number) => {
    const response = await api.delete(`shop/types-flacon/${id}/`);
    return response.data;
  },

  /**
   * Get finished essences
   */
  getFinishedEssences: async (params?: {
    essence?: number;
    taille_ml?: number;
    page?: number;
    search?: string;
    ordering?: string;
  }) => {
    const response = await api.get('shop/produits-essence/', { params });
    return response.data;
  },

  /**
   * Create finished essence (Admin)
   */
  createFinishedEssence: async (data: any) => {
    const response = await api.post('shop/produits-essence/', data);
    return response.data;
  },

  /**
   * Get finished essence by ID
   */
  getFinishedEssenceById: async (id: number) => {
    const response = await api.get(`shop/produits-essence/${id}/`);
    return response.data;
  },

  /**
   * Update finished essence (Admin)
   */
  updateFinishedEssence: async (id: number, data: any) => {
    const response = await api.patch(`shop/produits-essence/${id}/`, data);
    return response.data;
  },

  /**
   * Delete finished essence (Admin)
   */
  deleteFinishedEssence: async (id: number) => {
    const response = await api.delete(`shop/produits-essence/${id}/`);
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
    search?: string;
    famille_olfactive?: string;
    humeur?: string;
    saison?: string;
    occasion?: string;
    signe_astrologique?: string;
    moment_journee?: string;
    genre?: string;
    intensite?: string;
    prix_min?: number;
    prix_max?: number;
    stock_min?: number;
    page?: number;
    ordering?: string;
  }): Promise<Essence[]> => {
    const response = await api.get('lab/essences/', { params });
    return response.data.resultats || response.data.results || response.data;
  },

  /**
   * Get list of base ingredients
   */
  getIngredients: async (params?: {
    search?: string;
    prix_min?: number;
    prix_max?: number;
    stock_min?: number;
    page?: number;
    ordering?: string;
  }): Promise<Essence[]> => {
    const response = await api.get('lab/ingredients/', { params });
    return response.data.resultats || response.data.results || response.data;
  },

  /**
   * Get user's custom perfume compositions
   */
  getCustomPerfumes: async () => {
    const response = await api.get('lab/parfums-perso/');
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

  /**
   * Create a new essence (Admin)
   */
  createEssence: async (data: any) => {
    const response = await api.post('lab/essences/', data);
    return response.data;
  },

  /**
   * Update an essence (Admin)
   */
  updateEssence: async (id: number, data: any) => {
    const response = await api.patch(`lab/essences/${id}/`, data);
    return response.data;
  },

  /**
   * Delete an essence (Admin)
   */
  deleteEssence: async (id: number) => {
    const response = await api.delete(`lab/essences/${id}/`);
    return response.data;
  },

  /**
   * Create base ingredient (Admin)
   */
  createIngredient: async (data: any) => {
    const response = await api.post('lab/ingredients/', data);
    return response.data;
  },

  /**
   * Update base ingredient (Admin)
   */
  updateIngredient: async (id: number, data: any) => {
    const response = await api.patch(`lab/ingredients/${id}/`, data);
    return response.data;
  },

  /**
   * Delete base ingredient (Admin)
   */
  deleteIngredient: async (id: number) => {
    const response = await api.delete(`lab/ingredients/${id}/`);
    return response.data;
  },

  /**
   * Get all essence lots (Admin / Laborantin)
   */
  getLotsEssence: async (params?: { essence?: number; actif?: boolean; page?: number }) => {
    const response = await api.get('lab/lots-essence/', { params });
    return response.data;
  },

  /**
   * Create an essence lot (Admin / Laborantin)
   */
  createLotEssence: async (data: any) => {
    const response = await api.post('lab/lots-essence/', data);
    return response.data;
  },

  /**
   * Update an essence lot (Admin / Laborantin)
   */
  updateLotEssence: async (id: number, data: any) => {
    const response = await api.patch(`lab/lots-essence/${id}/`, data);
    return response.data;
  },

  /**
   * Delete an essence lot (Admin / Laborantin)
   */
  deleteLotEssence: async (id: number) => {
    const response = await api.delete(`lab/lots-essence/${id}/`);
    return response.data;
  },

  /**
   * Get available labo inventory list (Admin / Laborantin / Serveuse)
   */
  getLaboInventoryAvailable: async () => {
    const response = await api.get('lab/labo/essences/disponible/');
    return response.data;
  },

  /**
   * Get labo inventory item detail by slug (Admin / Laborantin / Serveuse)
   */
  getLaboInventoryDetail: async (slug: string) => {
    const response = await api.get(`lab/labo/essences/${slug}/detail/`);
    return response.data;
  },

  /**
   * Get labo inventory list (Admin / Laborantin)
   */
  getLaboInventory: async () => {
    const response = await api.get('lab/labo/essences/');
    return response.data;
  },

  /**
   * Get labo inventory item detail (Admin / Laborantin)
   */
  getLaboInventoryById: async (id: number) => {
    const response = await api.get(`lab/labo/essences/${id}/`);
    return response.data;
  },

  /**
   * Update labo inventory item (Admin / Laborantin)
   */
  updateLaboInventory: async (id: number, data: any) => {
    const response = await api.patch(`lab/labo/essences/${id}/`, data);
    return response.data;
  },

  /**
   * Delete labo inventory item (Admin / Laborantin)
   */
  deleteLaboInventory: async (id: number) => {
    const response = await api.delete(`lab/labo/essences/${id}/`);
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
    const response = await api.post('auth/prestataire/apply/');
    return response.data;
  },

  /**
   * Get partner dashboard stats and earnings
   */
  getPartnerDashboard: async () => {
    const response = await api.get('auth/prestataire/dashboard/');
    return response.data;
  },

  /**
   * Get partner earnings history
   */
  getPartnerHistory: async (params?: { type_operation?: string }) => {
    const response = await api.get('auth/prestataire/historique/', { params });
    return response.data;
  },

  /**
   * Get partner payout requests
   */
  getPartnerPayouts: async () => {
    const response = await api.get('auth/prestataire/payouts/');
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
    const response = await api.get('auth/livreur/dashboard/');
    return response.data;
  },

  /**
   * Get assigned deliveries
   */
  getDeliveries: async (params?: { statut_livraison?: string }) => {
    const response = await api.get('auth/livreur/livraisons/', { params });
    return response.data;
  },

  /**
   * Update delivery status
   */
  updateDeliveryStatus: async (
    id: number,
    data: { action: 'livrer' | 'echouer'; motif?: string }
  ) => {
    const response = await api.post(`auth/livreur/livraisons/${id}/statut/`, data);
    return response.data;
  },
};

// ============================================================================
// ADMIN OPERATIONS
// ============================================================================

export const adminService = {
  /**
   * Post FormData to the given endpoint with proper headers (for image uploads).
   */
  postFormData: async (url: string, data: FormData) => {
    const response = await api.post(url, data, {
      headers: {
        'Content-Type': 'multipart/form-data', // Γ£à overrides the default JSON header
      },
    });
    return response.data;
  },

  /**
   * Patch FormData to the given endpoint (for image uploads in updates).
   */
   patchFormData: async (url: string, data: FormData) => {
    const response = await api.patch(url, data, {
      headers: {
        'Content-Type': 'multipart/form-data', // Γ£à overrides the default JSON header
      },
    });
    return response.data;
  },
  /**
   * Get paginated list of all users
   */
  getUsers: async (params?: { search?: string; page?: number }) => {
    const response = await api.get('auth/admin/users/', { params });
    return response.data;
  },

  /**
   * Toggle user active status
   */
  toggleUserStatus: async (userId: number) => {
    const response = await api.patch(`auth/admin/users/${userId}/toggle-status/`);
    return response.data;
  },

  /**
   * Get all providers
   */
  getProviders: async (params?: { statut?: string; page?: number }) => {
    const response = await api.get('auth/admin/prestataires/', { params });
    return response.data;
  },

  /**
   * Get specific provider dashboard stats (Admin view)
   */
  getProviderDashboard: async (providerId: string) => {
    const response = await api.get('auth/prestataire/dashboard/', {
      params: { prestataire_id: providerId },
    });
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
      `auth/admin/prestataires/validate/${providerId}/`,
      data
    );
    return response.data;
  },

  /**
   * Update provider details
   */
  updateProvider: async (providerId: number, data: any) => {
    const response = await api.patch(
      `auth/admin/prestataires/${providerId}/update/`,
      data
    );
    return response.data;
  },

  /**
   * Initiate provider payout via Monetbil
   */
  initiateProviderPayout: async (providerId: number, montant: number) => {
    const response = await api.post(
      `auth/admin/prestataires/${providerId}/payout/`,
      { montant }
    );
    return response.data;
  },

  /**
   * Get all delivery drivers
   */
  getDeliveryDrivers: async () => {
    const response = await api.get('auth/admin/livreurs/');
    return response.data;
  },

  /**
   * Promote user to delivery driver
   */
  promoteToDriver: async (userId: number) => {
    const response = await api.post('auth/admin/livreurs/promote/', {
      user_id: userId,
    });
    return response.data;
  },

  /**
   * Delete delivery driver
   */
  deleteDeliveryDriver: async (id: number) => {
    const response = await api.delete(`auth/admin/livreurs/${id}/delete/`);
    return response.data;
  },

  /**
   * Get all serveuses
   */
  getServeuses: async (params?: { page?: number }) => {
    const response = await api.get('auth/admin/serveuses/', { params });
    return response.data;
  },

  /**
   * Promote user to serveuse
   */
  promoteToServeuse: async (userId: number) => {
    const response = await api.post('auth/admin/serveuses/promote/', {
      user_id: userId,
    });
    return response.data;
  },

  /**
   * Update serveuse status
   */
  updateServeuse: async (id: number, data: { actif: boolean }) => {
    const response = await api.patch(`auth/admin/serveuses/${id}/`, data);
    return response.data;
  },

  /**
   * Delete serveuse
   */
  deleteServeuse: async (id: number) => {
    const response = await api.delete(`auth/admin/serveuses/${id}/delete/`);
    return response.data;
  },

  /**
   * Assign delivery driver to order
   */
  assignDriverToOrder: async (orderId: number, driverId: number) => {
    const response = await api.post(
      `auth/admin/commandes/${orderId}/affecter-livreur/`,
      { livreur_id: driverId }
    );
    return response.data;
  },

  /**
   * Get all payout transactions (Admin)
   */
  getPayouts: async () => {
    const response = await api.get('auth/admin/payouts/');
    return response.data;
  },

  /**
   * Get global platform statistics (Admin)
   */
  getGlobalStats: async () => {
    const response = await api.get('auth/admin/stats/global/');
    return response.data;
  },

  /**
   * Update delivery driver status (Admin)
   */
  updateDeliveryDriver: async (id: number, data: { statut: string }) => {
    const response = await api.patch(`auth/admin/livreurs/${id}/`, data);
    return response.data;
  },

  /**
   * Get tracking for all deliveries (Admin)
   */
  getDeliveries: async () => {
    const response = await api.get('auth/admin/livraisons/');
    return response.data;
  },

  /**
   * Get all orders for admin/serveuse management
   */
  getOrdersForAdmin: async (params?: {
    statut?: string;
    statut_livraison?: string;
    statut_paiement?: string;
    search?: string;
    page?: number;
  }) => {
    const response = await api.get('orders/commandes/', { params });
    return response.data;
  },

  /**
   * Get available drivers for order assignment
   */
  getAvailableDrivers: async () => {
    const response = await api.get('auth/admin/livreurs/');
    return response.data;
  },
};

// ============================================================================
// NOTIFICATIONS & REQUESTS
// ============================================================================

export const notificationService = {
  /**
   * Get shop notifications (with optional filters: type_produit, est_lu, search, page)
   */
  getNotifications: async (params?: {
    type_produit?: string;
    est_lu?: boolean | string;
    search?: string;
    page?: number;
  }) => {
    const response = await api.get('shop/notifications/', { params });
    return response.data;
  },

  /**
   * Get details of a specific notification
   */
  getNotificationById: async (id: number) => {
    const response = await api.get(`shop/notifications/${id}/`);
    return response.data;
  },

  /**
   * Mark a notification as read (or unread)
   */
  markAsRead: async (id: number, estLu: boolean = true) => {
    const response = await api.patch(`shop/notifications/${id}/`, { est_lu: estLu });
    return response.data;
  },

  /**
   * Mark all unread notifications as read
   */
  markAllAsRead: async () => {
    const response = await api.patch('shop/notifications/marquer_tous_comme_lus/');
    return response.data;
  },

  /**
   * Get only unread notifications
   */
  getUnreadNotifications: async () => {
    const response = await api.get('shop/notifications/non_lues/');
    return response.data;
  },

  /**
   * Get notification statistics
   */
  getStats: async () => {
    const response = await api.get('shop/notifications/stats/');
    return response.data;
  },

  /**
   * Get pending provider requests
   */
  getProviderRequests: async () => {
    const response = await api.get('utilisateur/prestataire-requests/');
    return response.data;
  },

  /**
   * Get details of a specific provider request (Admin)
   */
  getProviderRequestById: async (id: number) => {
    const response = await api.get(`utilisateur/prestataire-requests/${id}/`);
    return response.data;
  },
};

// ============================================================================
// ORDERS & CART
// ============================================================================

export const orderService = {
  /**
   * Get paginated list of orders with full filter support (100 per page).
   * Admin/Serveuse: all orders. Livreur: assigned only. Client: own only.
   */
  getOrders: async (params?: {
    statut?: string;
    statut_paiement?: string;
    statut_livraison?: string;
    nom?: string;
    search?: string;
    page?: number;
  }) => {
    const response = await api.get('orders/commandes/', { params });
    return response.data;
  },

  /**
   * Get order details by numero_commande (e.g. "CMD-A8F2K4")
   */
  getOrderByNumero: async (numeroCommande: string) => {
    const response = await api.get(`orders/commandes/${numeroCommande}/`);
    return response.data;
  },

  /**
   * Get order details by numeric ID (legacy fallback)
   */
  getOrderById: async (id: number) => {
    const response = await api.get(`orders/commandes/${id}/`);
    return response.data;
  },

  /**
   * Place a new order from the active cart.
   * panier_id is optional if user is already authenticated with an active cart.
   */
  placeOrder: async (data: {
    panier_id?: number | null;
    livraison_quartier?: string;
    livraison_ville?: string;
    note_client?: string;
  }) => {
    const response = await api.post('orders/commandes/passer/', data);
    return response.data;
  },

  /**
   * Update order fields ΓÇö used by Admin/Serveuse to validate, assign driver, change statuses.
   * PATCH /api/v1/orders/commandes/{numero_commande}/
   */
  updateOrder: async (
    numeroCommande: string,
    data: {
      statut?: string;
      statut_livraison?: string;
      statut_paiement?: string;
      livreur?: number | null;
      date_livraison_estimee?: string | null;
      note_interne?: string;
      frais_livraison?: number;
    }
  ) => {
    const response = await api.patch(`orders/commandes/${numeroCommande}/`, data);
    return response.data;
  },

  /**
   * Livreur: update delivery status via action shortcut.
   * PATCH /api/v1/orders/commandes/{numero_commande}/
   */
  updateDeliveryAction: async (
    numeroCommande: string,
    data: { action: 'livrer' | 'echouer'; motif?: string }
  ) => {
    const response = await api.patch(`orders/commandes/${numeroCommande}/`, data);
    return response.data;
  },

  /**
   * Cancel an order (sets statut to "annul├⌐e")
   */
  cancelOrder: async (numeroCommande: string) => {
    const response = await api.patch(`orders/commandes/${numeroCommande}/`, {
      statut: 'annul├⌐e',
    });
    return response.data;
  },

  /**
   * Assign a delivery driver to an order (Admin shortcut via admin endpoint)
   */
  assignDriver: async (orderId: number, driverId: number) => {
    const response = await api.post(
      `auth/admin/commandes/${orderId}/affecter-livreur/`,
      { livreur_id: driverId }
    );
    return response.data;
  },

  /**
   * Admin/Serveuse: Validate an order and optionally assign delivery
   */
  validateOrder: async (
    numeroCommande: string,
    data: {
      deliveryMethod?: 'delivery' | 'pickup';
      livreur?: number | null;
      date_livraison_estimee?: string;
      notes?: string;
    }
  ) => {
    const response = await api.patch(`orders/commandes/${numeroCommande}/`, {
      statut: 'valid├⌐',
      statut_livraison: data.deliveryMethod === 'pickup' ? 'en_attente_affectation' : 'en_attente_affectation',
      livreur: data.livreur,
      date_livraison_estimee: data.date_livraison_estimee,
      note_interne: data.notes,
    });
    return response.data;
  },

  /**
   * Get all drivers available for assignment
   */
  getAvailableDrivers: async () => {
    const response = await api.get('auth/admin/livreurs/');
    return response.data;
  },

  /**
   * Livreur: Get orders assigned to them
   */
  getAssignedOrders: async (params?: { page?: number }) => {
    const response = await api.get('orders/commandes/', {
      params: { ...params, statut_livraison: 'assign├⌐e' },
    });
    return response.data;
  },

  /**
   * Polling: Get single order status
   */
  pollOrderStatus: async (numeroCommande: string) => {
    const response = await api.get(`orders/commandes/${numeroCommande}/`);
    return response.data;
  },
};

// ============================================================================
// CART MANAGEMENT
// ============================================================================

export const cartService = {
  /**
   * Get current cart
   */
  getCart: async (panierIdOptional?: number) => {
    const params = panierIdOptional ? { panier_id: panierIdOptional } : {};
    const response = await api.get('orders/panier/', { params });
    return response.data;
  },

  /**
   * Add perfume to cart
   */
  addPerfume: async (data: {
    parfum_id: number;
    quantite?: number;
    panier_id?: number;
  }) => {
    const response = await api.post('orders/panier/ajouter/parfum/', data);
    return response.data;
  },

  /**
   * Add accessory to cart
   */
  addAccessory: async (data: {
    accessoire_id: number;
    quantite?: number;
    panier_id?: number;
  }) => {
    const response = await api.post('orders/panier/ajouter/accessoire/', data);
    return response.data;
  },

  /**
   * Add finished essence product to cart
   */
  addFinishedEssence: async (data: {
    produit_fini_essence_id: number;
    quantite?: number;
    panier_id?: number;
  }) => {
    const response = await api.post(
      'orders/panier/ajouter/produit-fini-essence/',
      data
    );
    return response.data;
  },

  /**
   * Add custom perfume to cart (requires authentication)
   */
  addCustomPerfume: async (data: {
    parfum_personnalise_id: number;
    quantite?: number;
    panier_id?: number;
    note_client?: string;
  }) => {
    const response = await api.post(
      'orders/panier/ajouter/parfum-personnalise/',
      data
    );
    return response.data;
  },

  /**
   * Add custom essence to cart (requires authentication)
   */
  addCustomEssence: async (data: {
    essence_personnalisee_id: number;
    quantite?: number;
    panier_id?: number;
  }) => {
    const response = await api.post(
      'orders/panier/ajouter/essence-personnalisee/',
      data
    );
    return response.data;
  },

  /**
   * Update cart line quantity
   */
  updateCartLine: async (
    typeLigne: 'parfum' | 'accessoire' | 'produit-fini-essence' | 'parfum-personnalise' | 'essence-personnalisee',
    ligneId: number,
    data: { quantite: number; panier_id?: number }
  ) => {
    const response = await api.patch(
      `orders/panier/ligne/${typeLigne}/${ligneId}/`,
      data
    );
    return response.data;
  },

  /**
   * Remove cart line
   */
  removeCartLine: async (
    typeLigne: 'parfum' | 'accessoire' | 'produit-fini-essence' | 'parfum-personnalise' | 'essence-personnalisee',
    ligneId: number,
    panierIdOptional?: number
  ) => {
    const data = panierIdOptional ? { panier_id: panierIdOptional } : {};
    const response = await api.delete(
      `orders/panier/ligne/${typeLigne}/${ligneId}/`,
      { data }
    );
    return response.data;
  },

  /**
   * Apply promo code to cart
   */
  applyPromoCode: async (data: {
    code_promo: string;
    panier_id?: number;
  }) => {
    const response = await api.post('orders/panier/appliquer-promo/', data);
    return response.data;
  },

  /**
   * Remove promo code from cart
   */
  removePromoCode: async (panierIdOptional?: number) => {
    const data = panierIdOptional ? { panier_id: panierIdOptional } : {};
    const response = await api.post('orders/panier/retirer-promo/', data);
    return response.data;
  },
};

export { api };
