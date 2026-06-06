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
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatPrice } from '@/lib/utils';
import type { Product } from '@/types';
import { Badge } from './Badge';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/constants';
import { useTranslation } from 'react-i18next';
import { API_ROOT } from '@/services/api';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
  className?: string;
}

export function ProductCard({ product, onAddToCart, onToggleFavorite, isFavorite, className }: ProductCardProps) {
  const { t } = useTranslation();

  // Helper to resolve image URLs from the backend
  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_ROOT}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'w-[165px] sm:w-[280px] h-auto group relative bg-gradient-to-b from-[var(--t-card-from)] to-[var(--t-card-to)] border border-[var(--t-card-border)] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:border-[var(--t-card-hover-border)] hover:shadow-[0_0_30px_var(--t-card-hover-shadow)]',
        className
      )} 
    >
      {/* Favorite button */}
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(product); }}
          className="absolute top-3 right-3 md:top-4 md:right-4 z-20 p-2 rounded-full bg-[var(--t-fav-btn-bg)] backdrop-blur-md border border-[var(--t-border)] transition-colors hover:bg-[var(--t-hover-bg)]"
        >
          <Heart
            size={12}
            className={cn('transition-all duration-300', isFavorite ? 'fill-red-500 stroke-red-500' : 'stroke-foreground/70')}
          />
        </button>
      )}

      <Link href={`/shop/product/${product.slug || product.id}`} className="block h-full">
        {/* Image Section */}
        <div className="relative h-40 md:h-55 overflow-hidden bg-[var(--t-surface)]">
          {product.images && product.images[0] && (
            <Image 
              src={getImageUrl(product.images[0])}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 165px, 280px"
              className="object-cover"
            />
          )}

          {/* Elegant Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-card-to)] via-transparent to-transparent opacity-60" />

        </div>

        {/* Product Info */}
        <div className="p-2 md:p-3 text-start">
          
          <h3 className="text-md md:text-2xl truncate font-display text-foreground tracking-wide mb-1   ">
            {product.name}
          </h3>
          <p className="text-[0.8rem] md:text-sm text-start text-foreground/40 font-light  md:mb-4">
            {product.category.includes('perfume') ? `Eau de Parfum • ${product.volume || '100ml'}` : (product.volume || 'N/A')}
          </p>

          <div className="flex flex-row md:flex-col justify-between  gap-3 md:gap-4">
            <span className="text-[1rem] md:text-xl font-light text-foreground tracking-widest">
              {formatPrice(product.price)}
            </span>

            {onAddToCart && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(product); }}
                className="hidden md:flex items-center justify-center gap-2 w-full  md:py-3 bg-[var(--t-btn-add-bg)] text-[var(--t-btn-add-text)] text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 hover:bg-[var(--t-btn-add-hover-bg)] hover:text-[var(--t-btn-add-hover-text)] pb-50"
              >
                <ShoppingBag size={16} />
                {t('add_to_cart')}
              </button>
            )}
            {onAddToCart && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(product); }}
                className="block md:hidden items-center justify-center "
              >
                {/* <ShoppingBag size={16} /> */}
                <img src="/addCircle.svg" alt={t('add_to_cart')}
                className=' ' />
              </button>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
