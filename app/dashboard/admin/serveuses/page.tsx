'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, UserCheck, Loader2, RefreshCw, Trash2, Power } from 'lucide-react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';

export default function ServeusesPage() {
  const [serveuses, setServeuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [userIdVal, setUserIdVal] = useState('');
  const { addToast } = useToastStore();

  const fetchServeuses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getServeuses();
      const list = data.resultats || data.results || (Array.isArray(data) ? data : []);
      setServeuses(list);
    } catch (error) {
      addToast('Erreur lors du chargement des serveuses', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchServeuses();
  }, [fetchServeuses]);

  const handlePromote = async () => {
    if (!userIdVal) return;
    try {
      await adminService.promoteToServeuse(parseInt(userIdVal));
      addToast('Utilisateur promu au rang de serveuse avec succès', 'success');
      setShowModal(false);
      setUserIdVal('');
      fetchServeuses();
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la promotion', 'error');
    }
  };

  const handleToggleStatus = async (id: number, currentActif: boolean) => {
    try {
      await adminService.updateServeuse(id, { actif: !currentActif });
      addToast('Statut de la serveuse mis à jour', 'success');
      fetchServeuses();
    } catch (error: any) {
      addToast('Erreur lors de la modification du statut', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette serveuse ?')) return;
    try {
      await adminService.deleteServeuse(id);
      addToast('Serveuse supprimée avec succès', 'success');
      fetchServeuses();
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la suppression', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Serveuses</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Promouvoir, désactiver et gérer les serveuses de la boutique</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchServeuses}
            className="flex items-center justify-center p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-foreground/60 hover:text-foreground transition-all"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80 transition-all shadow-lg"
          >
            <Plus size={16} />
            Promouvoir une serveuse
          </button>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des serveuses...</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {serveuses.map(s => {
                const details = s.user_details || s;
                const name = `${details.first_name || ''} ${details.last_name || ''}`.trim() || 'Serveuse';
                const email = details.email || '';
                const phone = details.telephone || '—';
                const isActive = s.actif !== undefined ? s.actif : true;

                return (
                  <div key={s.id} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm hover:border-gold/30 transition-all flex flex-col justify-between">
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
                            isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {isActive ? 'active' : 'inactive'}
                          </span>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors"
                            title="Supprimer la serveuse"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-foreground/60 border-t border-white/5 pt-3 mb-4">
                        <p><span className="text-foreground/40">Téléphone:</span> {phone}</p>
                        <p><span className="text-foreground/40">Date Ajout:</span> {s.cree_le ? new Date(s.cree_le).toLocaleDateString('fr-FR') : '—'}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleToggleStatus(s.id, isActive)}
                      className={`w-full py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                        isActive 
                          ? 'border-red-500/20 hover:bg-red-500/10 text-red-400' 
                          : 'border-green-500/20 hover:bg-green-500/10 text-green-400'
                      }`}
                    >
                      <Power size={12} />
                      {isActive ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                );
              })}
              {serveuses.length === 0 && (
                <div className="col-span-full py-10 text-center text-foreground/40 italic">
                  Aucune serveuse dans l'équipe actuellement.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-sm border border-white/10">
            <h3 className="font-bold text-foreground mb-1">Promouvoir en tant que Serveuse</h3>
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
