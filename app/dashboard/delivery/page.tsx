'use client';

/**
 * @file app/dashboard/delivery/page.tsx
 * @description Logistics & Delivery Personnel Dashboard.
 *
 * This page is designed for delivery agents to manage their active shipment queue efficiently.
 * 
 * **Functionalities**:
 * - **Security & Role-Based Access**: Restricted to users with the 'delivery' or 'admin' roles using the `useAuthGuard` hook.
 * - **Task Management**: Filters the `mockDeliveryTasks` dataset to show only missions assigned to the current agent.
 * - **Mission Overview**: Displays summary statistics for "Pending" and "Completed" deliveries using status cards.
 * - **Mobile-First Logistics Card**: Features a specialized task card that displays:
 *   - Order ID and Status Badge.
 *   - Delivery Address with MapPin icon.
 *   - Click-to-call Customer Phone link.
 *   - Cash-on-delivery (COD) amount collection info.
 * - **Workflow Actions**: Implements state updates for "Démarrer la course" (In Transit) and "Marquer Livrée" (Delivered).
 * 
 * **User Feedback**: Utilizes `useToastStore` to confirm status changes to the agent.
 */
import { useState } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuthStore } from '@/store/useAuthStore';
import { mockDeliveryTasks } from '@/lib/mock-data/orders';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MapPin, Phone, CheckCircle, Clock } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';

export default function DeliveryDashboard() {
  useAuthGuard(['delivery', 'admin']);
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [tasks, setTasks] = useState(mockDeliveryTasks.filter(t => t.deliveryPersonId === user?.id));

  const handleUpdateStatus = (taskId: string, newStatus: any) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    addToast(`Statut mis à jour : ${newStatus === 'in_transit' ? 'En route' : 'Livré'}`, 'success');
  };

  const pendingTasks = tasks.filter(t => t.status !== 'delivered');
  const completedTasks = tasks.filter(t => t.status === 'delivered');

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white/5 border border-white/10  p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12  bg-orange-500/20 flex items-center justify-center text-orange-400">
              <Clock size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-foreground/60">À livrer</p>
              <h3 className="font-display text-xl md:text-2xl font-bold">{pendingTasks.length}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10  p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12  bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-foreground/60">Livrées</p>
              <h3 className="font-display text-xl md:text-2xl font-bold">{completedTasks.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Task List (Mobile First Design) */}
      <div>
        <h2 className="font-display text-xl md:text-2xl font-bold mb-4 md:mb-6">Missions du jour</h2>
        <div className="space-y-4">
          {pendingTasks.map(task => (
            <div key={task.id} className="bg-charcoal border border-white/10  p-4 md:p-6 shadow-lg shadow-black/20">
              <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                <div>
                  <Badge variant={task.status === 'in_transit' ? 'info' : 'warning'} className="mb-2">
                    {task.status === 'in_transit' ? 'En route' : 'Assignée'}
                  </Badge>
                  <p className="font-bold text-lg">Commande #{task.orderId.split('-')[0]}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex items-start gap-3 text-foreground/80">
                  <MapPin size={18} className="text-gold shrink-0 mt-0.5" />
                  <span>{task.deliveryAddress}</span>
                </div>
                {task.customerPhone && (
                  <div className="flex items-center gap-3 text-foreground/80">
                    <Phone size={18} className="text-gold shrink-0" />
                    <a href={`tel:${task.customerPhone}`} className="hover:text-gold transition-colors">{task.customerPhone}</a>
                  </div>
                )}
                <div className="flex items-center justify-between bg-white/5 p-3  mt-4 border border-white/5">
                  <span className="text-foreground/60">Montant à récupérer</span>
                  <span className="font-bold text-gold">{task.amountToCollect ? `${task.amountToCollect.toLocaleString('fr-FR')} FCFA` : 'Déjà payé'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {task.status === 'assigned' && (
                  <Button
                    className="w-full"
                    onClick={() => handleUpdateStatus(task.id, 'in_transit')}
                  >
                    Démarrer la course
                  </Button>
                )}
                {task.status === 'in_transit' && (
                  <Button
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-none"
                    onClick={() => handleUpdateStatus(task.id, 'delivered')}
                  >
                    Marquer Livrée
                  </Button>
                )}
              </div>
            </div>
          ))}

          {pendingTasks.length === 0 && (
            <div className="text-center py-12 bg-white/5  border border-white/10">
              <CheckCircle size={48} className="text-emerald-500/50 mx-auto mb-4" />
              <p className="text-foreground/60">Aucune mission en cours.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
