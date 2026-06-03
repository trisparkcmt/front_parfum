'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { formatPrice } from '@/lib/utils';
import { Package, Droplets, ShoppingBag, Heart, Eye, Calendar, CreditCard, Star, ChevronRight, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/ui/BackButton';
import { Order } from '@/types';
import { useClientDashboard } from '@/hooks/useClientDashboard';

export default function ClientDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { orders, loading } = useClientDashboard();
  const [activeTab, setActiveTab] = useState<'all' | 'delivered' | 'pending'>('all');

  const statusConfig = {
    pending: { label: t('status_pending'), color: 'text-amber-400 bg-amber-400/10' },
    validated: { label: t('status_validated'), color: 'text-blue-400 bg-blue-400/10' },
    delivering: { label: t('status_delivering'), color: 'text-purple-400 bg-purple-400/10' },
    delivered: { label: t('status_delivered'), color: 'text-emerald-400 bg-emerald-400/10' },
    cancelled: { label: t('status_cancelled'), color: 'text-red-400 bg-red-400/10' },
  };


  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const totalSpent = orders.reduce((acc, o) => acc + o.total, 0);
  const compositionCount = orders.reduce(
    (acc, order) => acc + order.items.filter(i => i.type === 'custom-composition').length, 0
  );
  const filteredOrders = activeTab === 'all' ? orders
    : activeTab === 'delivered' ? orders.filter(o => o.status === 'delivered')
      : orders.filter(o => o.status !== 'delivered');

  return (
    <div className="space-y-6">
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
          { label: t('numba_creations_count'), value: compositionCount, icon: <Droplets size={18} />, color: 'text-purple-400 bg-purple-400/10' },
          { label: t('total_spent_label'), value: formatPrice(totalSpent), icon: <CreditCard size={18} />, color: 'text-amber-400 bg-amber-400/10' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-foreground/40 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-foreground">{t('order_history')}</h2>
          <div className="flex gap-2">
            {(['all', 'pending', 'delivered'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === tab ? 'bg-gold text-black' : 'border border-white/10 text-foreground/40 hover:bg-white/5'}`}>
                {tab === 'all' ? t('all_tab') : tab === 'delivered' ? t('delivered_tab') : t('pending_tab')}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                {['ID', t('Date'), t('Articles'), t('Statut'), 'Total', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-gold font-semibold">#{order.id.split('-')[0]}</td>
                  <td className="px-5 py-4 text-xs text-foreground/40">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-5 py-4 text-xs text-foreground/60">{order.items.length} article{order.items.length > 1 ? 's' : ''}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusConfig[order.status]?.color}`}>
                      {statusConfig[order.status]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-foreground">{formatPrice(order.total)}</td>
                  <td className="px-5 py-4">
                    <button className="p-1.5 rounded-lg hover:bg-gold/10 text-foreground/40 hover:text-gold transition-colors"><Eye size={14} /></button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-foreground/40">{t('none_found')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t('create_perfume_action'), desc: 'Atelier Numba', icon: <Droplets size={20} />, color: 'from-purple-500 to-purple-700', href: '/numba' },
          { label: t('my_favorites_action'), desc: 'Produits sauvegardés', icon: <Heart size={20} />, color: 'from-red-400 to-red-600', href: '/dashboard/client/favorites' },
          { label: t('loyalty_program_action'), desc: 'Vos récompenses', icon: <Star size={20} />, color: 'from-amber-400 to-amber-600', href: '#' },
          { label: t('settings_action'), desc: 'Langue, Devise, Apparence', icon: <Palette size={20} />, color: 'from-blue-400 to-blue-600', href: '/dashboard/client/profile' },
        ].map(a => (
          <button
            key={a.label}
            onClick={() => a.href !== '#' && router.push(a.href)}
            className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl hover:shadow-gold/5 transition-all text-left group"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-foreground mb-3 group-hover:scale-110 transition-transform`}>{a.icon}</div>
            <p className="font-semibold text-sm text-foreground">{a.label}</p>
            <p className="text-xs text-foreground/40 mt-0.5 flex items-center gap-1">{a.desc} <ChevronRight size={12} /></p>
          </button>
        ))}
      </div>
    </div>
  );
}


