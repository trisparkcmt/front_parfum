'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuthStore } from '@/store/useAuthStore';
import { mockOrders } from '@/lib/mock-data/orders';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';
import { Percent, Activity } from 'lucide-react';
import { COMMISSION_RATE_DEFAULT } from '@/lib/constants';

export default function PartnerDashboard() {
  useAuthGuard(['partner', 'admin']);
  const { user } = useAuthStore();

  // MOCK: find orders that used this partner's promo code
  // Let's assume partner code is user's first name uppercase
  const partnerCode = user?.firstName?.toUpperCase() || 'PARTNER';
  const partnerOrders = mockOrders.filter(o => o.promoCode === partnerCode);
  
  const totalSales = partnerOrders.reduce((sum, order) => sum + order.total, 0);
  const totalCommission = totalSales * COMMISSION_RATE_DEFAULT;

  return (
    <div className="space-y-8">
      {/* Commission Overview */}
      <div className="bg-gradient-to-br from-gold/20 to-charcoal border border-gold/30 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-gold/5">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Percent size={120} />
        </div>
        <div className="relative z-10">
          <h2 className="font-display text-2xl font-bold mb-2">Vos Commissions</h2>
          <p className="text-foreground/70 mb-8 max-w-md">
            Gagnez {(COMMISSION_RATE_DEFAULT * 100).toFixed(0)}% sur chaque vente réalisée avec votre code promo <strong className="text-gold bg-gold/10 px-2 py-1 rounded">{partnerCode}</strong>.
          </p>
          
          <div className="flex flex-wrap items-end gap-8">
            <div>
              <p className="text-sm text-foreground/60 uppercase tracking-wider mb-1">Total Généré</p>
              <p className="font-display text-4xl font-bold text-gold">{formatPrice(totalCommission)}</p>
            </div>
            <div className="pb-1 text-sm text-foreground/50 border-l border-white/20 pl-8">
              Chiffre d'affaires apporté: <br className="md:hidden" />
              <span className="font-medium text-white md:ml-1">{formatPrice(totalSales)}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl font-bold mb-6">Ventes récentes</h2>
        <div className="bg-charcoal border border-white/10 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-foreground/60 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">ID Commande</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Montant Vente</th>
                  <th className="px-6 py-4 font-bold text-gold">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {partnerOrders.map(order => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">#{order.id.split('-')[0]}</td>
                    <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <Badge variant={order.status === 'delivered' ? 'success' : 'default'}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">{formatPrice(order.total)}</td>
                    <td className="px-6 py-4 font-bold text-gold">
                      +{formatPrice(order.total * COMMISSION_RATE_DEFAULT)}
                    </td>
                  </tr>
                ))}
                {partnerOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-foreground/50">
                      <Activity size={48} className="mx-auto mb-4 opacity-20" />
                      Aucune vente enregistrée avec votre code pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
