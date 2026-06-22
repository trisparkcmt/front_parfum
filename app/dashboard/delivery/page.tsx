'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { formatPrice } from '@/lib/utils';
import { useToastStore } from '@/store/useToastStore';
import { useRouter } from 'next/navigation';
import {
  MapPin, Phone, CheckCircle, Clock, Truck,
  Navigation, Package, Palette, ChevronRight,
  X, Loader2, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BackButton } from '@/components/ui/BackButton';
import { deliveryService } from '@/services/apiService';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface DeliveryTask {
  id: number;
  orderId: string;
  clientName: string;
  clientPhone: string;
  items: any[];
  total: number;
  status: 'assigned' | 'in_transit' | 'delivering' | 'delivered' | 'failed';
  assignedAt: string;
  deliveryAddress?: string;
  _raw?: any; // original backend object
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  assigned:   { label: 'Assigné',       color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
  in_transit: { label: 'En route',      color: 'text-blue-400',    bg: 'bg-blue-400/10'    },
  delivering: { label: 'En livraison',  color: 'text-blue-400',    bg: 'bg-blue-400/10'    },
  delivered:  { label: 'Livré',         color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  failed:     { label: 'Échoué',        color: 'text-red-400',     bg: 'bg-red-400/10'     },
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DeliveryDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [tasks, setTasks]     = useState<DeliveryTask[]>([]);
  const [stats, setStats]     = useState({ totalAssigned: 0, totalDelivered: 0, totalFailed: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null); // task id being updated

  const [selected, setSelected]   = useState<DeliveryTask | null>(null);
  const [failModal, setFailModal] = useState<DeliveryTask | null>(null);
  const [failReason, setFailReason] = useState('');

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [, deliveriesRes] = await Promise.all([
        deliveryService.getDeliveryDashboard().catch(() => null),
        deliveryService.getDeliveries(),
      ]);

      const rawList: any[] = deliveriesRes?.results ?? deliveriesRes?.resultats ?? (Array.isArray(deliveriesRes) ? deliveriesRes : []);

      const mapped: DeliveryTask[] = rawList.map((d: any) => ({
        id:              d.id,
        orderId:         d.commande?.numero_commande ?? d.numero_commande ?? String(d.id),
        clientName:      d.commande?.client_email ?? d.client_nom ?? 'Client',
        clientPhone:     d.commande?.livraison_telephone ?? d.telephone ?? '',
        items:           [],
        total:           Number(d.commande?.total_ttc ?? d.montant ?? 0),
        status:          mapStatus(d.statut_livraison ?? d.status),
        assignedAt:      d.date_affectation ?? d.created_at ?? '',
        deliveryAddress: [d.commande?.livraison_quartier, d.commande?.livraison_ville].filter(Boolean).join(', ') || d.adresse,
        _raw:            d,
      }));

      setTasks(mapped);
      setStats({
        totalAssigned:  mapped.length,
        totalDelivered: mapped.filter(t => t.status === 'delivered').length,
        totalFailed:    mapped.filter(t => t.status === 'failed').length,
      });
    } catch (err: any) {
      addToast('Erreur lors du chargement des livraisons', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  function mapStatus(s: string): DeliveryTask['status'] {
    if (s === 'livrée' || s === 'livree' || s === 'delivered') return 'delivered';
    if (s === 'échouée' || s === 'echouee' || s === 'failed')  return 'failed';
    if (s === 'en_transit' || s === 'in_transit')              return 'in_transit';
    return 'assigned';
  }

  // ── mark delivered ─────────────────────────────────────────────────────────
  const handleMarkDelivered = async (task: DeliveryTask) => {
    setUpdating(task.id);
    try {
      await deliveryService.updateDeliveryStatus(task.id, { action: 'livrer' });
      addToast(`Livraison ${task.orderId} marquée comme livrée !`, 'success');
      await fetchData();
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Erreur lors de la mise à jour', 'error');
    } finally {
      setUpdating(null);
    }
  };

  // ── mark failed ────────────────────────────────────────────────────────────
  const handleMarkFailed = async () => {
    if (!failModal) return;
    setUpdating(failModal.id);
    try {
      await deliveryService.updateDeliveryStatus(failModal.id, {
        action: 'echouer',
        motif: failReason || 'Non précisé',
      });
      addToast('Livraison marquée comme échouée', 'info');
      setFailModal(null);
      setFailReason('');
      await fetchData();
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Erreur', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const pendingTasks   = tasks.filter(t => t.status !== 'delivered' && t.status !== 'failed');
  const completedTasks = tasks.filter(t => t.status === 'delivered');

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <BackButton />

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-foreground relative overflow-hidden shadow-xl shadow-emerald-500/20">
        <div className="absolute top-0 right-0 opacity-10">
          <Truck size={120} />
        </div>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-sm text-foreground/70 mb-1 font-medium">{t('hello_comma')}</p>
            <h1 className="text-2xl font-bold mb-1">{user?.firstName} {user?.lastName}</h1>
            <p className="text-sm text-foreground/70">
              {pendingTasks.length > 0
                ? `${pendingTasks.length} livraison${pendingTasks.length > 1 ? 's' : ''} en cours`
                : t('no_missions_desc')}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'À livrer',      value: pendingTasks.length,        icon: <Clock size={18} />,       color: 'text-amber-400 bg-amber-400/10'   },
          { label: 'Livrées',       value: stats.totalDelivered,       icon: <CheckCircle size={18} />, color: 'text-emerald-400 bg-emerald-400/10'},
          { label: 'Total missions',value: stats.totalAssigned,        icon: <Package size={18} />,     color: 'text-gold bg-gold/10'              },
          { label: 'En route',      value: tasks.filter(t => t.status === 'in_transit' || t.status === 'delivering').length, icon: <Navigation size={18} />, color: 'text-blue-400 bg-blue-400/10' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-foreground/40 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mission cards */}
      <div>
        <h2 className="font-semibold text-foreground text-lg mb-4">{t('daily_missions')}</h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gold gap-3">
            <Loader2 className="animate-spin" size={28} />
            <p className="text-sm">Chargement des livraisons...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTasks.map(task => {
              const st = STATUS_CFG[task.status] ?? STATUS_CFG.assigned;
              const isUpdating = updating === task.id;

              return (
                <div
                  key={task.id}
                  className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl hover:shadow-gold/5 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight ${st.color} ${st.bg}`}>
                        {st.label}
                      </span>
                      <p
                        onClick={() => setSelected(task)}
                        className="font-bold text-foreground text-lg mt-2 group-hover:text-gold transition-colors cursor-pointer"
                      >
                        {t('order_label')} {task.orderId}
                      </p>
                      <p className="text-xs text-foreground/40">{task.clientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-foreground/40">{t('amount_label')}</p>
                      <p className="font-bold text-foreground">{formatPrice(task.total)}</p>
                      <button
                        onClick={() => setSelected(task)}
                        className="text-xs text-gold/60 hover:text-gold mt-1 transition-colors"
                      >
                        Détails →
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-5">
                    <div className="flex items-start gap-3 text-sm text-foreground/60">
                      <MapPin size={16} className="text-gold shrink-0 mt-0.5" />
                      <span>{task.deliveryAddress || t('unspecified_address')}</span>
                    </div>
                    {task.clientPhone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone size={16} className="text-gold shrink-0" />
                        <a href={`tel:${task.clientPhone}`} className="text-foreground/60 hover:text-gold transition-colors">
                          {task.clientPhone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {/* Mark failed */}
                    <button
                      disabled={isUpdating}
                      onClick={() => { setFailModal(task); setFailReason(''); }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <AlertTriangle size={14} />
                      Signaler échec
                    </button>

                    {/* Mark delivered */}
                    <button
                      disabled={isUpdating}
                      onClick={() => handleMarkDelivered(task)}
                      className="flex-1 bg-gold text-black py-2.5 rounded-xl text-sm font-bold hover:bg-gold/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isUpdating
                        ? <Loader2 size={14} className="animate-spin" />
                        : <CheckCircle size={14} />
                      }
                      {t('status_delivered')}
                    </button>
                  </div>
                </div>
              );
            })}

            {pendingTasks.length === 0 && (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10 shadow-2xl">
                <CheckCircle size={48} className="text-emerald-500/20 mx-auto mb-4" />
                <p className="text-foreground font-medium">{t('all_missions_done')}</p>
                <p className="text-xs text-foreground/40 mt-1">{t('check_later_desc')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Completed */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground/60 text-base mb-3">Livraisons terminées ({completedTasks.length})</h2>
          <div className="space-y-3">
            {completedTasks.map(task => (
              <div
                key={task.id}
                onClick={() => setSelected(task)}
                className="bg-white/3 rounded-2xl border border-white/5 p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div>
                  <p className="font-semibold text-foreground/60">{t('order_label')} {task.orderId}</p>
                  <p className="text-xs text-foreground/30">{task.clientName} · {task.deliveryAddress}</p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-emerald-400 bg-emerald-400/10">
                  Livré ✓
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => router.push('/dashboard/delivery/orders')}
          className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl hover:shadow-gold/5 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-foreground mb-3 group-hover:scale-110 transition-transform">
            <Truck size={20} />
          </div>
          <p className="font-semibold text-sm text-foreground">Mes Livraisons</p>
          <p className="text-xs text-foreground/40 mt-0.5 flex items-center gap-1">Voir toutes mes livraisons <ChevronRight size={12} /></p>
        </button>
        <button
          onClick={() => router.push('/dashboard/delivery/profile')}
          className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl hover:shadow-gold/5 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-foreground mb-3 group-hover:scale-110 transition-transform">
            <Palette size={20} />
          </div>
          <p className="font-semibold text-sm text-foreground">{t('settings_action')}</p>
          <p className="text-xs text-foreground/40 mt-0.5 flex items-center gap-1">Langue, Devise, Apparence <ChevronRight size={12} /></p>
        </button>
      </div>

      {/* ── Detail modal ──────────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl w-full max-w-md shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="font-bold text-foreground">Commande {selected.orderId}</h3>
                <p className="text-xs text-foreground/40">{selected.clientName}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-white/5 text-foreground/40 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Status */}
              <div>
                <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CFG[selected.status]?.color} ${STATUS_CFG[selected.status]?.bg}`}>
                  {STATUS_CFG[selected.status]?.label}
                </span>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Montant',    value: formatPrice(selected.total) },
                  { label: 'Téléphone',  value: selected.clientPhone || '—' },
                ].map(row => (
                  <div key={row.label} className="bg-white/5 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-foreground/40 mb-0.5">{row.label}</p>
                    <p className="text-sm font-medium text-foreground">{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Address */}
              {selected.deliveryAddress && (
                <div className="bg-white/5 rounded-xl px-4 py-3">
                  <p className="text-xs text-foreground/40 mb-1.5 flex items-center gap-1"><MapPin size={12} /> Adresse</p>
                  <p className="text-sm font-medium text-foreground">{selected.deliveryAddress}</p>
                  {selected.clientPhone && (
                    <a
                      href={`tel:${selected.clientPhone}`}
                      className="mt-2 flex items-center gap-2 text-xs text-gold hover:text-gold/80 transition-colors"
                    >
                      <Phone size={11} /> Appeler le client
                    </a>
                  )}
                </div>
              )}

              {/* Raw backend note */}
              {selected._raw?.note_client && (
                <div className="bg-white/5 rounded-xl px-4 py-3">
                  <p className="text-xs text-foreground/40 mb-1">Note du client</p>
                  <p className="text-sm text-foreground">{selected._raw.note_client}</p>
                </div>
              )}

              {/* Actions */}
              {selected.status !== 'delivered' && selected.status !== 'failed' && (
                <div className="flex gap-3 pt-2">
                  <button
                    disabled={updating === selected.id}
                    onClick={() => { setSelected(null); setFailModal(selected); setFailReason(''); }}
                    className="flex-1 border border-red-500/20 text-red-400 rounded-xl py-2.5 text-sm font-medium hover:bg-red-500/10 transition-colors"
                  >
                    Signaler échec
                  </button>
                  <button
                    disabled={updating === selected.id}
                    onClick={async () => { await handleMarkDelivered(selected); setSelected(null); }}
                    className="flex-1 bg-gold text-black rounded-xl py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors flex items-center justify-center gap-2"
                  >
                    {updating === selected.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Marquer livré
                  </button>
                </div>
              )}

              <button
                onClick={() => setSelected(null)}
                className="w-full border border-white/10 rounded-xl py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fail reason modal ─────────────────────────────────────────────────── */}
      {failModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl w-full max-w-sm shadow-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Signaler un échec</h3>
              <button onClick={() => setFailModal(null)} className="p-2 rounded-xl hover:bg-white/5 text-foreground/40">
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-foreground/60 mb-4">
              Commande <span className="text-foreground font-mono">{failModal.orderId}</span>
            </p>

            <textarea
              value={failReason}
              onChange={e => setFailReason(e.target.value)}
              placeholder="Raison de l'échec (ex: client absent, adresse introuvable...)"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-red-500/40 transition-colors resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setFailModal(null)}
                className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleMarkFailed}
                disabled={updating === failModal.id}
                className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl py-2.5 text-sm font-semibold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updating === failModal.id && <Loader2 size={14} className="animate-spin" />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
