'use client';

import { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Search, X, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/ui/BackButton';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  slug?: string;
  category?: string;
  image?: string;
  type?: 'perfume' | 'accessory';
}

export default function FavoritesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { items: favorites, removeFavorite, clearFavorites } = useFavoritesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(false);
    const filtered = favorites.filter((fav: any) =>
      fav.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fav.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFavorites(filtered);
  }, [favorites, searchTerm]);

  const handleRemoveFavorite = (id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      removeFavorite(id);
      setRemovingId(null);
    }, 200);
  };

  const handleAddToCart = (product: FavoriteProduct) => {
    console.log('Added to cart:', product);
  };

  const handleViewProduct = (slug: string) => {
    router.push(`/shop/product/${slug}`);
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
                  onClick={() => handleViewProduct(product.slug || product.id)}
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

                  {/* Remove */}
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

                  {/* Add to cart — reveals on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-gold py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-black transition-transform duration-300 ease-out group-hover:translate-y-0"
                  >
                    <ShoppingBag size={13} />
                    {t('add', 'Ajouter')}
                  </button>
                </div>

                {/* Info */}
                <div className="mt-3 space-y-0.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-gold/70">
                    {product.type === 'perfume' ? 'Parfum' : 'Accessoire'}
                  </p>
                  <h3
                    className="cursor-pointer truncate font-serif text-[15px] text-foreground/90 transition-colors hover:text-gold"
                    onClick={() => handleViewProduct(product.slug || product.id)}
                  >
                    {product.name}
                  </h3>
                  <p className="text-sm text-foreground/60">{formatPrice(product.price)}</p>
                </div>
              </div>
            ))}
          </div>

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