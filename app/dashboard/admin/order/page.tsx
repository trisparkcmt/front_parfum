'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, CheckCircle, Truck, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { orderService, adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { BackButton } from '@/components/ui/BackButton';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:    { label: 'En attente',   color: 'text-amber-400 bg-amber-500/10'   },
  validated:  { label: 'Validé',       color: 'text-blue-400 bg-blue-500/10'     },
  delivering: { label: 'En livraison', color: 'text-purple-400 bg-purple-500/10' },
  delivered:  { label: 'Livré',        color: 'text-emerald-400 bg-emerald-500/10'},
  cancelled:  { label: 'Annulé',       color: 'text-red-400 bg-red-500/10'       },
  // French status keys from backend
  en_attente:   { label: 'En attente',   color: 'text-amber-400 bg-amber-500/10'   },
  valide:       { label: 'Validé',       color: 'text-blue-400 bg-blue-500/10'     },
  en_livraison: { label: 'En livraison', color: 'text-purple-400 bg-purple-500/10' },
  livre:        { label: 'Livré',        color: 'text-emerald-400 bg-emerald-500/10'},
  annule:       { label: 'Annulé',       color: 'text-red-400 bg-red-500/10'       },
};

const STATUS_FILTERS = [
  { value: 'all',         label: 'Tous'        },
  { value: 'en_attente',  label: 'En attente'  },
  { value: 'valide',      label: 'Validé'      },
  { value: 'en_livraison',label: 'En livraison'},
  { value: 'livre',       label: 'Livré'       },
  { value: 'annule',      label: 'Annulé'      },
];

export default function OrdersPage() {
  const [orders, setOrders]     = useState<any[]>([]);
  const [drivers, setDrivers]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [selected, setSelected] = useState<any | null>(null);

  // Assign-driver modal
  const [assignModal,       setAssignModal]       = useState<any | null>(null);
  const [selectedDriverId,  setSelectedDriverId]  = useState('');
  const [assigning,         setAssigning]         = useState(false);

  const { addToast } = useToastStore();

  /* ── data fetchers ─────────────────────────────────────────── */

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (filter !== 'all') params.statut = filter;
      if (search)           params.search = search;

      const data = await orderService.getOrders(params);
      const list = data.results ?? data.resultats ?? (Array.isArray(data) ? data : []);
      setOrders(list);
    } catch (err: any) {
      addToast('Erreur lors du chargement des commandes', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, search, addToast]);

  const fetchDrivers = useCallback(async () => {
    try {
      const data = await adminService.getDeliveryDrivers();
      const list = data.results ?? data.resultats ?? (Array.isArray(data) ? data : []);
      setDrivers(list);
    } catch {
      // non-blocking – drivers dropdown will just be empty
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 300);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  /* ── actions ───────────────────────────────────────────────── */

  const handleValidate = async (order: any) => {
    try {
      await orderService.validateOrder(order.id);
      addToast('Commande validée', 'success');
      fetchOrders();
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Erreur lors de la validation', 'error');
    }
  };

  const handleCancel = async (order: any) => {
    if (!confirm(`Annuler la commande #${order.id} ?`)) return;
    try {
      await orderService.cancelOrder(order.id);
      addToast('Commande annulée', 'success');
      fetchOrders();
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Erreur lors de l\'annulation', 'error');
    }
  };

  const handleAssignDriver = async () => {
    if (!assignModal || !selectedDriverId) return;
    setAssigning(true);
    try {
      await orderService.assignDriver(assignModal.id, parseInt(selectedDriverId));
      addToast('Livreur assigné avec succès', 'success');
      setAssignModal(null);
      setSelectedDriverId('');
      fetchOrders();
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Erreur lors de l\'assignation', 'error');
    } finally {
      setAssigning(false);
    }
  };

  /* ── helpers ───────────────────────────────────────────────── */

  const getStatus = (order: any) =>
    order.statut ?? order.status ?? 'en_attente';

  const getLabel = (order: any): string => {
    const s = getStatus(order);
    return statusConfig[s]?.label ?? s;
  };

  const getColor = (order: any): string => {
    const s = getStatus(order);
    return statusConfig[s]?.color ?? 'text-foreground/40 bg-white/5';
  };

  const isPending    = (o: any) => ['en_attente', 'pending'].includes(getStatus(o));
  const isValidated  = (o: any) => ['valide', 'validated'].includes(getStatus(o));
  const isCancellable= (o: any) => isPending(o) || isValidated(o);

  /* ── render ────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Commandes</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Gérez toutes les commandes clients</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 border border-white/10 px-4 py-2.5 rounded-xl text-sm text-foreground/60 hover:bg-white/5 transition-all"
        >
          <RefreshCw size={15} />
          Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {STATUS_FILTERS.filter(f => f.value !== 'all').map(f => {
          const count = orders.filter(o => getStatus(o) === f.value).length;
          const cfg   = statusConfig[f.value];
          return (
            <div key={f.value} className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl">
              <p className="text-xs text-foreground/40 mb-1">{f.label}</p>
              <p className={`text-2xl font-bold ${cfg?.color.split(' ')[0] ?? 'text-foreground'}`}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher commande ou client..."
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filter === f.value
                  ? 'bg-gold text-black'
                  : 'border border-white/10 text-foreground/40 hover:bg-white/5'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des commandes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {['ID', 'Client', 'Montant', 'Date', 'Code Promo', 'Livreur', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-5 py-3.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map(order => {
                  const clientName  = order.client_details?.first_name
                    ?? order.client_name
                    ?? `Client #${order.client ?? order.utilisateur ?? '?'}`;
                  const total       = order.montant_total ?? order.total ?? 0;
                  const date        = order.date_creation
                    ? new Date(order.date_creation).toLocaleDateString('fr-FR')
                    : order.date ?? '—';
                  const promoCode   = order.code_promo ?? order.promo ?? null;
                  const driverName  = order.livreur_details?.first_name
                    ?? order.livreur_name
                    ?? null;

                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-gold font-semibold">
                        #{String(order.id).padStart(5, '0')}
                      </td>
                      <td className="px-5 py-4 font-medium text-foreground">{clientName}</td>
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {Number(total).toLocaleString()} FCFA
                      </td>
                      <td className="px-5 py-4 text-foreground/40 text-xs">{date}</td>
                      <td className="px-5 py-4">
                        {promoCode
                          ? <span className="text-xs font-mono bg-gold/10 text-gold px-2 py-0.5 rounded">{promoCode}</span>
                          : <span className="text-foreground/40">—</span>}
                      </td>
                      <td className="px-5 py-4 text-xs text-foreground/40">
                        {driverName ?? '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${getColor(order)}`}>
                          {getLabel(order)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {/* Detail */}
                          <button
                            title="Voir le détail"
                            onClick={() => setSelected(order)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Validate + Assign driver */}
                          {isPending(order) && (
                            <button
                              title="Valider & assigner un livreur"
                              onClick={() => { setAssignModal(order); setSelectedDriverId(''); }}
                              className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-foreground/40 hover:text-emerald-400 transition-colors"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}

                          {/* Assign driver only (already validated) */}
                          {isValidated(order) && (
                            <button
                              title="Assigner un livreur"
                              onClick={() => { setAssignModal(order); setSelectedDriverId(''); }}
                              className="p-1.5 rounded-lg hover:bg-purple-500/10 text-foreground/40 hover:text-purple-400 transition-colors"
                            >
                              <Truck size={14} />
                            </button>
                          )}

                          {/* Cancel */}
                          {isCancellable(order) && (
                            <button
                              title="Annuler la commande"
                              onClick={() => handleCancel(order)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-20 text-foreground/40 italic">
                      Aucune commande trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Order detail modal ──────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10">
            <h3 className="font-bold text-foreground mb-1">
              Commande #{String(selected.id).padStart(5, '0')}
            </h3>
            <p className="text-xs text-foreground/40 mb-5">
              {selected.date_creation
                ? new Date(selected.date_creation).toLocaleString('fr-FR')
                : selected.date ?? '—'}
            </p>

            <div className="space-y-3 mb-5">
              {[
                { label: 'Client',   value: selected.client_details?.first_name ?? `ID ${selected.client ?? '—'}` },
                { label: 'Montant',  value: `${Number(selected.montant_total ?? selected.total ?? 0).toLocaleString()} FCFA` },
                { label: 'Statut',   value: getLabel(selected) },
                { label: 'Livreur',  value: selected.livreur_details?.first_name ?? '—' },
                { label: 'Code promo', value: selected.code_promo ?? '—' },
                { label: 'Adresse',  value: selected.adresse_livraison ?? '—' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-start text-sm">
                  <span className="text-foreground/40 text-xs">{row.label}</span>
                  <span className="text-foreground font-medium text-right max-w-[60%]">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Items list */}
            {selected.lignes?.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-foreground/40 uppercase mb-2">Articles</p>
                <div className="space-y-2">
                  {selected.lignes.map((l: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-foreground">{l.produit_details?.nom ?? l.description ?? `Article #${i + 1}`}</span>
                      <span className="text-foreground/60">{l.quantite} × {Number(l.prix_unitaire ?? 0).toLocaleString()} FCFA</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelected(null)}
              className="w-full border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ── Assign driver modal ─────────────────────────────────── */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-white/10">
            <h3 className="font-bold text-foreground mb-1">Assigner un livreur</h3>
            <p className="text-sm text-foreground/40 mb-4">
              Commande #{String(assignModal.id).padStart(5, '0')}
            </p>

            <select
              value={selectedDriverId}
              onChange={e => setSelectedDriverId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground mb-4 outline-none focus:border-gold"
            >
              <option value="" className="bg-background">Choisir un livreur...</option>
              {drivers.map(d => {
                const dName = d.name ?? d.user_details?.first_name ?? d.first_name ?? `Livreur #${d.id}`;
                const dId   = d.user_id ?? d.id;
                return (
                  <option key={dId} value={dId} className="bg-background">{dName}</option>
                );
              })}
            </select>

            {/* Also validate if pending */}
            {isPending(assignModal) && (
              <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2 mb-4">
                Cette commande sera également validée lors de l'assignation.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setAssignModal(null); setSelectedDriverId(''); }}
                className="flex-1 border border-white/10 rounded-lg py-2 text-sm text-foreground/60 hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAssignDriver}
                disabled={!selectedDriverId || assigning}
                className="flex-1 bg-gold text-black rounded-lg py-2 text-sm font-medium hover:bg-gold/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {assigning && <Loader2 size={14} className="animate-spin" />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
