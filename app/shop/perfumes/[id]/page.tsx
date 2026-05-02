'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Star, ArrowLeft, Droplets, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { allProducts } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/constants';
import { useCartStore } from '@/store/useCartStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useToastStore } from '@/store/useToastStore';

export default function PerfumeDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const product = allProducts.find(p => p.id === resolvedParams.id);
  
  const { addProduct } = useCartStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { addToast } = useToastStore();

  if (!product) {
    return <div className="p-24 text-center">Parfum non trouvé</div>;
  }

  const isFav = isFavorite(product.id);

  const handleAddToCart = () => {
    addProduct(product, 1);
    addToast(`${product.name} ajouté au panier`);
  };

  const handleToggleFavorite = () => {
    if (isFav) {
      removeFavorite(product.id);
    } else {
      addFavorite(product);
      addToast(`${product.name} ajouté aux favoris`, 'info');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/shop/perfumes" className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-gold mb-8 transition-colors">
        <ArrowLeft size={16} /> Retour à la parfumerie
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative aspect-square rounded-3xl overflow-hidden bg-cream-dark dark:bg-deep-black/50 border border-white/5"
        >
          <div className="absolute inset-0 flex items-center justify-center text-gold/10">
             <Droplets size={120} />
          </div>
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover relative z-10"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          )}
        </motion.div>

        {/* Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center"
        >
          <div className="mb-4">
            <div className="flex gap-2 mb-4">
              <Badge variant="gold">{PRODUCT_CATEGORY_LABELS[product.category]}</Badge>
              {product.volume && <Badge variant="default">{product.volume}</Badge>}
            </div>
            {product.brand && (
              <p className="text-gold font-medium uppercase tracking-wider text-sm mb-2">{product.brand}</p>
            )}
            <h1 className="font-display text-4xl font-bold mb-2">{product.name}</h1>
            {product.originalBrand && (
              <p className="text-foreground/50 text-sm mb-4">Inspiration : {product.originalBrand}</p>
            )}
            
            <div className="flex items-center gap-4 mb-6">
              <p className="font-display text-3xl font-bold text-gold">{formatPrice(product.price)}</p>
              {product.rating && (
                <div className="flex items-center gap-1 text-sm bg-white/5 px-3 py-1.5 rounded-full">
                  <Star size={16} className="fill-gold text-gold" />
                  <span className="font-medium">{product.rating}</span>
                  <span className="text-foreground/40">({product.reviews} avis)</span>
                </div>
              )}
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert text-foreground/70 mb-8">
            <p className="leading-relaxed text-lg italic">{product.description}</p>
          </div>

          {/* Olfactive Notes Pyramid */}
          {product.notes && (
            <div className="mb-8 bg-charcoal/50 border border-white/5 rounded-2xl p-6">
              <h3 className="font-display text-lg font-semibold mb-4 text-gold flex items-center gap-2">
                <Sparkles size={18} /> Pyramide Olfactive
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1">Notes de Tête</p>
                  <p className="font-medium">{product.notes.top.join(' • ')}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1">Notes de Cœur</p>
                  <p className="font-medium">{product.notes.middle.join(' • ')}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1">Notes de Fond</p>
                  <p className="font-medium">{product.notes.base.join(' • ')}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 border-t border-white/10 pt-8 mt-auto">
            <Button size="lg" className="flex-1" onClick={handleAddToCart} rightIcon={<ShoppingBag size={20} />}>
              Ajouter au panier
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              className="px-6"
              onClick={handleToggleFavorite}
            >
              <Heart size={20} className={isFav ? 'fill-red-500 text-red-500' : ''} />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
