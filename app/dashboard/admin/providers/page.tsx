'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Check, TrendingUp, DollarSign, Award, Loader2, CreditCard } from 'lucide-react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { BackButton } from '@/components/ui/BackButton';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showValidateModal, setShowValidateModal] = useState<any | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState<any | null>(null);
  
  // Form states
  const [commissionVal, setCommissionVal] = useState('10');
  const [discountVal, setDiscountVal] = useState('10');
  const [payoutAmount, setPayoutAmount] = useState('');
  
  const { addToast } = useToastStore();

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getProviders();
      const list = data.resultats || data.results || (Array.isArray(data) ? data : []);
      setProviders(list);
    } catch (error) {
      addToast('Erreur lors du chargement des prestataires', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleValidate = async () => {
    if (!showValidateModal) return;
    try {
      await adminService.validateProvider(showValidateModal.id, {
        taux_commission: parseFloat(commissionVal),
        reduction_client_pourcentage: parseFloat(discountVal),
      });
      addToast('Prestataire validé avec succès', 'success');
      setShowValidateModal(null);
      fetchProviders();
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la validation', 'error');
    }
  };

  const handlePayout = async () => {
    if (!showPayoutModal) return;
    try {
      await adminService.initiateProviderPayout(showPayoutModal.id, parseFloat(payoutAmount));
      addToast('Virement exécuté avec succès', 'success');
      setShowPayoutModal(null);
      setPayoutAmount('');
      fetchProviders();
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors du virement', 'error');
    }
  };

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
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Prestataires actifs', value: providers.filter(p => p.statut === 'actif' || p.is_active).length, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Demandes en attente', value: providers.filter(p => p.statut === 'attente' || p.status === 'attente').length, color: 'text-gold bg-gold/10' },
          { label: 'Solde disponible total', value: `${providers.reduce((s, p) => s + (p.solde || p.solde_disponible || 0), 0).toLocaleString()} FCFA`, color: 'text-amber-400 bg-amber-500/10' },
          { label: 'Gains historiques', value: `${providers.reduce((s, p) => s + (p.gains_historiques || p.total_gains || 0), 0).toLocaleString()} FCFA`, color: 'text-purple-400 bg-purple-500/10' },
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
                  {['Prestataire', 'Code Promo', 'Réduction', 'Commission', 'Solde', 'Historique', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {providers.map(p => {
                  const name = p.name || p.user_details?.first_name || p.first_name || 'Partenaire';
                  const email = p.email || p.user_details?.email || '';
                  const status = p.statut || (p.is_active ? 'actif' : 'inactif');
                  const isPending = status === 'attente' || status === 'pending';

                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-xs font-bold">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{name}</p>
                            <p className="text-[11px] text-foreground/40">{email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {p.code_promo || p.promoCode ? (
                          <span className="font-mono text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-lg font-semibold">
                            {p.code_promo || p.promoCode}
                          </span>
                        ) : (
                          <span className="text-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {p.reduction_client_pourcentage || p.discount || 0}%
                      </td>
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {p.taux_commission || p.commission || 0}%
                      </td>
                      <td className="px-5 py-4 font-semibold text-emerald-400">
                        {(p.solde || p.solde_disponible || 0).toLocaleString()} FCFA
                      </td>
                      <td className="px-5 py-4 font-semibold text-amber-400">
                        {(p.gains_historiques || p.total_gains || 0).toLocaleString()} FCFA
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleUpdateStatus(p.user_id || p.id)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all
                          ${status === 'actif' ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' : 
                            isPending ? 'text-gold bg-gold/10 hover:bg-gold/20' : 'text-foreground/40 bg-white/5 hover:bg-white/10'}`}
                        >
                          {status}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {isPending && (
                            <button
                              onClick={() => {
                                setShowValidateModal(p);
                                setCommissionVal('10');
                                setDiscountVal('10');
                              }}
                              className="p-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold hover:text-black transition-all"
                              title="Valider la candidature"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          {status === 'actif' && (
                            <button
                              onClick={() => {
                                setShowPayoutModal(p);
                                setPayoutAmount('');
                              }}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all"
                              title="Effectuer un virement"
                            >
                              <CreditCard size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {providers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-foreground/40 italic">Aucun prestataire trouvé.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Validation Modal */}
      {showValidateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10">
            <h3 className="font-bold text-foreground mb-1">Valider le prestataire</h3>
            <p className="text-xs text-foreground/40 mb-4">
              Candidat: {showValidateModal.name || showValidateModal.user_details?.first_name || showValidateModal.first_name}
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground/40 uppercase mb-1 block">Taux de commission (%)</label>
                <input
                  type="number"
                  value={commissionVal}
                  onChange={e => setCommissionVal(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/40 uppercase mb-1 block">Réduction client (%)</label>
                <input
                  type="number"
                  value={discountVal}
                  onChange={e => setDiscountVal(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowValidateModal(null)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">Annuler</button>
              <button onClick={handleValidate} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors">Valider & Générer Code</button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10">
            <h3 className="font-bold text-foreground mb-1">Exécuter un virement</h3>
            <p className="text-xs text-foreground/40 mb-4">
              Bénéficiaire: {showPayoutModal.name || showPayoutModal.user_details?.first_name || showPayoutModal.first_name}
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground/40 uppercase mb-1 block">Montant du virement (FCFA)</label>
                <input
                  type="number"
                  placeholder="Ex: 50000"
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPayoutModal(null)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">Annuler</button>
              <button onClick={handlePayout} className="flex-1 bg-emerald-500 text-black rounded-lg py-2.5 text-sm font-bold hover:bg-emerald-400 transition-colors">Transmettre à Monetbil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
