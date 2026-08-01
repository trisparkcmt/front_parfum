'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Share2, ShoppingCart, Loader2, X, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { formatPrice, sharePage } from '@/lib/utils';
import { labService as apiLabService } from '@/services/apiService';

interface CompositionLine {
  id: number;
  essence_nom?: string;
  quantite_ml?: string;
  prix_par_ml_snapshot?: string;
  prix_ligne?: string;
}

interface Composition {
  id: number;
  nom: string;
  description?: string;
  enregistre?: boolean;
  flacon?: number | { id?: number; nom?: string; contenance_ml?: number; prix_unitaire?: string };
  flacon_nom?: string;
  flacon_contenance_ml?: number;
  prix_essences?: string;
  prix_flacon_snapshot?: string;
  prix_total?: string;
  statut?: string;
  lignes?: CompositionLine[];
}

interface CustomPerfumeResponse {
  id: number;
  nom: string;
  description?: string;
  statut?: string;
  composition?: Composition;
  quantite?: number;
  prix_snapshot?: string;
  sous_total?: string;
  statut_laboratoire?: string;
  note_laboratoire?: string;
}

export default function CompositionViewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuthStore();
  const { addCustomPerfume } = useCartStore();
  const { addToast } = useToastStore();

  const [composition, setComposition] = useState<CustomPerfumeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const compositionId = slug?.replace('composition-', '');

  useEffect(() => {
    const fetchComposition = async () => {
      if (!compositionId) return;
      setIsLoading(true);
      try {
        const data = await apiLabService.getCustomPerfume(Number(compositionId));
        setComposition(data);
      } catch (error) {
        console.error('Failed to fetch composition:', error);
        addToast('Composition introuvable', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComposition();
  }, [compositionId, addToast]);

  const handleShare = async () => {
    if (!composition) return;
    const result = await sharePage(
      `/numba/atelier/${slug}`,
      composition.nom,
      `Découvrez ma création personnalisée « ${composition.nom} » sur Accessories Exclusif`
    );
    if (result === 'shared') {
      addToast('Lien partagé', 'success');
    } else if (result === 'copied') {
      addToast('Lien copié dans le presse-papiers', 'success');
    } else {
      addToast('Le partage n’est pas disponible sur ce navigateur', 'error');
    }
  };

  const handleAddToCart = async () => {
    if (!composition) return;
    setIsAddingToCart(true);
    try {
      await addCustomPerfume(composition.id, 1);
      addToast('Added', 'success');
    } catch (error) {
      addToast('Erreur lors de l’ajout au panier', 'error');
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gold" />
      </div>
    );
  }

  if (!composition) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-foreground/60">Composition introuvable</p>
        <button
          onClick={() => router.push('/numba/atelier')}
          className="flex items-center gap-2 text-gold hover:underline"
        >
          <ArrowLeft size={16} />
          Retour à l'atelier
        </button>
      </div>
    );
  }

  const lines = composition.composition?.lignes || [];
  const price = Number(composition.prix_snapshot || composition.composition?.prix_total || 0);
  const bottleName = composition.composition?.flacon_nom || (typeof composition.composition?.flacon === 'object' ? composition.composition.flacon.nom : undefined) || '—';
  const bottleMl = composition.composition?.flacon_contenance_ml || (typeof composition.composition?.flacon === 'object' ? composition.composition.flacon.contenance_ml : undefined) || '—';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-foreground/60 hover:text-foreground mb-8"
        >
          <ArrowLeft size={16} />
          Retour
        </button>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold/70">Parfum sur mesure</p>
              <h1 className="mt-1 font-serif text-2xl md:text-3xl text-foreground">{composition.nom}</h1>
            </div>
            <button
              onClick={() => router.back()}
              className="rounded-full border border-white/10 p-2 text-foreground/50 transition-colors hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>

          {composition.description && (
            <p className="text-sm text-foreground/70 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              {composition.description}
            </p>
          )}

          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/40">Flacon</p>
              <p className="mt-1 text-foreground">{bottleName}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/40">Contenance</p>
              <p className="mt-1 text-foreground">{bottleMl ? `${bottleMl}ml` : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/40">Statut</p>
              <p className="mt-1 text-foreground">{composition.composition?.statut || composition.statut_laboratoire || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/40">Prix total</p>
              <p className="mt-1 text-gold font-semibold">{formatPrice(price)}</p>
            </div>
          </div>

          {lines.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/40">Composition</p>
              <div className="mt-3 space-y-2">
                {lines.map((line: CompositionLine, index: number) => (
                  <div key={line.id || index} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2 text-sm">
                    <span className="text-foreground">{line.essence_nom || 'Essence'}</span>
                    <span className="text-foreground/60">{line.quantite_ml || '—'} ml</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 border border-white/20 text-foreground/70 hover:border-gold/50 hover:text-gold rounded-xl py-3 text-xs font-semibold uppercase tracking-widest transition-colors"
            >
              <Share2 size={14} />
              Partager
            </button>
            {user && (
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-gold text-black rounded-xl py-3 text-xs font-semibold uppercase tracking-widest hover:bg-cream transition-colors disabled:opacity-50"
              >
                {isAddingToCart ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                Ajouter au panier
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
