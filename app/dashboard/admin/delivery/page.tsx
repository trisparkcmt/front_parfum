'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Truck, CheckCircle, Clock, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';

export default function DeliveryPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [userIdVal, setUserIdVal] = useState('');
  
  const { addToast } = useToastStore();

  const fetchDriversAndDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      const [driversData, deliveriesData] = await Promise.all([
        adminService.getDeliveryDrivers(),
        adminService.getDeliveries()
      ]);
      const list = driversData.resultats || driversData.results || (Array.isArray(driversData) ? driversData : []);
      const delList = deliveriesData.resultats || deliveriesData.results || (Array.isArray(deliveriesData) ? deliveriesData : []);
      setDrivers(list);
      setDeliveries(delList);
    } catch (error) {
      addToast('Erreur lors du chargement des données de livraison', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDriversAndDeliveries();
  }, [fetchDriversAndDeliveries]);

  const handlePromote = async () => {
    if (!userIdVal) return;
    try {
      await adminService.promoteToDriver(parseInt(userIdVal));
      addToast('Utilisateur promu au rang de livreur avec succès', 'success');
      setShowModal(false);
      setUserIdVal('');
      fetchDriversAndDeliveries();
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la promotion', 'error');
    }
  };

  const handleToggleStatus = async (id: number, currentStatut: string) => {
    const nextStatut = currentStatut === 'disponible' ? 'indisponible' : 'disponible';
    try {
      await adminService.updateDeliveryDriver(id, { statut: nextStatut });
      addToast('Statut du livreur mis à jour', 'success');
      fetchDriversAndDeliveries();
    } catch (error: any) {
      addToast('Erreur lors du modification du statut', 'error');
    }
  };

  const handleDeleteDriver = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer ce livreur ?')) return;
    try {
      await adminService.deleteDeliveryDriver(id);
      addToast('Livreur supprimé de la flotte avec succès', 'success');
      fetchDriversAndDeliveries();
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la suppression', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Livreurs & Flotte</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Gestion des livreurs et suivi opérationnel</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDriversAndDeliveries}
            className="flex items-center justify-center p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-foreground/60 hover:text-foreground transition-all"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80 transition-all shadow-lg"
          >
            <Plus size={16} />
            Promouvoir un livreur
          </button>
        </div>
      </div>

      {/* Driver cards / list */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[200px]">
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
                const status = d.statut || 'disponible';
                const deliveriesCount = d.nombre_livraisons || 0;

                return (
                  <div key={d.id} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl hover:border-gold/30 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold/60 flex items-center justify-center text-black font-bold">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{name}</p>
                            <p className="text-[11px] text-foreground/40">{email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] uppercase font-bold px-2 py-1 rounded-full ${
                            status === 'disponible' ? 'bg-green-500/20 text-green-400' :
                            status === 'en_livraison' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {status}
                          </span>
                          <button
                            onClick={() => handleDeleteDriver(d.id)}
                            className="p-1 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors"
                            title="Supprimer le livreur"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-foreground/60 border-t border-white/5 pt-3 mb-4">
                        <p><span className="text-foreground/40">Téléphone:</span> {phone}</p>
                        <p><span className="text-foreground/40">Date Embauche:</span> {d.date_embauche || '—'}</p>
                        <p><span className="text-foreground/40">Total Livraisons:</span> {deliveriesCount}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleToggleStatus(d.id, status)}
                      disabled={status === 'en_livraison'}
                      className={`w-full py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        status === 'disponible' 
                          ? 'border-red-500/20 hover:bg-red-500/10 text-red-400' 
                          : 'border-green-500/20 hover:bg-green-500/10 text-green-400'
                      } disabled:opacity-50`}
                    >
                      {status === 'disponible' ? 'Rendre indisponible' : 'Rendre disponible'}
                    </button>
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

      {/* Deliveries list */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden mt-6">
        <div className="p-6">
          <h2 className="font-semibold text-foreground mb-4">Suivi Global des Livraisons</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs text-foreground/40 uppercase">
                  <th className="py-3 px-4">Commande</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Quartier / Ville</th>
                  <th className="py-3 px-4">Paiement</th>
                  <th className="py-3 px-4">Montant</th>
                  <th className="py-3 px-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-foreground/80">
                {deliveries.map(del => (
                  <tr key={del.id} className="hover:bg-white/5">
                    <td className="py-3 px-4 font-mono">{del.numero_commande}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{del.livraison_nom_complet}</p>
                      <p className="text-[10px] text-foreground/40">{del.livraison_telephone}</p>
                    </td>
                    <td className="py-3 px-4">{del.livraison_quartier}, {del.livraison_ville}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize">{del.methode_paiement}</span>
                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${del.statut_paiement === 'payé' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {del.statut_paiement}
                      </span>
                    </td>
                    <td className="py-3 px-4">{del.total_ttc} FCFA</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                        del.statut_livraison === 'livrée' ? 'bg-green-500/20 text-green-400' :
                        del.statut_livraison === 'échouée' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {del.statut_livraison}
                      </span>
                    </td>
                  </tr>
                ))}
                {deliveries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-foreground/40 italic">
                      Aucune livraison en cours actuellement.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
