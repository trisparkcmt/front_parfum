import { api } from './api';

interface POSCartItemLike {
  product: any;
  quantity: number;
}

function buildPOSOrderLine(item: POSCartItemLike) {
  const p = item.product as any;

  if (p?.is_custom) {
    return {
      type: 'parfum_perso',
      quantite: item.quantity,
      recette: {
        flacon_id: p.flaconId || p.selectedSize || p.contenance_ml || null,
        nom: p.nom || p.nom_produit || p.name || `Parfum sur-mesure ${p.selectedSize || ''}`,
        lignes:
          p.quantities && typeof p.quantities === 'object'
            ? Object.entries(p.quantities).map(([lotId, q]) => ({
                lot_essence_id: Number(lotId),
                quantite_ml: Number(q),
              }))
            : [],
      },
    };
  }

  const normalizedType = String(p?.type || '').toLowerCase();

  if (normalizedType === 'accessoire') {
    return { type: 'accessoire', id: Number(p.id), quantite: item.quantity };
  }

  if (normalizedType === 'diffuseur') {
    return { type: 'diffuseur', id: Number(p.id), quantite: item.quantity };
  }

  if (normalizedType === 'essence' || normalizedType === 'produit-fini-essence') {
    return { type: 'essence', id: Number(p.id), quantite: item.quantity };
  }

  if (normalizedType === 'essence_perso' || normalizedType === 'essence-perso') {
    return { type: 'essence_perso', id: Number(p.id), quantite: item.quantity };
  }

  return { type: 'parfum', id: Number(p.id), quantite: item.quantity };
}

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
  async createPOSOrder(payload: any): Promise<Order> {
    try {
      const body = {
        ...payload,
      };

      const response = await api.post(`/pos/commandes/creer/`, body);
      return response.data;
    } catch (error) {
      console.error('Error creating POS order:', error);
      throw error;
    }
  },

  async createPOSOrderFromCart(options: {
    cartItems: POSCartItemLike[];
    clientTelephone?: string;
    clientNom?: string;
    clientEmail?: string;
    livraisonNom?: string;
    livraisonTelephone?: string;
    codePromo?: string;
    noteInterne?: string;
  }): Promise<Order> {
    const lignes = options.cartItems.map(buildPOSOrderLine);

    return this.createPOSOrder({
      lignes,
      client_telephone: options.clientTelephone || undefined,
      client_nom_complet: options.clientNom || undefined,
      client_email: options.clientEmail || undefined,
      livraison_nom_complet: options.livraisonNom || options.clientNom || undefined,
      livraison_telephone: options.livraisonTelephone || options.clientTelephone || undefined,
      code_promo: options.codePromo || undefined,
      note_interne: options.noteInterne || undefined,
    });
  },
};
