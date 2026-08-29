'use client';

/**
 * @file components/ui/ProductCard.tsx
 * @description Editorial product card — matches favorites page design.
 *
 * Layout:
 * - Full-bleed 4:5 image with hover-zoom & secondary image crossfade
 * - Small gold category/volume label above name
 * - Serif product name with hover gold transition
 * - Price line with optional strikethrough for reductions
 * - Full-width solid gold "Add to Cart" button (or "Notify me" if sold out)
 * - Favorite heart + Share icons overlaid top-right on the image
 *
 * Sizing is responsive across breakpoints so cards stay legible when
 * more columns are packed into a row on larger screens.
 *
 * NOTE: the Share/Favorite buttons are siblings of the <Link>, not
 * descendants of it. A <button> nested inside an <a> is invalid HTML and
 * iOS Safari in particular can fail to register taps on the inner button
 * (the outer anchor swallows the tap). Keeping them as separately
 * positioned overlays avoids that class of bug entirely.
 */

import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { Heart, ShoppingBag, BellRing, Share2 } from 'lucide-react';
import { cn, formatPrice, sharePage, resolveImageUrl } from '@/lib/utils';
import type { Product } from '@/types';
import { useTranslation } from 'react-i18next';
import { useState, type MouseEvent } from 'react';
import { useToastStore } from '@/store/useToastStore';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
  className?: string;
  /** If true, renders a "Notify me" button instead of "Add to Cart" */
  soldOut?: boolean;
}

export function ProductCard({
  product,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
  className,
  soldOut = false,
}: ProductCardProps) {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const [isHovered, setIsHovered] = useState(false);

  const mainImage = product.image_principale || (product.images && product.images[0]) || '';
  const secondImage = product.image_supp_1 || (product.images && product.images[1]) || '';

  const isDiffuseur = !!(product.type_technologie || product.capacite_reservoir_ml);

  const productUrl = isDiffuseur
    ? `/shop/diffuseurs/${product.id || product.slug}`
    : `/shop/product/${product.slug || product.id}`;

  // Derive category label
  const categoryLabel = isDiffuseur
    ? (product.type_technologie === 'ultrasons' ? 'Ultrasons'
      : product.type_technologie === 'nebulisation' ? 'Nébulisation'
      : product.type_technologie === 'chaleur' ? 'Chaleur douce'
      : product.type_technologie === 'connecte' ? 'Connecté'
      : 'Diffuseur')
    : product.category === 'huile' || product.category === 'produit-fini-essence'
    ? `Huile${product.volume ? ` • ${product.volume}` : ''}`
    : product.category && product.category.includes('perfume')
    ? `Parfum${product.volume ? ` • ${product.volume}` : ''}`
    : product.category === 'accessory'
    ? 'Accessoire'
    : product.category || '';

  const handleShare = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await sharePage(
      productUrl,
      product.name,
      `Découvrez ${product.name} sur Accessories Exclusif`,
      mainImage ? resolveImageUrl(mainImage) : undefined
    );
    if (result === 'shared' || result === 'copied') {
      try {
        const { trackShare } = await import('@/lib/gtag');
        trackShare({
          id: product.id,
          name: product.name,
          category: categoryLabel,
          method: result === 'shared' ? 'Web Share API' : 'Clipboard',
        });
      } catch (err) {
        console.warn('[ProductCard] Failed to track share event:', err);
      }
    }
    if (result === 'shared') addToast('Lien partagé', 'success');
    else if (result === 'copied') addToast('Lien copié dans le presse-papiers', 'success');
    else addToast("Le partage n'est pas disponible sur ce navigateur", 'error');
  };

  const handleToggleFavorite = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(product);
  };

  const hasReduction = !!(product.originalPrice && product.taux_reduction && parseFloat(product.taux_reduction) > 0);

  return (
    <div className={cn('group relative flex h-full flex-col', className)}>

      {/* ─── Image Block ─────────────────────────────────────── */}
      <div
        className="relative aspect-[4/5] overflow-hidden bg-white/[0.03]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={productUrl} className="absolute inset-0 z-0 block cursor-pointer" tabIndex={-1} aria-hidden="true">
          {/* Discount badge */}
          {hasReduction && (
            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-20 bg-red-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 uppercase tracking-wider">
              -{parseFloat(product.taux_reduction!)}%
            </div>
          )}

          {/* New badge */}
          {product.is_new && !hasReduction && (
            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-20 bg-gold/90 text-black text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 uppercase tracking-wider">
              Nouveau
            </div>
          )}

          {/* Main image */}
          {mainImage ? (
            <AppImage
              src={resolveImageUrl(mainImage)}
              alt={product.name}
              fill
              className={cn(
                'object-cover transition-all duration-500 ease-out',
                isHovered && secondImage ? 'opacity-0 scale-[1.04]' : 'opacity-100 scale-100 group-hover:scale-[1.04]'
              )}
              priority={false}
              loading="lazy"
              sizes="(max-width: 480px) 46vw, (max-width: 768px) 31vw, (max-width: 1024px) 23vw, 210px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ShoppingBag size={24} className="text-foreground/10" />
            </div>
          )}

          {/* Secondary image crossfade */}
          {secondImage && (
            <AppImage
              src={resolveImageUrl(secondImage)}
              alt={`${product.name} - vue 2`}
              fill
              className={cn(
                'object-cover transition-all duration-500 ease-out absolute inset-0',
                isHovered ? 'opacity-100 scale-[1.04]' : 'opacity-0 scale-100'
              )}
              priority={false}
              loading="lazy"
              sizes="(max-width: 480px) 46vw, (max-width: 768px) 31vw, (max-width: 1024px) 23vw, 210px"
            />
          )}
        </Link>

        {/* Overlay actions — Share & Favorite. Siblings of the Link, NOT
            descendants, so taps register reliably on iOS Safari. */}
        <div className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 z-30 flex flex-col gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Partager ce produit"
            className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
          >
            <Share2 size={12} className="sm:hidden" />
            <Share2 size={13} className="hidden sm:block" />
          </button>
          {onToggleFavorite && (
            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-label="Toggle favourite"
              className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
            >
              <Heart
                size={12}
                className={cn(
                  'sm:hidden transition-all duration-300',
                  isFavorite ? 'fill-red-500 stroke-red-500' : 'stroke-white/80'
                )}
              />
              <Heart
                size={13}
                className={cn(
                  'hidden sm:block transition-all duration-300',
                  isFavorite ? 'fill-red-500 stroke-red-500' : 'stroke-white/80'
                )}
              />
            </button>
          )}
        </div>
      </div>

      {/* ─── Info Block ──────────────────────────────────────── */}
      <div className="mt-2 sm:mt-3 flex flex-1 flex-col">

        {/* Category / volume label — always occupies one line so cards align */}
        <p className="h-4 text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.12em] sm:tracking-[0.15em] text-gold truncate">
          {categoryLabel}
        </p>

        {/* Product name — clamped to 2 lines, fixed min-height reserves space */}
        <Link
          href={productUrl}
          className="mt-0.5  min-h-[2.2rem] sm:min-h-[2.6rem] font-serif font-bold text-[13px] sm:text-[14px] leading-[1.3] text-foreground transition-colors hover:text-gold"
        >
          {product.name}
        </Link>

        {/* Price — always one line, mt-auto pushes it away from name */}
        <p className=" text-sm font-medium sm:text-md text-foreground">
          {product.category === 'huile' && product.produits_finis && product.produits_finis.length > 0 ? (
            <span className="text-gold">
              {t('price_from', { defaultValue: 'À partir de' })} {formatPrice(product.price)}
            </span>
          ) : hasReduction ? (
            <>
              <span className="line-through text-foreground/40 mr-1 sm:mr-1.5">{formatPrice(product.originalPrice!)}</span>
              <span className="text-gold">{formatPrice(product.price)}</span>
            </>
          ) : (
            formatPrice(product.price)
          )}
        </p>
      </div>

      {/* ─── CTA Button ──────────────────────────────────────── */}
      <div className="mt-auto pt-2.5 sm:pt-3.5">
        {soldOut ? (
          <button className="w-full flex items-center justify-center gap-1.5 sm:gap-2 border border-foreground/20 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.15em] text-foreground/50 hover:border-foreground/40 transition-colors">
            <BellRing size={12} className="sm:hidden" />
            <BellRing size={13} className="hidden sm:block" />
            {t('notify_when_available') ?? 'Me notifier'}
          </button>
        ) : (
          onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              className="w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.15em] bg-transparent border border-[var(--t-btn-ghost-border)] text-[var(--t-btn-ghost-text)] transition-colors duration-200 hover:bg-[var(--t-btn-ghost-hover-bg)] hover:text-[var(--t-btn-ghost-hover-text)] "
            >
              <ShoppingBag size={12} className="sm:hidden" />
              <ShoppingBag size={13} className="hidden sm:block" />
              {t('add_to_cart') ?? 'Ajouter au Panier'}
            </button>
          )
        )}
      </div>
    </div>
  );
}