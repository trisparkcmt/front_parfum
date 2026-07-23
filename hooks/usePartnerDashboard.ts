'use client';

import { useCallback, useEffect, useState } from 'react';
import { partnerService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useAuthStore } from '@/store/useAuthStore';

export interface PartnerPayout {
  id: number;
  prestataire: number;
  montant: string;
  telephone_destination: string;
  reference_unique: string;
  statut: string;
  motif_echec: string | null;
  date_creation: string;
  date_finalisation: string | null;
}

export interface PartnerHistoryEntry {
  id: number;
  type_operation: 'vente' | 'retrait' | 'bonus' | string;
  montant: string;
  reference_commande: string | null;
  date_operation: string;
  description: string;
}

export interface PartnerDashboardData {
  id?: number;
  solde_commission?: string | number;
  taux_commission?: string | number;
  reduction_client_pourcentage?: string | number;
  code_promo?: string;
  statut?: string;
  total_gains?: string | number;
  total_retraits?: string | number;
  solde_bloque?: string | number;
  payouts_recents?: PartnerPayout[];
  historique_recent?: PartnerHistoryEntry[];
  historique?: PartnerHistoryEntry[];
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeHistoryResponse(res: unknown): PartnerHistoryEntry[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  const paginated = res as { results?: PartnerHistoryEntry[]; resultats?: PartnerHistoryEntry[] };
  return paginated.results ?? paginated.resultats ?? [];
}

export const usePartnerDashboard = () => {
  const addToast = useToastStore((s) => s.addToast);
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [data, setData] = useState<PartnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPartnerData = useCallback(async () => {
    setLoading(true);
    setError(null);

    let dashboard: PartnerDashboardData = {};
    let history: PartnerHistoryEntry[] = [];
    const errors: string[] = [];

    try {
      dashboard = (await partnerService.getPartnerDashboard()) ?? {};
    } catch (err: unknown) {
      console.error('Failed to load partner dashboard:', err);
      const apiErr = err as { response?: { data?: { detail?: string } } };
      errors.push(apiErr.response?.data?.detail || 'Impossible de charger le tableau de bord prestataire');
    }

    try {
      const historyRes = await partnerService.getPartnerHistory();
      history = normalizeHistoryResponse(historyRes);
    } catch (err: unknown) {
      console.error('Failed to load partner history:', err);
      const apiErr = err as { response?: { data?: { detail?: string } } };
      errors.push(apiErr.response?.data?.detail || 'Impossible de charger l\'historique');
    }

    const recentFromDashboard = dashboard.historique_recent ?? [];
    const mergedHistory = history.length > 0 ? history : recentFromDashboard;

    setData({
      ...dashboard,
      historique_recent: recentFromDashboard.length > 0 ? recentFromDashboard : mergedHistory.slice(0, 10),
      historique: mergedHistory,
      payouts_recents: dashboard.payouts_recents ?? [],
    });

    if (errors.length > 0) {
      const message = errors.join(' · ');
      setError(message);
      addToast(message, 'error');
    }

    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadPartnerData();
  }, [_hasHydrated, isAuthenticated, loadPartnerData]);

  return { data, loading, error, refetch: loadPartnerData, toNumber };
};
