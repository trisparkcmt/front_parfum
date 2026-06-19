'use client';

import { useEffect, useState } from 'react';
import { useToastStore } from '@/store/useToastStore';
import { orderService } from '@/services/apiService';
import type { BackendOrder, Order } from '@/types';

export const useClientDashboard = () => {
  const { addToast } = useToastStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapBackendStatus = (o: BackendOrder): Order['status'] => {
    if (o.statut === 'annulée' || o.statut === 'remboursée') return 'cancelled';
    if (o.statut_livraison === 'livrée') return 'delivered';
    if (o.statut_livraison === 'assignée') return 'delivering';
    if (o.statut === 'validé') return 'validated';
    return 'pending';
  };

  const getItemsCount = (o: BackendOrder) =>
    (o.lignes_parfums?.length ?? 0) +
    (o.lignes_accessoires?.length ?? 0) +
    (o.lignes_produit_fini_essence?.length ?? 0) +
    (o.lignes_parfums_perso?.length ?? 0) +
    (o.lignes_essence_personnalisee?.length ?? 0);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await orderService.getOrders({ page: 1 });
        const list = (data?.results ?? data?.resultats ?? []) as BackendOrder[];

        const mapped: Order[] = list.map((o) => ({
          id: o.numero_commande, // display-friendly & unique
          clientId: String(o.client),
          clientName: o.client_email,
          clientPhone: o.livraison_telephone,
          items: Array.from({ length: Math.max(1, getItemsCount(o)) }).map((_, idx) => ({
            id: `${o.numero_commande}-${idx}`,
            type: 'product',
            productName: idx === 0 ? `Commande ${o.numero_commande}` : `Article ${idx + 1}`,
            quantity: 1,
            unitPrice: Number(o.total_ttc),
            totalPrice: Number(o.total_ttc),
          })),
          subtotal: Number(o.sous_total),
          promoCode: o.code_promo_utilise ?? undefined,
          promoDiscount: Number(o.remise_code_promo),
          total: Number(o.total_ttc),
          status: mapBackendStatus(o),
          deliveryPersonId: o.livreur != null ? String(o.livreur) : undefined,
          deliveryPersonName: o.livreur_nom ?? undefined,
          partnerId: o.prestataire_code ?? undefined,
          createdAt: o.date_creation,
          validatedAt: o.statut === 'validé' ? o.date_modification : undefined,
          deliveredAt: o.statut_livraison === 'livrée' ? o.date_livraison_reelle ?? undefined : undefined,
        }));

        setOrders(mapped);
      } catch (err: any) {
        console.error('Failed to load orders:', err);
        const msg = err?.response?.data?.detail || 'Impossible de charger vos commandes';
        setError(msg);
        addToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [addToast]);

  return { orders, loading, error };
};
