import { api } from './api';

export interface Invoice {
  numero_facture: string;
  date_emission: string;
  fichier_pdf?: string;
  envoye_par_email?: boolean;
}

export interface Order {
  id: number;
  numero_commande: string;
  statut: 'pendante' | 'validée' | 'livrée' | 'annulée';
  statut_livraison?: 'assignée' | 'en_cours' | 'livrée' | 'échouée';
  statut_paiement: 'en_attente' | 'payé' | 'remboursé';
  total_ttc: number;
  total_ht?: number;
  tva?: number;
  date_commande: string;
  date_livraison_estimee?: string;
  note_interne?: string;
  livreur?: number | { id: number; first_name: string; last_name: string };
  facture?: Invoice;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface UpdateOrderPayload {
  statut?: string;
  statut_livraison?: string;
  statut_paiement?: string;
  livreur?: number;
  date_livraison_estimee?: string;
  note_interne?: string;
  // For quick actions by delivery personnel
  action?: 'livrer' | 'echouer';
  motif?: string;
}

export const orderService = {
  // Get all orders for the user
  async getOrders(params?: { page?: number; pageSize?: number; [key: string]: any }): Promise<any> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.pageSize) searchParams.append('page_size', params.pageSize.toString());
      const response = await api.get(`/orders/commandes/${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Get order details by numero_commande
  async getOrderDetail(numeroCommande: string): Promise<Order> {
    try {
      const response = await api.get(`/orders/commandes/${numeroCommande}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${numeroCommande}:`, error);
      throw error;
    }
  },

  // Update an order (Admin, Serveuse, or Livreur)
  async updateOrder(numeroCommande: string, payload: UpdateOrderPayload): Promise<Order> {
    try {
      const response = await api.patch(`/orders/commandes/${numeroCommande}/`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${numeroCommande}:`, error);
      throw error;
    }
  },

  // Quick action for delivery personnel: mark as delivered
  async markOrderAsDelivered(numeroCommande: string): Promise<Order> {
    try {
      const response = await api.patch(`/orders/commandes/${numeroCommande}/`, {
        action: 'livrer',
      });
      return response.data;
    } catch (error) {
      console.error(`Error marking order ${numeroCommande} as delivered:`, error);
      throw error;
    }
  },

  // Quick action for delivery personnel: mark as failed
  async markOrderAsFailedDelivery(numeroCommande: string, motif: string): Promise<Order> {
    try {
      const response = await api.patch(`/orders/commandes/${numeroCommande}/`, {
        action: 'echouer',
        motif,
      });
      return response.data;
    } catch (error) {
      console.error(`Error marking order ${numeroCommande} as failed:`, error);
      throw error;
    }
  },

  // Alternative endpoint for delivery dashboard
  async updateDeliveryStatus(commandeId: number, payload: UpdateOrderPayload): Promise<Order> {
    try {
      const response = await api.patch(`/utilisateur/livreur/livraisons/${commandeId}/update/`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating delivery status for ${commandeId}:`, error);
      throw error;
    }
  },

  // Create a new order via the standard flow (cart → order)
  async createOrder(payload: any): Promise<Order> {
    try {
      const response = await api.post(`/orders/commandes/`, payload);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  /**
   * Create a direct POS sale bypassing the standard order flow.
   * Uses the dedicated endpoint POST /pos/commandes/creer/ which immediately
   * marks the sale as validated and paid — designed for fast in-shop transactions
   * where the serveuse selects items and confirms on the spot.
   */
  async createPOSOrder(payload: {
    lignes: Array<{
      type: 'parfum' | 'accessoire' | 'essence';
      id?: number;
      quantite: number;
      produit_personnalise?: {
        nom: string;
        flacon: number;
        lignes: Array<{
          essence_catalogue?: number;
          ingredient_catalogue?: number;
          quantite_ml: number;
        }>;
      };
    }>;
    client_nom_complet?: string;
    client_telephone?: string;
    note_interne?: string;
    code_promo?: string;
  }): Promise<Order> {
    try {
      const response = await api.post(`/pos/commandes/creer/`, {
        ...payload,
        source: 'pos',
        statut: 'validé',
        statut_paiement: 'payé',
      });
      return response.data;
    } catch (error) {
      console.error('Error creating POS order:', error);
      throw error;
    }
  },
};
