'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuthStore } from '@/store/useAuthStore';
import { mockOrders } from '@/lib/mock-data/orders';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';
import { Package, Droplets } from 'lucide-react';

export default function ClientDashboard() {
  useAuthGuard(['client', 'admin']);
  const { user } = useAuthStore();

  // In a real app, fetch orders for this specific client
  const clientOrders = mockOrders.filter(o => o.clientId === user?.id);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-foreground/60">Commandes Totales</p>
              <h3 className="font-display text-2xl font-bold">{clientOrders.length}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Droplets size={24} />
            </div>
            <div>
              <p className="text-sm text-foreground/60">Créations Numba</p>
              <h3 className="font-display text-2xl font-bold">
                {clientOrders.reduce((acc, order) => acc + order.items.filter(i => i.type === 'custom-composition').length, 0)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl font-bold mb-6">Historique des commandes</h2>
        <div className="bg-charcoal border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-foreground/60 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">ID Commande</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clientOrders.map(order => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">#{order.id.split('-')[0]}</td>
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
                    <td className="px-6 py-4 text-right">
                      <button className="text-gold hover:underline">Détails</button>
                    </td>
                  </tr>
                ))}
                {clientOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-foreground/50">
                      Vous n'avez pas encore passé de commande.
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
