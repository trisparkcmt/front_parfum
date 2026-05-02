'use client';

import Image from 'next/image';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatPrice } from '@/lib/utils';
import type { Product } from '@/types';
import { Badge } from './Badge';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/constants';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
  className?: string;
}

export function ProductCard({ product, onAddToCart, onToggleFavorite, isFavorite, className }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group relative rounded-2xl overflow-hidden bg-white dark:bg-charcoal border border-white/10',
        'shadow-sm hover:shadow-xl hover:shadow-gold/5 transition-shadow duration-300',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-cream-dark dark:bg-deep-black/50">
        <div className="absolute inset-0 flex items-center justify-center text-gold/20">
          <ShoppingBag size={64} />
        </div>
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        )}

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Favorite button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); onToggleFavorite(product); }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-charcoal/90 shadow-md hover:scale-110 transition-transform"
          >
            <Heart size={16} className={cn(isFavorite ? 'fill-red-500 text-red-500' : 'text-foreground/50')} />
          </button>
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="gold">{PRODUCT_CATEGORY_LABELS[product.category]}</Badge>
        </div>

        {/* Quick add to cart */}
        {onAddToCart && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
            className="absolute bottom-3 left-3 right-3 py-2.5 rounded-xl bg-gold text-deep-black text-sm font-semibold opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} />
            Ajouter au panier
          </motion.button>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {product.brand && (
          <p className="text-xs text-gold font-medium uppercase tracking-wider mb-1">{product.brand}</p>
        )}
        <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.name}</h3>
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-bold text-gold">{formatPrice(product.price)}</p>
          {product.rating && (
            <div className="flex items-center gap-1 text-xs text-foreground/50">
              <Star size={12} className="fill-gold text-gold" />
              {product.rating}
            </div>
          )}
        </div>
        {product.originalBrand && (
          <p className="text-xs text-foreground/40 mt-1">Inspiré de {product.originalBrand}</p>
        )}
      </div>
    </motion.div>
  );
}
