'use client';

import { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Search, X, ArrowUpRight, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/ui/BackButton';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
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
  const { items: favorites, removeFavorite, clearFavorites } = useFavoritesStore();
  const user = useAuthStore((state) => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedCustom, setSelectedCustom] = useState<FavoriteProduct | null>(null);

  useEffect(() => {
    setIsLoading(false);

    const mappedFavorites: FavoriteProduct[] = favorites.map((fav: any) => ({
      id: String(fav.id),
      name: fav.name || fav.nom_produit || 'Produit',
      price: Number(fav.price || fav.prix_produit || 0),
      slug: fav.slug || fav.slug_produit,
      category: fav.category,
      image: fav.image || fav.images?.[0] || fav.image_produit,
      type: fav.category === 'accessory' ? 'accessory' : fav.category === 'numba-creation' ? 'custom' : 'perfume',
      isCustomComposition: !!fav.isCustomComposition,
      raw: fav,
    }));

    const customFavorites: FavoriteProduct[] = (user?.parfums_personnalises || []).map((item: any) => ({
      id: `custom-${item.id}`,
      name: item.nom || 'Composition sur mesure',
      price: Number(item.prix_total || item.prix || item.composition?.prix_total || 0),
      category: 'custom',
      image: undefined,
      type: 'custom',
      isCustomComposition: true,
      description: item.description || item.composition?.description || '',
      status: item.statut || item.composition?.statut || '',
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

    const numericId = Number(product.id);
    if (!numericId) return;
    await cartStore.addPerfume(numericId, 1);
  };

  const handleViewProduct = (product: FavoriteProduct) => {
    if (product.isCustomComposition) {
      setSelectedCustom(product);
      return;
    }

    if (product.slug) {
      router.push(`/shop/product/${product.slug}`);
      return;
    }

    router.push(`/shop/product/${product.id}`);
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
            {favorites.length.toString().padStart(2, '0')}{' '}
            {favorites.length > 1
              ? t('pieces_plural', 'pièces')
              : t('pieces_singular', 'pièce')}
          </span>
        </div>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-gold/40 via-gold/10 to-transparent" />
      </div>

      {/* Search */}
      {favorites.length > 0 && (
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
      ) : favorites.length === 0 ? (
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
                className={`group relative transition-all duration-200 ${
                  removingId === product.id ? 'scale-95 opacity-0' : 'opacity-100'
                }`}
              >
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

                  {/* Add to cart / details */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (product.isCustomComposition) {
                        setSelectedCustom(product);
                      } else {
                        handleAddToCart(product);
                      }
                    }}
                    className="absolute inset-x-0 bottom-0 flex translate-y-0 md:translate-y-full md:group-hover:translate-y-0 items-center justify-center gap-2 bg-gold py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-black transition-transform duration-300 ease-out"
                  >
                    <ShoppingBag size={13} />
                    {product.isCustomComposition ? t('details', 'Détails') : t('add', 'Ajouter')}
                  </button>
                </div>

                {/* Info */}
                <div className="mt-3 space-y-0.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-gold/70">
                    {product.type === 'custom' ? 'Parfum sur mesure' : product.type === 'perfume' ? 'Parfum' : 'Accessoire'}
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
            ))}
          </div>

          {selectedCustom && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#111111] p-6 shadow-2xl shadow-black/50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold/70">Parfum sur mesure</p>
                    <h3 className="mt-1 font-serif text-2xl text-foreground">{selectedCustom.name}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedCustom(null)}
                    className="rounded-full border border-white/10 p-2 text-foreground/50 transition-colors hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-6 space-y-4 text-sm text-foreground/70">
                  {selectedCustom.description && (
                    <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-foreground/70">
                      {selectedCustom.description}
                    </p>
                  )}

                  <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/40">Flacon</p>
                      <p className="mt-1 text-foreground">{selectedCustom.bottleName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/40">Statut</p>
                      <p className="mt-1 text-foreground">{selectedCustom.status || '—'}</p>
                    </div>
                  </div>

                  {selectedCustom.lines && selectedCustom.lines.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/40">Composition</p>
                      <div className="mt-3 space-y-2">
                        {selectedCustom.lines.map((line, index) => (
                          <div key={`${line.essence_nom}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2 text-sm">
                            <span className="text-foreground">{line.essence_nom || 'Essence'}</span>
                            <span className="text-foreground/60">{line.quantite_ml || '—'} ml</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                  <p className="text-sm text-foreground/50">Prix total</p>
                  <p className="font-serif text-xl text-gold">{formatPrice(selectedCustom.price)}</p>
                </div>
              </div>
            </div>
          )}

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