'use client';

import { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Search, X, ArrowUpRight, Share2, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/ui/BackButton';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useToastStore } from '@/store/useToastStore';
import { labService, authService } from '@/services/apiService';
import { formatPrice, sharePage } from '@/lib/utils';
import Image from 'next/image';

interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  slug?: string;
  category?: string;
  image?: string;
  type?: 'perfume' | 'accessory' | 'custom';
  isCustomComposition?: boolean;
  description?: string;
  status?: string;
  bottleName?: string;
  lines?: Array<{ essence_nom?: string; quantite_ml?: string; prix_ligne?: string }>;
  raw?: any;
}

export default function FavoritesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { items: favorites, removeFavorite, clearFavorites, syncWithBackend } = useFavoritesStore();
  const user = useAuthStore((state) => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedCustom, setSelectedCustom] = useState<FavoriteProduct | null>(null);

  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoading(true);
      await syncWithBackend();
      setIsLoading(false);
    };
    loadFavorites();
  }, [syncWithBackend]);

  useEffect(() => {
    const mappedFavorites: FavoriteProduct[] = favorites.map((fav: any) => ({
      id: String(fav.id),
      name: fav.name || fav.nom_produit || t('product', 'Produit'),
      price: Number(fav.price || fav.prix_produit || 0),
      slug: fav.slug || fav.slug_produit,
      category: fav.category,
      image: fav.image || fav.images?.[0] || fav.image_produit,
      type: fav.category === 'accessory' ? 'accessory' : (fav.isCustomComposition || fav.category === 'numba-creation') ? 'custom' : 'perfume',
      isCustomComposition: !!fav.isCustomComposition,
      raw: fav,
    }));

    const customFavorites: FavoriteProduct[] = (user?.parfums_personnalises || []).map((item: any) => ({
      id: `custom-${item.id}`,
      name: item.nom || t('custom_perfume', 'Composition sur mesure'),
      price: Number(item.prix_total || item.prix || item.composition?.prix_total || 0),
      category: 'custom',
      image: undefined,
      type: 'custom',
      isCustomComposition: true,
      description: item.description || item.composition?.description || '',
      status: item.statut || item.composition?.statut || item.composition?.statut_laboratoire || '',
      bottleName: item.flacon_nom || item.composition?.flacon_nom || '',
      lines: item.lignes || item.composition?.lignes || [],
      raw: item,
    }));

    const allItems = [...mappedFavorites, ...customFavorites];
    const filtered = allItems.filter((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.bottleName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredFavorites(filtered);
  }, [favorites, searchTerm, user?.parfums_personnalises]);

  const handleRemoveFavorite = (id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      removeFavorite(id);
      setRemovingId(null);
    }, 200);
  };

  const handleRemoveCustomPerfume = async (customId: string) => {
    const numericId = Number(customId.replace('custom-', ''));
    if (!numericId) return;

    setRemovingId(customId);
    try {
      await labService.deleteCustomPerfume(numericId);
      await authService.getMe();
      // Refresh user data to update parfums_personnalises
      await useAuthStore.getState().fetchUser();
      const { addToast } = useToastStore.getState();
      addToast(t('favorite_deleted', 'Parfum supprimé avec succès'), 'success');
      setRemovingId(null);
    } catch (error: any) {
      console.error('Error deleting custom perfume:', error);
      const { addToast } = useToastStore.getState();
      addToast(error?.response?.data?.detail || t('delete_error', 'Erreur lors de la suppression'), 'error');
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (product: FavoriteProduct) => {
    const cartStore = useCartStore.getState();
    if (product.isCustomComposition) {
      const numericId = Number(product.id.replace('custom-', ''));
      if (!numericId) return;
      await cartStore.addCustomPerfume(numericId, 1);
      return;
    }

    if (product.category === 'accessory') {
      const numericId = Number(product.id);
      if (!numericId) return;
      await cartStore.addAccessory(numericId, 1);
      return;
    }

    if (product.category === 'huile' || product.category === 'produit-fini-essence') {
      const numericId = Number(product.id);
      if (!numericId) return;
      await cartStore.addFinishedEssence(numericId, 1);
      return;
    }

    const numericId = Number(product.id);
    if (!numericId) return;
    await cartStore.addPerfume(numericId, 1);
  };

  const handleViewProduct = (product: FavoriteProduct) => {
    if (product.isCustomComposition) {
      setSelectedCustom(product);
      return;
    }

    const isEssence = product.category === 'huile' || product.category === 'produit-fini-essence';
    const basePath = isEssence ? '/shop/huile' : '/shop/product';

    if (product.slug) {
      router.push(`${basePath}/${product.slug}`);
      return;
    }

    router.push(`${basePath}/${product.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 pb-12">
      <BackButton />

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gold/15 bg-gradient-to-br from-white/[0.04] to-transparent px-6 py-8">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/[0.06] blur-3xl"
          aria-hidden
        />
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold/80">
            {t('personal_collection', 'Collection personnelle')}
        </p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <h1 className="font-serif text-3xl italic tracking-tight text-foreground">
            {t('my_favorites_action', 'Mes Favoris')}
          </h1>
          <span className="mb-1 text-sm text-foreground/50">
            {(favorites.length + (user?.parfums_personnalises?.length || 0)).toString().padStart(2, '0')}{' '}
            {(favorites.length + (user?.parfums_personnalises?.length || 0)) > 1
              ? t('pieces_plural', 'pièces')
              : t('pieces_singular', 'pièce')}
          </span>
        </div>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-gold/40 via-gold/10 to-transparent" />
      </div>

      {/* Search */}
      {filteredFavorites.length > 0 && (
        <div className="relative border-b border-white/10 pb-3 transition-colors focus-within:border-gold/50">
          <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-foreground/30" />
          <input
            type="text"
            placeholder={t('search_favorites', 'Rechercher dans vos favoris…')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent pl-7 pr-4 text-sm text-foreground placeholder-foreground/35 focus:outline-none"
          />
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-pulse">
            <Heart size={22} className="text-gold/60" />
          </div>
        </div>
      ) : favorites.length === 0 && (!user?.parfums_personnalises || user.parfums_personnalises.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-20 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-gold/20">
            <Heart size={20} className="text-gold/50" />
          </div>
          <h3 className="font-serif text-xl italic text-foreground">
            {t('no_favorites', 'Votre sélection est vide')}
          </h3>
          <p className="mt-2 max-w-xs text-sm text-foreground/50">
            {t(
              'no_favorites_desc',
              'Les pièces que vous aimez trouvent ici leur place, prêtes à être retrouvées.'
            )}
          </p>
          <button
            onClick={() => router.push('/shop/perfumes')}
            className="mt-7 inline-flex items-center gap-2 border border-gold/40 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold transition-colors hover:bg-gold hover:text-black"
          >
            {t('browse_products', 'Découvrir la collection')}
            <ArrowUpRight size={14} />
          </button>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-foreground/50">{t('no_results', 'Aucun résultat trouvé')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {filteredFavorites.map((product) => (
              <div
                key={product.id}
                className={`group relative flex flex-col justify-between transition-all duration-200 ${
                  removingId === product.id ? 'scale-95 opacity-0' : 'opacity-100'
                }`}
              >
                <div>
                  {/* Image */}
                  <div
                    className="relative aspect-[4/5] cursor-pointer overflow-hidden bg-white/[0.03]"
                    onClick={() => handleViewProduct(product)}
                  >
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingBag size={20} className="text-foreground/15" />
                      </div>
                    )}

                    {!product.isCustomComposition && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFavorite(product.id);
                        }}
                        aria-label={t('remove', 'Supprimer')}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
                      >
                        <X size={13} />
                      </button>
                    )}

                    {product.isCustomComposition && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCustomPerfume(product.id);
                        }}
                        aria-label={t('remove', 'Supprimer')}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Info */}
                  <div className="mt-3 space-y-0.5">
                    <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-gold/70">
                      {product.type === 'custom' ? t('custom_perfume', 'Parfum sur mesure') : product.type === 'perfume' ? t('perfume', 'Parfum') : t('accessory', 'Accessoire')}
                    </p>
                    <h3
                      className="cursor-pointer truncate font-serif text-[15px] text-foreground/90 transition-colors hover:text-gold"
                      onClick={() => handleViewProduct(product)}
                    >
                      {product.name}
                    </h3>
                    <p className="text-sm text-foreground/60">{formatPrice(product.price)}</p>
                  </div>
                </div>

                {/* Add to cart (Always Visible) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                  className="mt-3.5 w-full flex items-center justify-center gap-2 bg-gold py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-black hover:bg-cream transition-colors"
                >
                  <ShoppingBag size={13} />
                  {t('add', 'Ajouter au Panier')}
                </button>
              </div>
            ))}
          </div>

          {selectedCustom && (() => {
            const raw = selectedCustom.raw as any;
            const totalMlComposed = (selectedCustom.lines || []).reduce((s, l) => s + Number(l.quantite_ml || 0), 0);
            const statusColor = (selectedCustom.status || '') === 'validé'
              ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
              : (selectedCustom.status || '') === 'en_preparation'
              ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
              : 'text-amber-400/80 bg-amber-400/5 border-amber-400/15';
            const statusLabel = (selectedCustom.status || '') === 'validé'
              ? 'Validé'
              : (selectedCustom.status || '') === 'en_preparation'
              ? 'En préparation'
              : (selectedCustom.status || '') === 'brouillon'
              ? 'Brouillon'
              : (selectedCustom.status || '—');

            return (
              <div
                className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/75 px-0 sm:px-4 backdrop-blur-md"
                onClick={() => setSelectedCustom(null)}
              >
                <div
                  className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 bg-[#0E0E0E] shadow-2xl shadow-black/60 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Gradient Header */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1508] via-[#111] to-[#0E0E0E] px-6 pt-6 pb-5">
                    <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-gold/[0.07] blur-3xl" />
                    <div className="pointer-events-none absolute left-0 bottom-0 h-24 w-24 rounded-full bg-gold/[0.04] blur-2xl" />

                    <div className="relative flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/5">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold/80">
                            <path d="M9 3h6M10 3v2.5M14 3v2.5M7 7c0-1 .5-1.5 1.5-1.5h7c1 0 1.5.5 1.5 1.5v11c0 2-1 3-3 3H9c-2 0-3-1-3-3V7z"/>
                            <path d="M9 12h6M9 15h4"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gold/60">Parfum sur mesure</p>
                          <h3 className="mt-0.5 font-serif text-xl leading-tight text-foreground">{selectedCustom.name}</h3>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedCustom(null)}
                        className="shrink-0 rounded-full border border-white/10 p-1.5 text-foreground/40 transition-colors hover:border-white/20 hover:text-foreground"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="relative mt-4 flex flex-wrap items-center gap-2">
                      {selectedCustom.bottleName && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-foreground/70">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold/50">
                            <path d="M8 2h8M9 2v3M15 2v3M6 6h12l-1 14H7L6 6z"/>
                          </svg>
                          {selectedCustom.bottleName}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium ${statusColor}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {statusLabel}
                      </span>
                      {raw?.date_creation && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-[11px] text-foreground/35">
                          {new Date(raw.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="max-h-[55vh] overflow-y-auto px-6 py-5 space-y-4">
                    {selectedCustom.description && (
                      <p className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm italic text-foreground/50">
                        {selectedCustom.description}
                      </p>
                    )}

                    {selectedCustom.lines && selectedCustom.lines.length > 0 && (
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/35">
                            Composition · {selectedCustom.lines.length} essence{selectedCustom.lines.length > 1 ? 's' : ''}
                          </p>
                          <p className="text-[11px] tabular-nums text-foreground/40">
                            {Number(totalMlComposed) % 1 === 0
                              ? Number(totalMlComposed).toFixed(0)
                              : Number(totalMlComposed).toFixed(1)} ml total
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          {selectedCustom.lines.map((line, index) => {
                            const qty = Number(line.quantite_ml || 0);
                            const pct = totalMlComposed > 0 ? (qty / totalMlComposed) * 100 : 0;
                            const prixLigne = Number((line as any).prix_ligne || 0);
                            const qtyDisplay = qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(1);
                            const dotColors = ['#c5a059', '#a0785a', '#7a9e7e', '#7a8ea0', '#a07a9e'];

                            return (
                              <div key={`${line.essence_nom}-${index}`} className="group/line rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-gold/15 hover:bg-gold/[0.02]">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className="h-2 w-2 shrink-0 rounded-full"
                                      style={{ backgroundColor: dotColors[index % dotColors.length] }}
                                    />
                                    <span className="truncate text-sm text-foreground/85 transition-colors group-hover/line:text-foreground">
                                      {line.essence_nom || 'Essence'}
                                    </span>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-3">
                                    {prixLigne > 0 && (
                                      <span className="hidden sm:block text-[11px] tabular-nums text-foreground/30">
                                        {prixLigne.toLocaleString('fr-FR')} FCFA
                                      </span>
                                    )}
                                    <span className="rounded-lg bg-white/[0.05] px-2.5 py-0.5 text-[12px] tabular-nums font-medium text-gold/80">
                                      {qtyDisplay} ml
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-white/[0.05]">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-gold/50 to-gold/20"
                                    style={{ width: `${Math.min(100, pct)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-white/[0.07] px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/35">Prix total</p>
                        <p className="mt-0.5 font-serif text-2xl text-gold leading-none">{formatPrice(selectedCustom.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            if (!raw?.id) return;
                            const name = selectedCustom.name || 'Ma composition';
                            await sharePage(
                              `/numba/atelier/composition-${raw.id}`,
                              name,
                              `Découvrez ma création personnalisée « ${name} » sur Accessories Exclusif`
                            );
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-foreground/40 transition-colors hover:border-white/20 hover:text-foreground"
                          title="Partager"
                        >
                          <Share2 size={14} />
                        </button>
                        {raw?.id && (
                          <button
                            onClick={() => {
                              setSelectedCustom(null);
                              router.push(`/numba/atelier?composition=${raw.id}`);
                            }}
                            className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-black transition-colors hover:bg-cream"
                          >
                            <Pencil size={12} />
                            Modifier
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="flex justify-center pt-6">
            <button
              onClick={() => {
                if (confirm(t('confirm_clear', 'Êtes-vous sûr de vouloir supprimer tous vos favoris ?'))) {
                  clearFavorites();
                }
              }}
              className="text-xs uppercase tracking-[0.15em] text-foreground/40 transition-colors hover:text-red-400"
            >
              {t('clear_all', 'Tout effacer')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}