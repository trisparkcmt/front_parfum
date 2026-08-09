'use client';

/**
 * @file components/ui/DiffuseurCard.tsx
 * @description Card component for Diffuseurs with standard ProductCard layout & optional horizontal full-width row layout.
 */
import React, { useState, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Heart, ShoppingBag, Share2, Droplets, Zap, Flame, Wifi } from 'lucide-react';
import AppImage from '@/components/ui/AppImage';
import { cn, formatPrice, sharePage } from '@/lib/utils';
import type { Product } from '@/types';
import { useTranslation } from 'react-i18next';
import { API_ROOT } from '@/services/api';
import { useToastStore } from '@/store/useToastStore';
import { ProductCard } from './ProductCard';

interface DiffuseurCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
  viewMode?: 'grid' | 'horizontal';
  index?: number;
}

// Small technology → icon map. Falls back gracefully for unknown values.
function getTechIcon(type?: string) {
  switch (type) {
    case 'nebulisation': return Zap;
    case 'chaleur':       return Flame;
    case 'connecte':      return Wifi;
    case 'ultrasons':
    default:               return Droplets;
  }
}

export function DiffuseurCard({
  product,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
  viewMode = 'grid',
  index = 0,
}: DiffuseurCardProps) {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const [isHovered, setIsHovered] = useState(false);

  // If in grid mode, delegate directly to standard ProductCard for total consistency across the site
  if (viewMode === 'grid') {
    return (
      <ProductCard
        product={product}
        onAddToCart={onAddToCart}
        onToggleFavorite={onToggleFavorite}
        isFavorite={isFavorite}
        className="w-full"
      />
    );
  }

  // Horizontal full-width layout (1 item per row)
  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_ROOT}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const mainImage = product.image_principale || (product.images && product.images[0]) || '';
  const secondImage = product.images && product.images[1] ? product.images[1] : '';
  const productUrl = `/shop/diffuseurs/${product.id || product.slug}`;

  const techLabel = product.type_technologie
    ? (product.type_technologie === 'ultrasons'
        ? 'Ultrasons'
        : product.type_technologie === 'nebulisation'
        ? 'Nébulisation'
        : product.type_technologie === 'chaleur'
        ? 'Chaleur douce'
        : product.type_technologie === 'connecte'
        ? 'Connecté'
        : product.type_technologie)
    : null;

  const TechIcon = getTechIcon(product.type_technologie);

  const handleShare = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const result = await sharePage(
      productUrl,
      product.name,
      `Découvrez ${product.name} sur Accessories Exclusif`
    );

    if (result === 'shared') {
      addToast('Lien partagé', 'success');
    } else if (result === 'copied') {
      addToast('Lien copié dans le presse-papiers', 'success');
    } else {
      addToast('Le partage n’est pas disponible sur ce navigateur. Copiez le lien : ' + productUrl, 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative flex w-full flex-row items-stretch gap-3 overflow-hidden rounded-xl border p-0 sm:gap-4 sm:rounded-2xl',
        'bg-[var(--t-surface-raised)] border-[var(--t-card-border)]',
        'shadow-sm shadow-black/[0.04] transition-all duration-300',
        'hover:border-[var(--t-card-hover-border)] hover:shadow-md hover:shadow-black/[0.06]'
      )}
    >
      {/* Left side: Full Height Image sticking to container edge */}
      <Link
        href={productUrl}
        className="relative block w-24 shrink-0 self-stretch overflow-hidden bg-[var(--t-surface-overlay)] sm:w-36 md:w-44"
      >
        <AppImage
          src={getImageUrl(isHovered && secondImage ? secondImage : mainImage)}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Scrim so the overlay buttons stay legible over any photo, in any theme */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/25 via-transparent to-transparent" />

        {/* Favorite & Share Buttons — theme-independent chrome (sit on a photo, not the page bg) */}
        <div className="absolute left-1.5 top-1.5 z-20 flex gap-1 sm:left-2 sm:top-2 sm:gap-1.5">
          <button
            onClick={handleShare}
            aria-label="Partager ce produit"
            className="rounded-full bg-white/90 p-1 text-neutral-900 backdrop-blur-md transition-colors hover:bg-white sm:p-1.5"
          >
            <Share2 size={11} />
          </button>
          {onToggleFavorite && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(product);
              }}
              aria-label="Toggle favourite"
              className="rounded-full bg-white/90 p-1 text-neutral-900 backdrop-blur-md transition-colors hover:bg-white sm:p-1.5"
            >
              <Heart
                size={11}
                className={cn(
                  'transition-all duration-300',
                  isFavorite ? 'fill-red-500 stroke-red-500' : 'stroke-current'
                )}
              />
            </motion.button>
          )}
        </div>
      </Link>

      {/* Right side: Information */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-3 pl-0 sm:p-4 sm:pl-0">

        <div>
          {/* Technology Badge & Reservoir */}
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
            {techLabel && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-gold)]/35 bg-[var(--color-gold)]/12 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--color-gold)] sm:text-[10px]">
                <TechIcon size={10} />
                {techLabel}
              </span>
            )}
            {product.capacite_reservoir_ml && (
              <span className="inline-flex items-center gap-1 text-[10px] font-light text-foreground/40 sm:text-xs">
                {product.capacite_reservoir_ml} ml
              </span>
            )}
          </div>

          <Link
            href={productUrl}
            className="mb-1 block truncate font-serif text-sm font-medium leading-snug text-[var(--foreground)] transition-colors hover:text-[var(--color-gold)] sm:text-base md:text-lg"
          >
            {product.name}
          </Link>

          {/* Detail text */}
          <p className="mb-2 line-clamp-2 text-[11px] font-light leading-relaxed text-[var(--t-text-muted)] sm:line-clamp-3 sm:text-xs">
            {product.description || product.description_courte || 'Aucune description disponible.'}
          </p>
        </div>

        {/* Price & CTA */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--t-card-border)] pt-2">
          <span className="text-sm font-semibold tracking-wide text-[var(--color-gold)] sm:text-base">
            {formatPrice(product.price)}
          </span>

          {onAddToCart && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onAddToCart(product)}
              className="flex shrink-0 items-center justify-center gap-1 rounded-lg bg-[var(--t-btn-add-bg)] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--t-btn-add-text)] transition-all hover:bg-[var(--t-btn-add-hover-bg)] sm:gap-1.5 sm:px-4 sm:py-2 sm:text-xs"
            >
              <ShoppingBag size={12} />
              <span className="hidden xs:inline sm:inline">{t('add_to_cart') ?? 'Ajouter'}</span>
              <span className="inline xs:hidden sm:hidden">+</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}