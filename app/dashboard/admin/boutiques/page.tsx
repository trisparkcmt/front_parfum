'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/apiService';
import { BoutiqueAdminFinancier } from '@/types';
import { useToastStore } from '@/store/useToastStore';
import { Loader2, CheckCircle, Eye, HandCoins, AlertCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminBoutiquesPage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [boutiques, setBoutiques] = useState<BoutiqueAdminFinancier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoutiques = async () => {
    setLoading(true);
    try {
      const data = await adminService.getBoutiquesFinancier();
      setBoutiques(data);
    } catch (err: any) {
      addToast(err.response?.data?.detail || 'Erreur lors du chargement des boutiques', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoutiques();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Boutiques Partenaires</h1>
          <p className="text-sm text-foreground/50 mt-1">
            Tableau de bord financier de toutes les boutiques actives
          </p>
        </div>
        <button
          onClick={fetchBoutiques}
          disabled={loading}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm transition-all text-foreground"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center border border-white/5 bg-white/5 rounded-2xl">
          <Loader2 className="animate-spin text-gold" size={32} />
        </div>
      ) : boutiques.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border border-white/5 bg-white/5 rounded-2xl text-foreground/40">
          <AlertCircle size={48} className="mb-4 opacity-50" />
          <p>Aucune boutique partenaire trouvée.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {boutiques.map((boutique) => (
            <div key={boutique.id} className="border border-white/10 bg-[#0a0a0a] rounded-2xl p-5 hover:border-gold/30 transition-all flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{boutique.nom}</h3>
                  <p className="text-xs text-foreground/50">{boutique.proprietaire}</p>
                </div>
                <span className="bg-gold/10 text-gold text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-gold/20">
                  {parseFloat(boutique.taux_commission).toFixed(1)}% COM
                </span>
              </div>
              
              <div className="space-y-3 flex-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground/50">Solde Disponible:</span>
                  <span className="font-mono font-bold text-green-400">{boutique.solde_disponible} FCFA</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground/50">Total Reçu:</span>
                  <span className="font-mono font-semibold text-foreground/80">{boutique.solde_total_recu} FCFA</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground/50">CA Brut:</span>
                  <span className="font-mono text-foreground/70">{boutique.chiffre_affaires_brut} FCFA</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/5 flex gap-2">
                <button
                  onClick={() => router.push(`/dashboard/admin/boutiques/${boutique.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Eye size={14} />
                  Détails & Produits
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
