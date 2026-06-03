'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { formatPrice } from '@/lib/utils';
import { useToastStore } from '@/store/useToastStore';
import { useRouter } from 'next/navigation';
import { 
  MapPin, Phone, CheckCircle, Clock, Truck, 
  Navigation, Package, Palette, ChevronRight 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BackButton } from '@/components/ui/BackButton';
import { useDeliveryDashboard } from '@/hooks/useDeliveryDashboard';

export default function DeliveryDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { tasks, stats, loading } = useDeliveryDashboard();

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    assigned: { label: t('status_pending'), color: 'text-amber-400', bg: 'bg-amber-400/10' },
    in_transit: { label: t('status_delivering'), color: 'text-blue-400', bg: 'bg-blue-400/10' },
    delivering: { label: t('status_delivering'), color: 'text-blue-400', bg: 'bg-blue-400/10' },
    delivered: { label: t('status_delivered'), color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  };

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    addToast(`${t('status_updated')}: ${statusConfig[newStatus as keyof typeof statusConfig]?.label}`, 'success');
  };

  const pendingTasks = tasks.filter(t => t.status !== 'delivered');
  const completedTasks = tasks.filter(t => t.status === 'delivered');

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-foreground relative overflow-hidden shadow-xl shadow-emerald-500/20">
        <div className="absolute top-0 right-0 opacity-10">
          <Truck size={120} />
        </div>
        <div className="relative z-10">
          <p className="text-sm text-foreground/70 mb-1 font-medium">{t('hello_comma')}</p>
          <h1 className="text-2xl font-bold mb-1">{user?.firstName} {user?.lastName}</h1>
          <p className="text-sm text-foreground/70">
            {pendingTasks.length > 0
              ? t('deliveries_pending', { count: pendingTasks.length, plural: pendingTasks.length > 1 ? 's' : '' })
              : t('no_missions_desc')}
          </p>
        </div>
      </div>

       {/* Stats */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         {[
           { label: t('to_deliver_label'), value: stats.totalAssigned - stats.totalDelivered, icon: <Clock size={18} />, color: 'text-amber-400 bg-amber-400/10' },
           { label: t('delivered_tab'), value: stats.totalDelivered, icon: <CheckCircle size={18} />, color: 'text-emerald-400 bg-emerald-400/10' },
           { label: t('total_missions_label'), value: stats.totalAssigned, icon: <Package size={18} />, color: 'text-gold bg-gold/10' },
           { label: t('status_delivering'), value: pendingTasks.filter(t => t.status === 'delivering' || t.status === 'in_transit').length, icon: <Navigation size={18} />, color: 'text-blue-400 bg-blue-400/10' },
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
        <div className="space-y-4">
          {pendingTasks.map(task => {
            const st = statusConfig[task.status] || statusConfig.assigned;
            return (
              <div key={task.orderId} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl hover:shadow-gold/5 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight ${st.color} ${st.bg}`}>
                      {st.label}
                    </span>
                    <p className="font-bold text-foreground text-lg mt-2 group-hover:text-gold transition-colors">{t('order_label')} #{task.orderId.split('-')[0]}</p>
                    <p className="text-xs text-foreground/40">{task.clientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-foreground/40">{t('amount_label')}</p>
                    <p className="font-bold text-foreground">{formatPrice(task.total)}</p>
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
                   {(task.status === 'delivering' || task.status === 'assigned') && (
                     <>
                       <button
                         onClick={() => handleUpdateStatus(task.orderId, 'in_transit')}
                         className="flex-1 bg-white/10 border border-white/10 text-foreground py-2.5 rounded-xl text-sm font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                       >
                         <Navigation size={14} /> {t('start_action')}
                       </button>
                       <button
                         onClick={() => handleUpdateStatus(task.orderId, 'delivered')}
                         className="flex-1 bg-gold text-black py-2.5 rounded-xl text-sm font-bold hover:bg-gold/80 transition-all flex items-center justify-center gap-2"
                       >
                         <CheckCircle size={14} /> {t('status_delivered')}
                       </button>
                     </>
                   )}
                   {task.status === 'in_transit' && (
                     <button
                       onClick={() => handleUpdateStatus(task.orderId, 'delivered')}
                       className="w-full bg-gold text-black py-2.5 rounded-xl text-sm font-bold hover:bg-gold/80 transition-all flex items-center justify-center gap-2"
                     >
                       <CheckCircle size={14} /> {t('marked_delivered_action')}
                     </button>
                   )}
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button 
          onClick={() => router.push('/dashboard/delivery/profile')}
          className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl hover:shadow-gold/5 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-foreground mb-3 group-hover:scale-110 transition-transform">
            <Palette size={20} />
          </div>
          <p className="font-semibold text-sm text-foreground">{t('settings_action')}</p>
          <p className="text-xs text-foreground/40 mt-0.5 flex items-center gap-1">{t('appearance_desc', { defaultValue: 'Langue, Devise, Apparence' })} <ChevronRight size={12} /></p>
        </button>
      </div>
    </div>
  );
}



