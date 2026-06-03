'use client';

import { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Search, Trash2, Eye } from 'lucide-react';
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

  useEffect(() => {
    setIsLoading(false);
    const filtered = favorites.filter((fav: any) =>
      fav.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fav.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFavorites(filtered);
  }, [favorites, searchTerm]);

  const handleRemoveFavorite = (id: string) => {
    removeFavorite(id);
  };

  const handleAddToCart = (product: FavoriteProduct) => {
    console.log('Added to cart:', product);
  };

  const handleViewProduct = (productId: string) => {
    router.push(`/shop/product/${productId}`);
  };

  return (
    <div className="space-y-6">
      <BackButton />

      <div className="bg-gradient-to-r from-red-400/10 to-red-600/10 rounded-2xl p-6 border border-red-400/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-400/20 flex items-center justify-center">
            <Heart size={20} className="text-red-400 fill-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('my_favorites_action', 'Mes favoris')}</h1>
            <p className="text-sm text-foreground/70">{favorites.length} {t('saved_products', 'produit(s) sauvegardé(s)')}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
        <input
          type="text"
          placeholder={t('search_favorites', 'Rechercher dans vos favoris...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
        />
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin">
            <Heart size={24} className="text-gold" />
          </div>
          <p className="mt-4 text-foreground/60">{t('loading', 'Chargement...')}</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="py-12 text-center bg-white/5 rounded-2xl border border-white/10">
          <Heart size={32} className="mx-auto mb-3 text-foreground/30" />
          <h3 className="text-lg font-semibold text-foreground mb-1">{t('no_favorites', 'Aucun favori')}</h3>
          <p className="text-sm text-foreground/60 mb-6">{t('no_favorites_desc', 'Commencez à ajouter vos produits préférés')}</p>
          <button
            onClick={() => router.push('/shop/perfumes')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-lg font-medium hover:bg-gold-dark transition-colors"
          >
            <ShoppingBag size={16} />
            {t('browse_products', 'Parcourir les produits')}
          </button>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="py-8 text-center bg-white/5 rounded-2xl border border-white/10">
          <Search size={24} className="mx-auto mb-2 text-foreground/30" />
          <p className="text-foreground/60">{t('no_results', 'Aucun résultat trouvé')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFavorites.map((product) => (
              <div
                key={product.id}
                className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-gold/30 transition-all group"
              >
                {product.image ? (
                  <div className="relative w-full h-40 bg-white/5 overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-white/5 flex items-center justify-center">
                    <ShoppingBag size={24} className="text-foreground/20" />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gold uppercase font-semibold">{product.type === 'perfume' ? 'Parfum' : 'Accessoire'}</p>
                    <h3 className="font-semibold text-foreground line-clamp-2 mt-1">{product.name}</h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-foreground">{formatPrice(product.price)}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleViewProduct(product.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors text-xs font-medium"
                    >
                      <Eye size={14} />
                      {t('view', 'Voir')}
                    </button>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-xs font-medium"
                    >
                      <ShoppingBag size={14} />
                      {t('add', 'Ajouter')}
                    </button>
                    <button
                      onClick={() => handleRemoveFavorite(product.id)}
                      className="px-3 py-2 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors"
                      title={t('remove', 'Supprimer')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {favorites.length > 0 && (
            <div className="flex justify-end pt-4">
              <button
                onClick={() => {
                  if (confirm(t('confirm_clear', 'Êtes-vous sûr de vouloir supprimer tous vos favoris ?'))) {
                    clearFavorites();
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors text-sm font-medium"
              >
                {t('clear_all', 'Effacer tous')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
