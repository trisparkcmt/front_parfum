'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Truck, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { BackButton } from '@/components/ui/BackButton';

export default function DeliveryPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [userIdVal, setUserIdVal] = useState('');
  
  const { addToast } = useToastStore();

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getDeliveryDrivers();
      const list = data.resultats || data.results || (Array.isArray(data) ? data : []);
      setDrivers(list);
    } catch (error) {
      addToast('Erreur lors du chargement des livreurs', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handlePromote = async () => {
    if (!userIdVal) return;
    try {
      await adminService.promoteToDriver(parseInt(userIdVal));
      addToast('Utilisateur promu au rang de livreur avec succès', 'success');
      setShowModal(false);
      setUserIdVal('');
      fetchDrivers();
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la promotion', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Livreurs</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Gestion des livreurs de la flotte</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80 transition-all shadow-lg"
        >
          <Plus size={16} />
          Promouvoir un livreur
        </button>
      </div>

      {/* Driver cards / list */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des livreurs...</p>
          </div>
        ) : (
          <div className="p-6">
            <h2 className="font-semibold text-foreground mb-4">Livreurs de la Flotte</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {drivers.map(d => {
                const name = d.name || d.user_details?.first_name || d.first_name || 'Livreur';
                const email = d.email || d.user_details?.email || '';
                const phone = d.telephone || d.user_details?.telephone || '—';

                return (
                  <div key={d.id} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl hover:border-gold/30 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black font-bold">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{name}</p>
                        <p className="text-[11px] text-foreground/40">{email}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-foreground/60 border-t border-white/5 pt-3">
                      <p><span className="text-foreground/40">Téléphone:</span> {phone}</p>
                      <p><span className="text-foreground/40">User ID:</span> {d.user_id || d.id}</p>
                    </div>
                  </div>
                );
              })}
              {drivers.length === 0 && (
                <div className="col-span-full py-10 text-center text-foreground/40 italic">
                  Aucun livreur dans la flotte actuellement.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-white/10">
            <h3 className="font-bold text-foreground mb-1">Promouvoir en tant que Livreur</h3>
            <p className="text-xs text-foreground/40 mb-4">Attribue le rôle opérationnel à l'utilisateur.</p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">ID de l'utilisateur</label>
                <input
                  type="number"
                  placeholder="Ex: 42"
                  value={userIdVal}
                  onChange={e => setUserIdVal(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">Annuler</button>
              <button onClick={handlePromote} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-medium hover:bg-gold/80 transition-colors">Promouvoir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
