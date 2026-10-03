'use client';

import React, { useEffect, useState } from 'react';
import { boutiqueService } from '@/services/apiService';
import { BoutiquePortefeuille, BoutiqueVente } from '@/types';
import { useToastStore } from '@/store/useToastStore';
import { Loader2, TrendingUp, DollarSign, Wallet, History } from 'lucide-react';

export default function VendorDashboardPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [wallet, setWallet] = useState<BoutiquePortefeuille | null>(null);
  const [ventes, setVentes] = useState<BoutiqueVente[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wallet' | 'ventes'>('wallet');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletData, ventesData] = await Promise.all([
          boutiqueService.getPortefeuille(),
          boutiqueService.getVentes()
        ]);
        setWallet(walletData);
        setVentes(ventesData);
      } catch (err: any) {
        addToast(err.response?.data?.detail || 'Erreur lors du chargement', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [addToast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin text-gold" size={40} />
      </div>
    );
  }

  if (!wallet) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ma Boutique: {wallet.nom_boutique}</h1>
          <p className="text-foreground/50 mt-1">Tableau de bord et suivi financier</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-foreground/50 mb-2">
            <Wallet size={18} /> <span className="text-sm uppercase font-bold">Solde Disponible</span>
          </div>
          <p className="text-2xl font-mono font-bold text-green-400">{wallet.solde_disponible} FCFA</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-foreground/50 mb-2">
            <Wallet size={18} /> <span className="text-sm uppercase font-bold">Total Reçu</span>
          </div>
          <p className="text-2xl font-mono font-bold">{wallet.solde_total_recu} FCFA</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-foreground/50 mb-2">
            <TrendingUp size={18} /> <span className="text-sm uppercase font-bold">CA Brut</span>
          </div>
          <p className="text-2xl font-mono font-bold">{wallet.chiffre_affaires_brut} FCFA</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-foreground/50 mb-2">
            <DollarSign size={18} /> <span className="text-sm uppercase font-bold">Commissions</span>
          </div>
          <p className="text-2xl font-mono font-bold text-red-300">{wallet.total_commissions_admin} FCFA</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-foreground/50 mb-2">
            <DollarSign size={18} /> <span className="text-sm uppercase font-bold">Total Net Gagné</span>
          </div>
          <p className="text-2xl font-mono font-bold text-gold">{wallet.total_net_gagne} FCFA</p>
        </div>
      </div>

      <div className="border-b border-white/10 flex gap-6 mb-6">
        <button
          onClick={() => setActiveTab('wallet')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'wallet' ? 'text-gold border-b-2 border-gold' : 'text-foreground/50 hover:text-foreground'
          }`}
        >
          Versements Récents
        </button>
        <button
          onClick={() => setActiveTab('ventes')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'ventes' ? 'text-gold border-b-2 border-gold' : 'text-foreground/50 hover:text-foreground'
          }`}
        >
          Historique des Ventes
        </button>
      </div>

      {activeTab === 'wallet' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2"><History size={18}/> 10 Derniers Versements</h3>
          {wallet.versements_recents.length === 0 ? (
            <p className="text-foreground/40 italic">Aucun versement reçu pour le moment.</p>
          ) : (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="p-4 font-semibold text-foreground/60">Date</th>
                    <th className="p-4 font-semibold text-foreground/60">Référence</th>
                    <th className="p-4 font-semibold text-foreground/60">Montant</th>
                    <th className="p-4 font-semibold text-foreground/60">Mode / Destination</th>
                    <th className="p-4 font-semibold text-foreground/60">Note Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {wallet.versements_recents.map(v => (
                    <tr key={v.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 text-foreground/70">{new Date(v.date_versement).toLocaleDateString()}</td>
                      <td className="p-4 font-mono text-xs">{v.reference_transaction}</td>
                      <td className="p-4 font-mono font-bold text-green-400">{v.montant} FCFA</td>
                      <td className="p-4 text-xs text-foreground/60">{v.mode_paiement || '—'}<br />{v.telephone_destination || '—'}</td>
                      <td className="p-4 text-foreground/50 text-xs">{v.note_admin || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ventes' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Toutes vos ventes</h3>
          {ventes.length === 0 ? (
            <p className="text-foreground/40 italic">Aucune vente enregistrée.</p>
          ) : (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="p-4 font-semibold text-foreground/60">Date</th>
                    <th className="p-4 font-semibold text-foreground/60">Commande</th>
                    <th className="p-4 font-semibold text-foreground/60">Montant Brut</th>
                    <th className="p-4 font-semibold text-foreground/60">Commission</th>
                    <th className="p-4 font-semibold text-foreground/60">Net Boutique</th>
                    <th className="p-4 font-semibold text-foreground/60">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ventes.map(vente => (
                    <tr key={vente.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 text-foreground/70">{new Date(vente.date_vente).toLocaleDateString()}</td>
                      <td className="p-4 font-mono text-xs">{vente.commande_reference}</td>
                      <td className="p-4 font-mono">{vente.montant_brut} FCFA</td>
                      <td className="p-4 text-red-400 font-mono">-{vente.montant_commission_admin} ({vente.taux_commission_applique}%)</td>
                      <td className="p-4 font-mono font-bold text-gold">{vente.montant_net_boutique} FCFA</td>
                      <td className="p-4 text-foreground/60">{vente.statut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
