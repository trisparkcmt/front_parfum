'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Loader2, MapPin, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BackButton } from '@/components/ui/BackButton';
import { deliveryService } from '@/services/apiService';

interface CompletedDelivery {
  id: number;
  orderId: string;
  clientName: string;
  address: string;
  date: string;
}

export default function CompletedDeliveriesPage() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const [items, setItems] = useState<CompletedDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await deliveryService.getDeliveries();
      const list: any[] = response?.results ?? response?.resultats ?? (Array.isArray(response) ? response : []);
      setItems(list.filter((item) => ['livrée', 'livree', 'delivered'].includes(String(item.statut_livraison ?? item.status ?? item.statut).toLowerCase())).map((item) => ({
        id: item.id,
        orderId: item.numero_commande ?? item.commande?.numero_commande ?? String(item.id),
        clientName: item.client_nom ?? item.livraison_nom_complet ?? item.commande?.client_email ?? (isEn ? 'Client' : 'Client'),
        address: [item.livraison_quartier, item.livraison_ville].filter(Boolean).join(', ') || item.adresse || '',
        date: item.date_livraison ?? item.date_modification ?? item.date_creation ?? '',
      })));
    } finally {
      setLoading(false);
    }
  }, [isEn]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{isEn ? 'Completed deliveries' : 'Livraisons terminées'}</h1>
          <p className="text-sm text-foreground/50">{isEn ? 'History of deliveries already completed.' : 'Historique de vos livraisons déjà effectuées.'}</p>
        </div>
        <button onClick={load} aria-label={isEn ? 'Refresh' : 'Actualiser'} className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5"><RefreshCw size={16} /></button>
      </div>
      {loading ? <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-gold" /></div> : items.length === 0 ? (
        <div className="py-16 text-center text-foreground/50">{isEn ? 'No completed deliveries.' : 'Aucune livraison terminée.'}</div>
      ) : <div className="space-y-3">{items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div><p className="font-semibold">{isEn ? 'Order' : 'Commande'} {item.orderId}</p><p className="text-xs text-foreground/50">{item.clientName}</p>{item.address && <p className="text-xs text-foreground/40 mt-1 flex items-center gap-1"><MapPin size={12} />{item.address}</p>}</div>
        <span className="shrink-0 flex items-center gap-1 text-xs text-emerald-400"><CheckCircle size={14} />{isEn ? 'Delivered' : 'Livrée'}</span>
      </div>)}</div>}
    </div>
  );
}