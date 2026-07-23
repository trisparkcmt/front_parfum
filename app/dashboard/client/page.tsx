'use client';

import { useMemo, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { formatPrice } from '@/lib/utils';
import { Package, ShoppingBag, Heart, Calendar, CreditCard, Star, ChevronRight, Palette, ChevronLeft, ChevronRight as ChevronRightIcon, X } from 'lucide-react';
import { PerfumeIcon } from '@/components/icons/CustomIcons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/ui/BackButton';
import { Order } from '@/types';
import { useClientDashboard } from '@/hooks/useClientDashboard';

export default function ClientDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { orders } = useClientDashboard();

  const statusConfig = {
    pending: { label: t('status_pending'), color: 'text-amber-400 bg-amber-400/10' },
    validated: { label: t('status_validated'), color: 'text-blue-400 bg-blue-400/10' },
    delivering: { label: t('status_delivering'), color: 'text-purple-400 bg-purple-400/10' },
    delivered: { label: t('status_delivered'), color: 'text-emerald-400 bg-emerald-400/10' },
    cancelled: { label: t('status_cancelled'), color: 'text-red-400 bg-red-400/10' },
  };


  const deliveredOrders = useMemo(() => orders.filter(o => o.status === 'delivered'), [orders]);
  const ongoingOrders = useMemo(() => orders.filter(o => o.status !== 'delivered'), [orders]);
  const totalSpent = useMemo(() => orders.reduce((acc, o) => acc + o.total, 0), [orders]);
  const compositionCount = useMemo(
    () => orders.reduce((acc, order) => acc + order.items.filter(i => i.type === 'custom-composition').length, 0),
    [orders],
  );
  const [rowsPerPage, setRowsPerPage] = useState<10 | 15>(10);
  const [ongoingPage, setOngoingPage] = useState(1);
  const [deliveredPage, setDeliveredPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const paginatedOngoingOrders = useMemo(() => {
    const start = (ongoingPage - 1) * rowsPerPage;
    return ongoingOrders.slice(start, start + rowsPerPage);
  }, [ongoingOrders, ongoingPage, rowsPerPage]);

  const paginatedDeliveredOrders = useMemo(() => {
    const start = (deliveredPage - 1) * rowsPerPage;
    return deliveredOrders.slice(start, start + rowsPerPage);
  }, [deliveredOrders, deliveredPage, rowsPerPage]);

  const ongoingPages = Math.max(1, Math.ceil(ongoingOrders.length / rowsPerPage));
  const deliveredPages = Math.max(1, Math.ceil(deliveredOrders.length / rowsPerPage));

  return (
    <div className="space-y-6 px-4 sm:px-6 py-4 sm:py-6">
      <BackButton />
      <div className="bg-gradient-to-r from-gold to-gold-dark rounded-2xl p-6 text-black relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-black/5 rounded-full -mr-10 -mt-10" />
        <div className="relative z-10">
          <p className="text-sm text-black/70 mb-1 font-medium">{t('welcome_comma')}</p>
          <h1 className="text-2xl font-bold mb-1">{user?.firstName} {user?.lastName}</h1>
          <p className="text-sm text-black/60">{t('manage_orders_creations')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('orders_count'), value: orders.length, icon: <Package size={18} />, color: 'text-gold bg-gold/10' },
          { label: t('delivered_count'), value: deliveredOrders.length, icon: <ShoppingBag size={18} />, color: 'text-emerald-400 bg-emerald-400/10' },
          { label: 'Points fidélité', value: user?.client?.points_fidelite ?? 0, icon: <Star size={18} />, color: 'text-amber-400 bg-amber-400/10' },
          { label: 'Total dépensé', value: formatPrice(user?.client?.total_depenses ?? totalSpent), icon: <CreditCard size={18} />, color: 'text-blue-400 bg-blue-400/10' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-foreground/40 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-foreground">{t('ongoing_orders', { defaultValue: 'En cours' })}</h2>
              <p className="text-xs text-foreground/40">{ongoingOrders.length} {t('orders', { defaultValue: 'commandes' })}</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-foreground/40">{t('rows_per_page', { defaultValue: 'Lignes / page' })}</label>
              <select
                value={rowsPerPage}
                onChange={(event) => {
                  const newValue = Number(event.target.value) as 10 | 15;
                  setRowsPerPage(newValue);
                  setOngoingPage(1);
                  setDeliveredPage(1);
                }}
                className="rounded-xl border border-white/10 bg-background px-3 py-2 text-sm text-foreground outline-none"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {['ID', t('Date'), t('Articles'), t('Statut'), 'Total'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedOngoingOrders.map(order => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-gold font-semibold">{order.id}</td>
                    <td className="px-5 py-4 text-xs text-foreground/40">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-5 py-4 text-xs text-foreground/60">{order.items.length} article{order.items.length > 1 ? 's' : ''}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusConfig[order.status]?.color}`}>
                        {statusConfig[order.status]?.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground">{formatPrice(order.total)}</td>
                  </tr>
                ))}
                {paginatedOngoingOrders.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-foreground/40">{t('none_found')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground/40">
            <span>{t('showing', { defaultValue: 'Affiché' })} {(ongoingPage - 1) * rowsPerPage + 1} - {Math.min(ongoingOrders.length, ongoingPage * rowsPerPage)} / {ongoingOrders.length}</span>
            <span>{t('page', { defaultValue: 'Page' })} {ongoingPage} / {ongoingPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOngoingPage((page) => Math.max(1, page - 1))}
                disabled={ongoingPage === 1}
                className="rounded-xl border border-white/10 px-3 py-2 disabled:opacity-50"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setOngoingPage((page) => Math.min(ongoingPages, page + 1))}
                disabled={ongoingPage === ongoingPages}
                className="rounded-xl border border-white/10 px-3 py-2 disabled:opacity-50"
              >
                <ChevronRightIcon size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-foreground">{t('delivered_orders', { defaultValue: 'Livrées' })}</h2>
              <p className="text-xs text-foreground/40">{deliveredOrders.length} {t('orders', { defaultValue: 'commandes' })}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {['ID', t('Date'), t('Articles'), t('Statut'), 'Total'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedDeliveredOrders.map(order => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-gold font-semibold">{order.id}</td>
                    <td className="px-5 py-4 text-xs text-foreground/40">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-5 py-4 text-xs text-foreground/60">{order.items.length} article{order.items.length > 1 ? 's' : ''}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusConfig[order.status]?.color}`}>
                        {statusConfig[order.status]?.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground">{formatPrice(order.total)}</td>
                  </tr>
                ))}
                {paginatedDeliveredOrders.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-foreground/40">{t('none_found')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground/40">
            <span>{t('showing', { defaultValue: 'Affiché' })} {(deliveredPage - 1) * rowsPerPage + 1} - {Math.min(deliveredOrders.length, deliveredPage * rowsPerPage)} / {deliveredOrders.length}</span>
            <span>{t('page', { defaultValue: 'Page' })} {deliveredPage} / {deliveredPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeliveredPage((page) => Math.max(1, page - 1))}
                disabled={deliveredPage === 1}
                className="rounded-xl border border-white/10 px-3 py-2 disabled:opacity-50"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setDeliveredPage((page) => Math.min(deliveredPages, page + 1))}
                disabled={deliveredPage === deliveredPages}
                className="rounded-xl border border-white/10 px-3 py-2 disabled:opacity-50"
              >
                <ChevronRightIcon size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Mes Commandes', desc: 'Voir toutes mes commandes', icon: <Package size={20} />, color: 'from-blue-500 to-blue-700', href: '/dashboard/client/orders' },
          { label: t('create_perfume_action'), desc: 'Atelier Numba', icon: <PerfumeIcon size={20} />, color: 'from-purple-500 to-purple-700', href: '/numba' },
          { label: t('my_favorites_action'), desc: 'Produits sauvegardés', icon: <Heart size={20} />, color: 'from-red-400 to-red-600', href: '/dashboard/client/favorites' },
          { label: t('loyalty_program_action'), desc: 'Vos récompenses', icon: <Star size={20} />, color: 'from-amber-400 to-amber-600', href: '#' },
          { label: t('settings_action'), desc: 'Langue, Devise, Apparence', icon: <Palette size={20} />, color: 'from-blue-400 to-blue-600', href: '/dashboard/client/profile' },
        ].map(a => (
          <button
            key={a.label}
            onClick={() => a.href !== '#' && router.push(a.href)}
            className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm hover:shadow-gold/5 transition-all text-left group"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-foreground mb-3 group-hover:scale-110 transition-transform`}>{a.icon}</div>
            <p className="font-semibold text-sm text-foreground">{a.label}</p>
            <p className="text-xs text-foreground/40 mt-0.5 flex items-center gap-1">{a.desc} <ChevronRight size={12} /></p>
          </button>
        ))}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-background rounded-2xl w-full max-w-2xl shadow-sm border border-white/10 max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 bg-background border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="font-bold text-foreground text-lg">{selectedOrder.id}</h3>
                <p className="text-xs text-foreground/40">{new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl hover:bg-white/5 text-foreground/40 hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statusConfig[selectedOrder.status]?.color}`}>
                  {statusConfig[selectedOrder.status]?.label}
                </span>
                <p className="text-xs text-foreground/40">{selectedOrder.items.length} article{selectedOrder.items.length > 1 ? 's' : ''}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-foreground/40 mb-0.5">Total</p>
                  <p className="text-sm font-semibold text-foreground">{formatPrice(selectedOrder.total)}</p>
                </div>
                <div className="bg-white/5 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-foreground/40 mb-0.5">Client</p>
                  <p className="text-sm font-semibold text-foreground">{selectedOrder.clientName}</p>
                </div>
                <div className="bg-white/5 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-foreground/40 mb-0.5">Téléphone</p>
                  <p className="text-sm font-semibold text-foreground">{selectedOrder.clientPhone}</p>
                </div>
                <div className="bg-white/5 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-foreground/40 mb-0.5">Créée le</p>
                  <p className="text-sm font-semibold text-foreground">{new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase text-foreground/40">Articles</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.productName}</p>
                        <p className="text-xs text-foreground/40">Quantité: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{formatPrice(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full border border-white/10 rounded-xl py-3 text-sm text-foreground/80 hover:bg-white/5 transition-colors"
              >
                {t('close', { defaultValue: 'Fermer' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

