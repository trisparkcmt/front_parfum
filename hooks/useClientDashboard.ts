'use client';

import { useEffect, useState } from 'react';
import { useToastStore } from '@/store/useToastStore';
import { authService } from '@/services/apiService';
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

        const meData = await authService.getMe();
        const list = ((meData as any)?.commandes ?? (Array.isArray(meData) ? meData : [])) as BackendOrder[];

        const mapBackendLines = (o: BackendOrder): Order['items'] => {
          const lines = [
            ...(o.lignes_parfums ?? []),
            ...(o.lignes_accessoires ?? []),
            ...(o.lignes_produit_fini_essence ?? []),
            ...(o.lignes_parfums_perso ?? []),
            ...(o.lignes_essence_personnalisee ?? []),
          ];

          if (lines.length === 0) {
            return [{
              id: `${o.numero_commande}-fallback`,
              type: 'product',
              productName: `Commande ${o.numero_commande}`,
              quantity: 1,
              unitPrice: Number(o.total_ttc),
              totalPrice: Number(o.total_ttc),
            }];
          }

          return lines.map((l: any, idx: number) => {
            const name = l.nom_snapshot || l.parfum_personnalise_nom || l.nom || l.produit_details?.nom || l.parfum_details?.nom || l.accessoire_details?.nom || `Article #${idx + 1}`;
            const unitPrice = Number(l.prix_unitaire_snapshot || l.prix_snapshot || l.prix_unitaire || 0);
            const qty = Number(l.quantite ?? 1);
            const totalPrice = Number(l.sous_total || qty * unitPrice);

            let itemType: any = 'product';
            if (l.parfum_personnalise || l.parfum_personnalise_id || o.lignes_parfums_perso?.includes(l)) {
              itemType = 'custom-composition';
            }

            return {
              id: `${o.numero_commande}-${idx}-${l.id}`,
              type: itemType,
              productName: name,
              quantity: qty,
              unitPrice: unitPrice,
              totalPrice: totalPrice,
            };
          });
        };

        const mapped: Order[] = list.map((o) => ({
          id: o.numero_commande, // display-friendly & unique
          clientId: String(o.client),
          clientName: o.first_name || o.last_name ? `${o.first_name || ''} ${o.last_name || ''}`.trim() : o.client_email,
          clientPhone: o.livraison_telephone,
          items: mapBackendLines(o),
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
