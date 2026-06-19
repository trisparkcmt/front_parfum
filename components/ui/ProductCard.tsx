'use client';

/**
 * @file components/ui/ProductCard.tsx
 * @description Centralized Catalog Item Visualizer.
 *
 * Redesigned to match editorial product card style:
 * - Full-bleed image with "Sold out" badge overlay
 * - Star rating display
 * - Clean typographic product name + price
 * - Ghost/outline "Add to Cart" button (transparent, border only)
 * - Light & dark theme aware via CSS variables
 */

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, ShoppingBag, BellRing } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatPrice } from '@/lib/utils';
import type { Product } from '@/types';
import { useTranslation } from 'react-i18next';
import { API_ROOT } from '@/services/api';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
  className?: string;
  /** If true, renders a "Notify me" button instead of "Add to Cart" */
  soldOut?: boolean;
  /** Star rating 0–5 */
  rating?: number;
  /** Number of reviews */
  reviewCount?: number;
}

export function ProductCard({
  product,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
  className,
  soldOut = false,
  rating = 0,
  reviewCount = 0,
}: ProductCardProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_ROOT}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const renderStars = (score: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        className={cn(
          'transition-colors',
          i < Math.round(score)
            ? 'fill-[var(--t-star-fill)] stroke-[var(--t-star-fill)]'
            : 'fill-transparent stroke-[var(--t-star-empty)]'
        )}
      />
    ));

  // Get images - handle both image_principale and images array
  const mainImage = product.image_principale || (product.images && product.images[0]) || '';
  const secondImage = product.image_supp_1 || (product.images && product.images[1]) || '';
  const displayImage = isHovered && secondImage ? secondImage : mainImage;

  return (
    // <motion.div
    //   //initial={{ opacity: 0, y: 20 }}
    //   whileInView={{ opacity: 1, y: 0 }}
    //   viewport={{ once: true }}
    //   whileHover={{ y: -3 }}
    //   transition={{ duration: 0.3 }}
    //   className={cn(
    //     /* ── Layout ── */
    //     'w-[45vw] sm:w-[280px] flex flex-col bg-gray-500 rounded-lg',
    //     /* ── Theming: no card bg, no border, no shadow — just content ── */
    //     'text-[var(--t-card-text)]',
    //     className
    //   )}
    // >
    
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'w-[45vw] sm:w-[280px] h-auto group relative    overflow-hidden transition-all duration-500 ',
        className
      )} 
    >

      {/* ─── Image Block ─────────────────────────────────────── */}
      <Link href={`/shop/product/${product.slug || product.id}`} className="block relative">
        {/* Image Section */} 
        {product.taux_reduction && parseFloat(product.taux_reduction) > 0 && (
          <div className="absolute top-3 left-3 z-20 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{parseFloat(product.taux_reduction)}%
          </div>
        )}
        <div className="relative h-40 md:h-55 overflow-hidden bg-[var(--t-surface)]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <motion.div
            initial={false}
            animate={{ opacity: isHovered && secondImage ? 0 : 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image 
              src={getImageUrl(mainImage)}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 165px, 280px"
              className="object-cover"
            />
          </motion.div>
          
          {secondImage && (
            <motion.div
              initial={false}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <Image 
                src={getImageUrl(secondImage)}
                alt={`${product.name} - second view`}
                fill
                sizes="(max-width: 640px) 165px, 280px"
                className="object-cover"
              />
            </motion.div>
          )}
        </div>
        {/* Favorite button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(product);
            }}
            aria-label="Toggle favourite"
            className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-[var(--t-fav-btn-bg)] backdrop-blur-md border border-[var(--t-border)] hover:bg-[var(--t-hover-bg)] transition-colors"
          >
            <Heart
              size={13}
              className={cn(
                'transition-all duration-300',
                isFavorite ? 'fill-red-500 stroke-red-500' : 'stroke-foreground/60'
              )}
            />
          </button>
        )}
      </Link>

      {/* ─── Info Block ──────────────────────────────────────── */}
      <div className="flex flex-col  flex-1">
        {/* Product name */}
        <Link
          href={`/shop/product/${product.slug || product.id}`}
          className=" capitalize text-base sm:text-lg font-medium text-foreground/90 hover:underline underline-offset-2 leading-snug line-clamp-2"
        >
          {product.name}
        </Link>

        

        
        {product.volume && (
          <p className="text-[0.8rem] md:text-sm text-start text-foreground/40 font-light  md:mb-4"
          
          >
            {product.category.includes('perfume') ? `Eau de Parfum • ${product.volume || '100ml'}` : (product.volume || 'N/A')}
          </p>
        )}

        {/* Price */}
        <p className="text-sm sm:text-lg font-semibold tracking-wide" style={{ color: '#C5A059' }}>
          {product.originalPrice && product.taux_reduction && parseFloat(product.taux_reduction) > 0 ? (
            <>
              <span className="line-through text-foreground/50 mr-2">{formatPrice(product.originalPrice)}</span>
              <span>{formatPrice(product.price)}</span>
            </>
          ) : (
            <span>{formatPrice(product.price)}</span>
          )}
          
        </p>
        

        {/* CTA button */}
        <div className=" mt-auto pt-1">
          {soldOut ? (
            /* ── Notify Me (ghost style) ── */
            <button
              className={cn(
                'w-full flex items-center justify-center gap-2 ',
                'py-2.5 sm:py-3 px-4',
                'text-xs sm:text-sm font-semibold uppercase tracking-widest',
                'rounded-none', // flat/square style matching reference
                /* Ghost: transparent bg, only border + text */
                'bg-transparent border border-[var(--t-btn-ghost-border)] text-[var(--t-btn-ghost-text)]',
                'hover:bg-[var(--t-btn-ghost-hover-bg)] hover:text-[var(--t-btn-ghost-hover-text)]',
                'transition-colors duration-200',
                'bg-[var(--t-btn-solid-bg)] text-[var(--t-btn-solid-text)]' // fallback solid for sold-out
              )}
            >
              <BellRing size={14} />
              {t('notify_when_available') ?? 'Notify me when available'}
            </button>
          ) : (
            /* ── Add to Cart (ghost / outline) ── */
            onAddToCart && (
              <button
                onClick={() => onAddToCart(product)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-sm',
                  'py-2.5 sm:py-3 px-4',
                  'text-xs sm:text-sm font-semibold uppercase tracking-widest',
                  'rounded-none',
                  /* Ghost: transparent bg, only border + text */
                  'bg-transparent border border-[var(--t-btn-ghost-border)] text-[var(--t-btn-ghost-text)]',
                  'hover:bg-[var(--t-btn-ghost-hover-bg)] hover:text-[var(--t-btn-ghost-hover-text)]',
                  'transition-colors duration-200'
                )}
              >
                <ShoppingBag size={14} />
                {t('add_to_cart') ?? 'Add to cart'}
              </button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
