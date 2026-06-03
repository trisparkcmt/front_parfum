'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, TrendingUp, Tag, Loader2 } from 'lucide-react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { BackButton } from '@/components/ui/BackButton';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDiscount, setEditDiscount] = useState<string | null>(null);
  const [discountVal, setDiscountVal] = useState('');
  const { addToast } = useToastStore();

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const data = await adminService.getProviders();
      // Support for both 'resultats' and 'results' pagination keys
      const list = data.resultats || data.results || (Array.isArray(data) ? data : []);
      setProviders(list);
    } catch (error) {
      addToast('Erreur lors du chargement des prestataires', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleUpdateStatus = async (userId: number) => {
    try {
      await adminService.toggleUserStatus(userId);
      addToast('Statut mis à jour', 'success');
      fetchProviders();
    } catch (error) {
      addToast('Erreur lors de la mise à jour', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prestataires</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Codes promo, ventes et commissions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80 transition-all shadow-lg"
        >
          <Plus size={16} />
          Ajouter prestataire
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Prestataires actifs', value: providers.filter(p => p.statut === 'actif' || p.is_active).length, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Total ventes', value: providers.reduce((s, p) => s + (p.sales || 0), 0), color: 'text-gold bg-gold/10' },
          { label: 'Revenu total généré', value: '26.9M FCFA', color: 'text-amber-400 bg-amber-500/10' },
          { label: 'Commissions versées', value: '3.5M FCFA', color: 'text-purple-400 bg-purple-500/10' },
        ].map(k => (
          <div key={k.label} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${k.color}`}>
              <TrendingUp size={18} />
            </div>
            <p className="text-2xl font-bold text-foreground">{k.value}</p>
            <p className="text-xs text-foreground/40 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des données...</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                {['Prestataire', 'Code Promo', 'Réduction', 'Ventes', 'Revenu Généré', 'Commission', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {providers.map(p => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-xs font-bold">
                        {(p.name || p.first_name || 'P').charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{p.name || `${p.first_name} ${p.last_name}`}</p>
                        <p className="text-[11px] text-foreground/40">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-lg font-semibold">
                      {p.promoCode}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {editDiscount === p.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={discountVal}
                          onChange={e => setDiscountVal(e.target.value)}
                          className="w-16 bg-white/5 border border-gold rounded-lg px-2 py-1 text-xs text-foreground outline-none"
                        />
                        <button
                          onClick={() => setEditDiscount(null)}
                          className="text-[11px] bg-gold text-black px-2 py-1 rounded-lg font-bold"
                        >OK</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{p.discount}%</span>
                        <button
                          onClick={() => { setEditDiscount(p.id); setDiscountVal(String(p.discount)); }}
                          className="p-1 rounded hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 font-semibold text-foreground">{p.sales || 0}</td>
                  <td className="px-5 py-4 font-semibold text-emerald-400">{p.revenue || 0} FCFA</td>
                  <td className="px-5 py-4 font-semibold text-amber-400">{p.commission || 0} FCFA</td>
                  <td className="px-5 py-4">
                    <button 
                      onClick={() => handleUpdateStatus(p.user_id || p.id)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all
                      ${(p.status === 'actif' || p.is_active) ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-foreground/40 bg-white/5 hover:bg-white/10'}`}>
                      {p.status || (p.is_active ? 'actif' : 'inactif')}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <button className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                      <Tag size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10">
            <h3 className="font-bold text-foreground mb-4">Ajouter un prestataire</h3>
            <div className="space-y-3">
              <input placeholder="Nom complet" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
              <input placeholder="Email" type="email" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
              <input placeholder="Code promo (ex: NOM15)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold uppercase" />
              <div className="flex items-center gap-3">
                <input placeholder="% de réduction" type="number" min="1" max="50" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                <span className="text-foreground/40 text-sm">%</span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">Annuler</button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-medium hover:bg-gold/80 transition-colors">Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
