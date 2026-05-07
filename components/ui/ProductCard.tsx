'use client';

/**
 * @file components/ui/ProductCard.tsx
 * @description Centralized Catalog Item Visualizer.
 *
 * This component is the primary building block of the platform's e-commerce catalogs.
 * It is responsible for rendering an individual product's summary data.
 * 
 * **Key Visual Modules**:
 * - **Image Management**: Displays the product's primary image with luxury hover animations.
 * - **Favorites Integration**: Subscribes to `useFavoritesStore` to render a interactive "Heart" icon for wishlisting.
 * - **Olfactive Indicators**: (For Perfumes) Shows the primary fragrance family badge.
 * - **Brand/Collection Labeling**: Dynamically identifies if the product is a Brand Name, Dupe, or Accessory.
 * 
 * **Interactivity**:
 * - **Quick Add**: Provides a one-click "Add to Cart" button that executes `addItem` in the `useCartStore`.
 * - **Navigation**: Wraps key elements in a `Link` to direct the user to the product's dynamic detail page.
 * 
 * **Animation**: Employs `motion.div` to provide a subtle lift effect when hovered.
 */
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
        'w-47 sm:w-50 h-65 md:h-110 md:w-70 group relative bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border border-white/10 rounded-2xl md:rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:border-gold/50 hover:shadow-[0_0_30px_rgba(197,160,89,0.1)]',
        className
      )} 
    >
      {/* Favorite button */}
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.preventDefault(); onToggleFavorite(product); }}
          className="absolute top-3 right-3 md:top-4 md:right-4 z-20 p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 transition-colors hover:bg-black/40"
        >
          <Heart
            size={12}
            className={cn('transition-all duration-300', isFavorite ? 'fill-red-500 stroke-red-500' : 'stroke-white/70')}
          />
        </button>
      )}

      {/* Image Section */}
      <div className="relative h-40 md:h-55 overflow-hidden bg-deep-black/50">
        {product.images[0] && (
          <Image 
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="w-20 h-50 "
          />
        )}

        {/* Elegant Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent opacity-60" />

      </div>

      {/* Product Info */}
       <div className="p-2 md:p-3 text-start">
        
        <h3 className="text-md md:text-2xl truncate font-display text-white tracking-wide mb-1   ">
          {product.name}
        </h3>
        <p className="text-[0.8rem] md:text-sm text-start text-white/40 font-light  md:mb-4">
          {product.category.includes('perfume') ? `Eau de Parfum • ${product.volume || '100ml'}` : '100ml'}
        </p>

        <div className="flex flex-row md:flex-col justify-between  gap-3 md:gap-4">
          <span className="text-[1rem] md:text-xl font-light text-white tracking-widest">
            {formatPrice(product.price)}
          </span>

          {onAddToCart && (
            <button
              onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
              className="hidden md:flex items-center justify-center gap-2 w-full  md:py-3 bg-white text-black text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 hover:bg-gold hover:text-white pb-50"
            >
              <ShoppingBag size={16} />
              Ajouter au panier
            </button>
          )}
          {onAddToCart && (
            <button
              onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
              className="block md:hidden items-center justify-center "
            >
              {/* <ShoppingBag size={16} /> */}
              <img src="/addCircle.svg" alt="Ajouter au panier"
              className=' ' />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
