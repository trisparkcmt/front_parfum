import { api } from './api';

export interface InvoiceCommandInfo {
  id: number;
  numero_commande: string;
  total_ttc: string;
  statut: string;
  statut_paiement: string;
  statut_livraison: string;
  date_creation: string;
  client_id: number;
  client_email: string;
  client_nom_complet: string;
  client_telephone: string;
  livraison_nom_complet: string;
  livraison_telephone: string;
  detail_url: string;
}

export interface InvoiceDetail {
  numero_facture: string;
  date_emission: string;
  fichier_pdf?: string;
  envoye_par_email?: boolean;
  email_envoye_a?: string;
  id?: number;
  recipient?: number;
  commande?: string | InvoiceCommandInfo;
  montant_total?: number | string;
  total_ttc?: number | string;
  created_at?: string;
  [key: string]: any;
}

export const invoiceService = {
  // Download invoice PDF for a specific order
  async downloadInvoicePDF(numeroCommande: string): Promise<Blob> {
    try {
      const response = await api.get(`/orders/commandes/${numeroCommande}/facture/`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error(`Error downloading invoice for ${numeroCommande}:`, error);
      throw error;
    }
  },

  // Get invoice details for a specific order
  async getInvoiceForOrder(numeroCommande: string): Promise<InvoiceDetail> {
    try {
      const response = await api.get(`/orders/commandes/${numeroCommande}/facture/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching invoice for ${numeroCommande}:`, error);
      throw error;
    }
  },

  // List all invoices (Admin & Serveuse only)
  async listAllInvoices(page?: number, pageSize?: number): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (pageSize) params.append('page_size', pageSize.toString());
      const response = await api.get(`/orders/admin/factures/${params.toString() ? '?' + params.toString() : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error listing invoices:', error);
      throw error;
    }
  },

  // Resend invoice via email (Admin & Serveuse only)
  async resendInvoiceByEmail(numeroFacture: string): Promise<{ detail: string }> {
    try {
      const response = await api.post(`/orders/admin/factures/${numeroFacture}/renvoyer/`);
      return response.data;
    } catch (error) {
      console.error(`Error resending invoice ${numeroFacture}:`, error);
      throw error;
    }
  },

  // Helper to trigger download
  async downloadInvoiceFile(numeroCommande: string, fileName?: string): Promise<void> {
    try {
      const blob = await this.downloadInvoicePDF(numeroCommande);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `facture-${numeroCommande}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice file:', error);
      throw error;
    }
  },
};
