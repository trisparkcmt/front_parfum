'use client';

/**
 * @file components/ui/DiffuseurCard.tsx
 * @description Card component for Diffuseurs with standard ProductCard layout & optional horizontal full-width row layout.
 */
import React, { useState, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Heart, ShoppingBag, Share2, BellRing, Droplets, Zap, Flame, Wifi } from 'lucide-react';
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
      className="w-full flex flex-row items-stretch gap-3 sm:gap-4 p-0 rounded-xl sm:rounded-2xl bg-[#111111] border border-white/10 hover:border-[#c9a96e]/40 transition-all duration-300 group relative overflow-hidden"
    >
      {/* Left side: Full Height Image sticking to container edge */}
      <Link
        href={productUrl}
        className="block relative w-24 sm:w-36 md:w-44 shrink-0 overflow-hidden bg-black/40 self-stretch"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AppImage
          src={getImageUrl(isHovered && secondImage ? secondImage : mainImage)}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Favorite & Share Buttons */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-20 flex gap-1 sm:gap-1.5">
          <button
            onClick={handleShare}
            aria-label="Partager ce produit"
            className="p-1 sm:p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:border-[#c9a96e] transition-colors"
          >
            <Share2 size={11} className="stroke-white/80" />
          </button>
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(product);
              }}
              aria-label="Toggle favourite"
              className="p-1 sm:p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:border-[#c9a96e] transition-colors"
            >
              <Heart
                size={11}
                className={cn(
                  'transition-all duration-300',
                  isFavorite ? 'fill-red-500 stroke-red-500' : 'stroke-white/80'
                )}
              />
            </button>
          )}
        </div>
      </Link>

      {/* Right side: Information */}
      <div className="flex-1 min-w-0 flex flex-col justify-between p-3 sm:p-4 pl-0 sm:pl-0">

        <div>
          {/* Technology Badge & Reservoir */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
            {techLabel && (
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium tracking-wider uppercase bg-[#c9a96e]/10 border border-[#c9a96e]/30 text-[#c9a96e]">
                {techLabel}
              </span>
            )}
            {product.capacite_reservoir_ml && (
              <span className="text-[10px] sm:text-xs text-foreground/40 font-light">
                {product.capacite_reservoir_ml} ml
              </span>
            )}
          </div>

          <Link
            href={productUrl}
            className="font-serif text-sm sm:text-base md:text-lg font-medium text-foreground hover:text-[#c9a96e] transition-colors leading-snug block mb-1 truncate"
          >
            {product.name}
          </Link>

          {/* Detail text */}
          <p className="text-[11px] sm:text-xs text-foreground/60 leading-relaxed font-light mb-2 line-clamp-2 sm:line-clamp-3">
            {product.description || product.description_courte || 'Aucune description disponible.'}
          </p>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 mt-auto">
          <span className="text-sm sm:text-base font-semibold tracking-wide text-[#c9a96e]">
            {formatPrice(product.price)}
          </span>

          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              className="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#c9a96e] text-black font-semibold text-[10px] sm:text-xs uppercase tracking-wider rounded-lg hover:bg-[#d4b87a] transition-all shrink-0"
            >
              <ShoppingBag size={12} />
              <span className="hidden xs:inline sm:inline">{t('add_to_cart') ?? 'Ajouter'}</span>
              <span className="inline xs:hidden sm:hidden">+</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

}

