import { api } from './api';

export interface UserDetails {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  telephone?: string;
  roles?: Array<{ name: string }>;
}

export interface BestClient {
  id: number;
  user_details: UserDetails;
  date_naissance?: string;
  genre?: string;
  points_fidelite: number;
  total_spent?: number;
  total_paid_orders?: number;
}

export interface BestProvider {
  id: number;
  user_details: UserDetails;
  code_promo: string;
  taux_commission: string;
  reduction_client_pourcentage: string;
  solde_commission: string;
  statut: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const adminService = {
  // Get best clients (by loyalty points, spending or number of orders)
  async getBestClients(
    filterBy: 'spent' | 'orders' | 'points' = 'spent',
    limit?: number,
    page?: number
  ): Promise<BestClient[] | PaginatedResponse<BestClient>> {
    try {
      const params = new URLSearchParams();
      params.append('filter_by', filterBy);
      
      if (limit) {
        params.append('limit', limit.toString());
      } else if (page) {
        params.append('page', page.toString());
      }

      const response = await api.get(`/utilisateur/admin/meilleurs-clients/?${params.toString()}`);
      
      // If limit is provided, response is an array
      // Otherwise, it's a paginated object
      return response.data;
    } catch (error) {
      console.error('Error fetching best clients:', error);
      throw error;
    }
  },

  // Get best providers/prestataires (by commission gains or number of orders)
  async getBestProviders(
    filterBy: 'gains' | 'orders' = 'gains',
    limit?: number,
    page?: number
  ): Promise<BestProvider[] | PaginatedResponse<BestProvider>> {
    try {
      const params = new URLSearchParams();
      params.append('filter_by', filterBy);
      
      if (limit) {
        params.append('limit', limit.toString());
      } else if (page) {
        params.append('page', page.toString());
      }

      const response = await api.get(`/utilisateur/admin/meilleurs-prestataires/?${params.toString()}`);
      
      // If limit is provided, response is an array
      // Otherwise, it's a paginated object
      return response.data;
    } catch (error) {
      console.error('Error fetching best providers:', error);
      throw error;
    }
  },

  // Helper to check if response is paginated
  isPaginated(data: any): data is PaginatedResponse<any> {
    return data && typeof data === 'object' && 'count' in data && 'results' in data;
  },

  // Helper to extract results from either format
  extractResults<T>(data: T[] | PaginatedResponse<T>): T[] {
    return Array.isArray(data) ? data : data.results || [];
  },
};
