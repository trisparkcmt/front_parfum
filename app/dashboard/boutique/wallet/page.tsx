'use client';

import { useEffect, useState } from 'react';
import { boutiqueService } from '@/services/apiService';
import type { BoutiquePortefeuille } from '@/types';
import { useToastStore } from '@/store/useToastStore';
import { Loader2, Wallet } from 'lucide-react';

export default function BoutiqueWalletPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [wallet, setWallet] = useState<BoutiquePortefeuille | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    boutiqueService.getPortefeuille()
      .then(setWallet)
      .catch((error: any) => addToast(error.response?.data?.detail || 'Erreur lors du chargement du portefeuille', 'error'))
      .finally(() => setLoading(false));
  }, [addToast]);

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="animate-spin text-gold" size={32} /></div>;
  }

  if (!wallet) {
    return <div className="p-6 text-sm text-foreground/50">Impossible de charger le portefeuille de la boutique.</div>;
  }

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Portefeuille de {wallet.nom_boutique}</h1>
        <p className="mt-1 text-sm text-foreground/50">Soldes, commissions et versements reçus</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Solde disponible', value: wallet.solde_disponible, tone: 'text-green-700 dark:text-green-400' },
          { label: 'Total reçu', value: wallet.solde_total_recu, tone: 'text-foreground' },
          { label: 'Chiffre d’affaires brut', value: wallet.chiffre_affaires_brut, tone: 'text-foreground' },
          { label: 'Commissions plateforme', value: wallet.total_commissions_admin, tone: 'text-red-700 dark:text-red-300' },
          { label: 'Net gagné', value: wallet.total_net_gagne, tone: 'text-gold' },
        ].map((metric) => (
          <div key={metric.label} className="border border-foreground/10 bg-[var(--t-surface)] p-5">
            <p className="text-xs font-semibold uppercase text-foreground/45">{metric.label}</p>
            <p className={`mt-3 text-xl font-mono font-bold ${metric.tone}`}>{metric.value} FCFA</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-gold" />
          <h2 className="text-lg font-semibold">10 derniers versements</h2>
        </div>
        {!wallet.versements_recents.length ? (
          <p className="border border-foreground/10 p-5 text-sm text-foreground/45">Aucun versement reçu pour le moment.</p>
        ) : (
          <div className="overflow-x-auto border border-foreground/10 bg-[var(--t-surface)]">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-foreground/10 bg-foreground/[0.03] text-xs text-foreground/50">
                <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Référence</th><th className="px-4 py-3">Mode</th><th className="px-4 py-3">Destination</th><th className="px-4 py-3">Montant</th><th className="px-4 py-3">Note</th></tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {wallet.versements_recents.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-foreground/65">{payment.date_versement ? new Date(payment.date_versement).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{payment.reference_transaction || '—'}</td>
                    <td className="px-4 py-3">{payment.mode_paiement || '—'}</td>
                    <td className="px-4 py-3">{payment.telephone_destination || '—'}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-green-700 dark:text-green-400">{payment.montant} FCFA</td>
                    <td className="px-4 py-3 text-xs text-foreground/50">{payment.note_admin || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}