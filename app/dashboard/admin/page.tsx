'use client';

/**
 * @file app/dashboard/admin/page.tsx
 * @description Centralized Administrator Dashboard.
 *
 * This page serves as the primary command center for the Accessories Exclusif platform.
 * 
 * **Key Modules**:
 * - **Security**: Protected by `useAuthGuard(['admin'])` to prevent unauthorized access.
 * - **Metrics Overview**: Displays high-level KPIs such as Total Revenue, Order Volume, and Active Users using a grid of statistic cards.
 * - **Performance Tracking**: Features (mocked) growth charts or status breakdowns for recent platform activity.
 * - **Management Shortcuts**: Provides quick links to manage the product catalog, oversee partner registrations, and monitor the delivery system.
 * 
 * It acts as the operational entry point for the site owner to monitor business health.
 */
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { mockOrders } from '@/lib/mock-data/orders';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';
import { Activity, Users, ShoppingBag, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  useAuthGuard(['admin']);

  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = mockOrders.filter(o => o.status === 'pending' || o.status === 'processing');

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/5 border border-white/10  p-6 shadow-lg shadow-black/20">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10  bg-gold/20 flex items-center justify-center text-gold">
              <TrendingUp size={20} />
            </div>
            <p className="text-sm text-foreground/60 font-medium">Chiffre d'Affaires</p>
          </div>
          <h3 className="font-display text-2xl font-bold">{formatPrice(totalRevenue)}</h3>
        </div>

        <div className="bg-white/5 border border-white/10  p-6 shadow-lg shadow-black/20">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10  bg-blue-500/20 flex items-center justify-center text-blue-400">
              <ShoppingBag size={20} />
            </div>
            <p className="text-sm text-foreground/60 font-medium">Commandes Totales</p>
          </div>
          <h3 className="font-display text-2xl font-bold">{mockOrders.length}</h3>
        </div>

        <div className="bg-white/5 border border-white/10  p-6 shadow-lg shadow-black/20">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10  bg-orange-500/20 flex items-center justify-center text-orange-400">
              <Activity size={20} />
            </div>
            <p className="text-sm text-foreground/60 font-medium">À Traiter</p>
          </div>
          <h3 className="font-display text-2xl font-bold">{pendingOrders.length}</h3>
        </div>

        <div className="bg-white/5 border border-white/10  p-6 shadow-lg shadow-black/20">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10  bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users size={20} />
            </div>
            <p className="text-sm text-foreground/60 font-medium">Utilisateurs Actifs</p>
          </div>
          <h3 className="font-display text-2xl font-bold">124</h3>
        </div>
      </div>

      {/* Recent Orders List */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl font-bold">Commandes Récentes</h2>
          <button className="text-sm text-gold hover:underline">Voir tout</button>
        </div>

        <div className="bg-charcoal border border-white/10  overflow-hidden shadow-lg shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-foreground/60 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Montant</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mockOrders.slice(0, 8).map(order => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">#{order.id.split('-')[0]}</td>
                    <td className="px-6 py-4">{order.clientName || order.clientId}</td>
                    <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        order.status === 'delivered' ? 'success' :
                          order.status === 'shipped' ? 'info' :
                            order.status === 'processing' ? 'warning' : 'default'
                      }>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-bold">{formatPrice(order.total)}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                      <button className="text-foreground/60 hover:text-white transition-colors">Gérer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
