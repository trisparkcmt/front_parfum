'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/apiService';
import { BoutiqueFullDetail, BoutiqueEffectuerVersementPayload } from '@/types';
import { useToastStore } from '@/store/useToastStore';
import { Loader2, ArrowLeft, Wallet, CheckCircle, Package } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function AdminBoutiqueDetailPage() {
  const router = useRouter();
  const params = useParams();
  const boutiqueId = Number(params.id);
  const addToast = useToastStore((s) => s.addToast);
  
  const [boutique, setBoutique] = useState<BoutiqueFullDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  const [validateComm, setValidateComm] = useState('10');
  const [isValidating, setIsValidating] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await adminService.getBoutiqueDetail(boutiqueId);
      setBoutique(data);
    } catch (err: any) {
      addToast(err.response?.data?.detail || 'Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (boutiqueId) fetchDetail();
  }, [boutiqueId]);

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      await adminService.validateBoutique(boutiqueId, { taux_commission: validateComm });
      addToast('Boutique validée avec succès !', 'success');
      setShowValidation(false);
      fetchDetail();
    } catch (err: any) {
      addToast(err.response?.data?.detail || 'Erreur de validation', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const handlePayout = async () => {
    if (!amount || Number(amount) <= 0) {
      addToast('Veuillez entrer un montant valide', 'error');
      return;
    }
    
    setPayoutLoading(true);
    try {
      const payload: BoutiqueEffectuerVersementPayload = {
        montant: amount,
        idempotency_key: `PAYOUT-${Date.now()}-${boutiqueId}`,
      };
      const res = await adminService.effectuerVersementBoutique(boutiqueId, payload);
      addToast(res.detail, 'success');
      setAmount('');
      fetchDetail();
    } catch (err: any) {
      addToast(err.response?.data?.detail || 'Erreur lors du versement', 'error');
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader2 className="animate-spin text-gold" size={40} />
      </div>
    );
  }

  if (!boutique) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{boutique.nom}</h1>
          <p className="text-sm text-foreground/50">Propriétaire: {boutique.proprietaire_nom}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${
            boutique.statut === 'actif' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
            boutique.statut === 'en_attente' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
          }`}>
            {boutique.statut}
          </span>
          {boutique.statut === 'en_attente' && (
            <button
              onClick={() => setShowValidation(true)}
              className="bg-gold text-black px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gold/90 transition"
            >
              Valider
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Finacial Card */}
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Wallet size={18} className="text-gold"/> Finances</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-foreground/50">Solde Disponible</span>
              <span className="text-xl font-mono font-bold text-green-400">{boutique.solde_disponible} FCFA</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-foreground/50">Solde Total Reçu</span>
              <span className="text-lg font-mono text-foreground/80">{boutique.solde_total_recu} FCFA</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-foreground/50">Mode de Paiement</span>
              <span className="font-semibold">{boutique.mode_paiement_prefere} ({boutique.telephone_paiement})</span>
            </div>
          </div>

          <div className="pt-4 space-y-3 bg-white/5 p-4 rounded-xl">
            <h3 className="text-sm font-semibold mb-2">Effectuer un versement</h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Montant (FCFA)"
                className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
              />
              <button
                onClick={handlePayout}
                disabled={payoutLoading || !amount}
                className="bg-gold text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {payoutLoading ? <Loader2 className="animate-spin" size={16} /> : 'Payer'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Package size={18} className="text-gold"/> Statistiques Produits</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
              <p className="text-2xl font-bold">{boutique.nb_produits_parfums}</p>
              <p className="text-xs text-foreground/50 uppercase mt-1">Parfums</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
              <p className="text-2xl font-bold">{boutique.nb_produits_accessoires}</p>
              <p className="text-xs text-foreground/50 uppercase mt-1">Accessoires</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
              <p className="text-2xl font-bold">{boutique.nb_ventes_total}</p>
              <p className="text-xs text-foreground/50 uppercase mt-1">Ventes Totales</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
              <p className="text-2xl font-bold">{boutique.taux_commission}%</p>
              <p className="text-xs text-foreground/50 uppercase mt-1">Commission Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Modal */}
      {showValidation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-2">Valider la Boutique</h3>
            <p className="text-sm text-foreground/50 mb-6">Définissez le taux de commission pour activer la boutique.</p>
            
            <div className="mb-6">
              <label className="text-xs font-bold uppercase text-foreground/40 mb-2 block tracking-widest">Taux de Commission (%)</label>
              <input
                type="number"
                value={validateComm}
                onChange={(e) => setValidateComm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowValidation(false)}
                disabled={isValidating}
                className="flex-1 border border-white/10 py-3 rounded-xl text-xs font-bold uppercase hover:bg-white/5"
              >
                Annuler
              </button>
              <button
                onClick={handleValidate}
                disabled={isValidating}
                className="flex-1 bg-gold text-black py-3 rounded-xl text-xs font-bold uppercase hover:bg-gold/90 flex justify-center items-center gap-2"
              >
                {isValidating ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
