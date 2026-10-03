'use client';

import React, { useEffect, useRef, useState } from 'react';
import { adminService } from '@/services/apiService';
import { BoutiqueFullDetail, BoutiqueEffectuerVersementPayload } from '@/types';
import { useToastStore } from '@/store/useToastStore';
import { Loader2, ArrowLeft, Wallet, CheckCircle, Package, Store } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { resolveImageUrl } from '@/lib/utils';

export default function AdminBoutiqueDetailPage() {
  const router = useRouter();
  const params = useParams();
  const boutiqueId = Number(params.id);
  const addToast = useToastStore((s) => s.addToast);
  
  const [boutique, setBoutique] = useState<BoutiqueFullDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [payoutMode, setPayoutMode] = useState('');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [productsPage, setProductsPage] = useState(1);
  const payoutIdempotencyKey = useRef<string | null>(null);

  const [validateComm, setValidateComm] = useState('10');
  const [isValidating, setIsValidating] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await adminService.getBoutiqueDetail(boutiqueId, { page: productsPage, page_size: 100 });
      setBoutique(data);
    } catch (err: any) {
      addToast(err.response?.data?.detail || 'Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (boutiqueId) fetchDetail();
  }, [boutiqueId, productsPage]);

  const handleValidate = async () => {
    const commission = Number(validateComm);
    if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
      addToast('Le taux de commission doit être compris entre 0 et 100 %', 'error');
      return;
    }
    setIsValidating(true);
    try {
      await adminService.validateBoutique(boutiqueId, { taux_commission: commission.toFixed(2) });
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
    const currentBoutique = boutique;
    if (!currentBoutique) return;
    if (!amount || Number(amount) <= 0) {
      addToast('Veuillez entrer un montant valide', 'error');
      return;
    }
    if (Number(amount) > Number(currentBoutique.solde_disponible || 0)) {
      addToast('Le montant dépasse le solde disponible', 'error');
      return;
    }
    
    setPayoutLoading(true);
    try {
      payoutIdempotencyKey.current ||= `PAYOUT-${boutiqueId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const payload: BoutiqueEffectuerVersementPayload = {
        montant: amount,
        mode_paiement: payoutMode || currentBoutique.mode_paiement_prefere || undefined,
        telephone_destination: payoutPhone || currentBoutique.telephone_paiement || undefined,
        note_admin: payoutNote || undefined,
        idempotency_key: payoutIdempotencyKey.current,
      };
      const res = await adminService.effectuerVersementBoutique(boutiqueId, payload);
      addToast(res.detail, 'success');
      setAmount('');
      setPayoutNote('');
      payoutIdempotencyKey.current = null;
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
        <button
          type="button"
          onClick={() => setPreviewImage(resolveImageUrl(boutique.photo || boutique.photo_url || boutique.avatar_url))}
          className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:border-gold/40 transition-colors"
          title="Voir le logo de la boutique"
        >
          {boutique.photo || boutique.photo_url || boutique.avatar_url ? (
            <img
              src={resolveImageUrl(boutique.photo || boutique.photo_url || boutique.avatar_url)}
              alt={boutique.nom}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase text-foreground/50">
              {boutique.nom.slice(0, 2).toUpperCase()}
            </div>
          )}
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

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="text-xs uppercase text-foreground/40">E-mail propriétaire</p><p className="mt-1 break-all text-sm text-foreground">{boutique.proprietaire_email || boutique.user_details?.email || '—'}</p></div>
        <div><p className="text-xs uppercase text-foreground/40">Téléphone propriétaire</p><p className="mt-1 text-sm text-foreground">{boutique.proprietaire_telephone || boutique.user_details?.telephone || boutique.telephone || '—'}</p></div>
        <div><p className="text-xs uppercase text-foreground/40">Adresse boutique</p><p className="mt-1 text-sm text-foreground">{[boutique.adresse, boutique.ville].filter(Boolean).join(', ') || '—'}</p></div>
        <div><p className="text-xs uppercase text-foreground/40">Créée le</p><p className="mt-1 text-sm text-foreground">{boutique.date_creation ? new Date(boutique.date_creation).toLocaleDateString('fr-FR') : '—'}</p></div>
      </section>

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
              <span className="text-foreground/50">Chiffre d'affaires brut</span>
              <span className="font-mono text-foreground/80">{boutique.chiffre_affaires_brut ?? '—'} FCFA</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-foreground/50">Commissions plateforme</span>
              <span className="font-mono text-red-300">{boutique.total_commissions_admin ?? boutique.commissions_admin_perdues ?? '—'} FCFA</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-foreground/50">Mode de Paiement</span>
              <span className="font-semibold text-right">{boutique.mode_paiement_prefere || '—'} ({boutique.telephone_paiement || '—'})</span>
            </div>
          </div>

          <div className="pt-4 space-y-3 bg-white/5 p-4 rounded-xl">
            <h3 className="text-sm font-semibold mb-2">Effectuer un versement</h3>
            <div className="grid grid-cols-1 gap-3">
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); payoutIdempotencyKey.current = null; }}
                placeholder="Montant (FCFA)"
                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
              />
              <input
                type="text"
                value={payoutMode || boutique.mode_paiement_prefere || 'OM'}
                onChange={(e) => { setPayoutMode(e.target.value); payoutIdempotencyKey.current = null; }}
                placeholder="Mode de paiement (ex. OM)"
                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
              />
              <input
                type="tel"
                value={payoutPhone}
                onChange={(e) => { setPayoutPhone(e.target.value); payoutIdempotencyKey.current = null; }}
                placeholder={`Téléphone bénéficiaire (${boutique.telephone_paiement || 'optionnel'})`}
                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
              />
              <textarea
                value={payoutNote}
                onChange={(e) => { setPayoutNote(e.target.value); payoutIdempotencyKey.current = null; }}
                placeholder="Note interne (facultative)"
                rows={2}
                className="w-full resize-y bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
              />
              <button
                onClick={handlePayout}
                disabled={payoutLoading || !amount}
                className="flex min-h-10 items-center justify-center gap-2 bg-gold text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {payoutLoading ? <Loader2 className="animate-spin" size={16} /> : 'Enregistrer le versement'}
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

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Store size={18} className="text-gold" /> Produits de la boutique ({boutique.produits?.count ?? boutique.nb_produits_total})</h2>
          <span className="text-xs text-foreground/45">Page {boutique.produits?.current_page || 1} / {boutique.produits?.total_pages || 1}</span>
        </div>
        {!boutique.produits?.results?.length ? (
          <p className="rounded-xl border border-white/10 p-6 text-sm text-foreground/45">Aucun produit dans cette boutique.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0a0a0a]">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs text-foreground/50"><tr><th className="px-4 py-3">Produit</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Prix</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Visibilité</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {boutique.produits.results.map((product) => {
                  const image = product.images?.find((item) => item.est_principale)?.image || product.images?.[0]?.image;
                  return <tr key={`${product.type_produit}-${product.id}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-3">{image ? <img src={resolveImageUrl(image)} alt="" className="h-11 w-11 rounded-lg object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5"><Package size={16} className="text-foreground/40" /></div>}<div><p className="font-medium text-foreground">{product.nom}</p><p className="text-xs text-foreground/45">{product.marque || product.reference_sku}</p></div></div></td>
                    <td className="px-4 py-3 text-foreground/60">{product.type_produit}</td>
                    <td className="px-4 py-3 font-mono">{product.prix_promo || product.prix_unitaire} FCFA</td>
                    <td className="px-4 py-3 font-mono">{product.stock_quantite}</td>
                    <td className="px-4 py-3"><span className={product.actif ? 'text-green-400' : 'text-foreground/40'}>{product.actif ? 'En ligne' : 'Masqué'}</span></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
        {(boutique.produits?.total_pages || 1) > 1 && <div className="flex justify-end items-center gap-3"><button disabled={productsPage <= 1} onClick={() => setProductsPage((page) => page - 1)} className="rounded-lg border border-white/10 px-3 py-2 text-sm disabled:opacity-30">Précédent</button><button disabled={productsPage >= (boutique.produits?.total_pages || 1)} onClick={() => setProductsPage((page) => page + 1)} className="rounded-lg border border-white/10 px-3 py-2 text-sm disabled:opacity-30">Suivant</button></div>}
      </section>

      {boutique.versements_recents && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Wallet size={18} className="text-gold" /> Derniers versements</h2>
          {boutique.versements_recents.length === 0 ? (
            <p className="rounded-xl border border-white/10 p-5 text-sm text-foreground/45">Aucun versement enregistré.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0a0a0a]">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.03] text-xs text-foreground/50"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Référence</th><th className="px-4 py-3">Mode / Destination</th><th className="px-4 py-3">Montant</th><th className="px-4 py-3">Note</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {boutique.versements_recents.map((versement) => <tr key={versement.id}>
                    <td className="px-4 py-3 text-foreground/60">{versement.date_versement ? new Date(versement.date_versement).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{versement.reference_transaction || '—'}</td>
                    <td className="px-4 py-3 text-xs text-foreground/60">{versement.mode_paiement || '—'} · {versement.telephone_destination || '—'}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-green-400">{versement.montant} FCFA</td>
                    <td className="px-4 py-3 text-xs text-foreground/50">{versement.note_admin || '—'}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

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

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative max-w-2xl w-full rounded-2xl border border-white/10 bg-[#0a0a0a] p-3 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/40 p-2 text-foreground/70 hover:text-foreground"
              aria-label="Fermer"
            >
              ×
            </button>
            <img src={previewImage} alt="Logo de la boutique" className="max-h-[70vh] w-full rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
