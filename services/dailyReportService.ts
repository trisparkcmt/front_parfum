import { api } from './api';

export interface DailyReportItem {
  nom: string;
  quantite: number;
  sous_total: number;
  type: string;
}

export interface DailyStockEntry {
  nom: string;
  quantite_ajoutee: number;
  type_produit: string;
  date?: string;
}

export interface DailyReportExpense {
  id: number;
  titre: string;
  montant: number;
  description: string;
}

export interface DailyReport {
  id: number;
  date: string;
  caissiere: number;
  caissiere_nom: string;
  nombre_ventes?: number;
  heure_arrivee?: string;
  heure_depart?: string;
  recette_totale: number;
  total_depenses: number;
  reste_en_caisse?: string;
  sorties_articles: DailyReportItem[];
  entrees_stock: DailyStockEntry[];
  depenses: DailyReportExpense[];
  autres_donnees_manuelles?: Record<string, string>;
  actions_communication?: string;
  observations?: string;
  texte_formate?: string;
  texte_apercu?: string;
  apercu_texte_whatsapp?: string;
  fichier_pdf?: string;
  pdf_url?: string;
  date_creation?: string;
  date_modification?: string;
}

export interface DailyReportFilters {
  date?: string;
  date_debut?: string;
  date_fin?: string;
  caissiere_id?: number;
}

export interface CloseDailyReportPayload {
  date?: string;
  caissiere_id?: number;
  heure_arrivee?: string;
  heure_depart?: string;
  reste_en_caisse?: string;
  autres_donnees_manuelles?: Record<string, string>;
  actions_communication?: string;
  observations?: string;
  sorties_articles_ajouts?: DailyReportItem[];
  entrees_stock_ajouts?: DailyStockEntry[];
}

export const dailyReportService = {
  getPreview: async (filters?: Pick<DailyReportFilters, 'date' | 'caissiere_id'>): Promise<DailyReport> => {
    const response = await api.get('pos/rapport-journalier/apercu/', { params: filters });
    return response.data;
  },

  closeDay: async (payload: CloseDailyReportPayload): Promise<DailyReport> => {
    const response = await api.post('pos/rapport-journalier/cloturer/', payload);
    return response.data;
  },

  getReports: async (filters?: DailyReportFilters): Promise<DailyReport[] | { results?: DailyReport[]; resultats?: DailyReport[] }> => {
    const response = await api.get('pos/rapport-journalier/', { params: filters });
    return response.data;
  },

  getReport: async (id: number, regeneratePdf = false): Promise<DailyReport> => {
    const response = await api.get(`pos/rapport-journalier/${id}/`, {
      params: regeneratePdf ? { regenerer_pdf: 'true' } : undefined,
    });
    return response.data;
  },
};
