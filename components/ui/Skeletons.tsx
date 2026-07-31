import React from 'react';

/**
 * Individual Product Card Skeleton
 * Matches the editorial 4:5 ProductCard layout exactly.
 */
export const ProductCardSkeleton = () => (
  <div className="flex flex-col">
    {/* 4:5 image block */}
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-foreground/10">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-foreground/[0.07] to-transparent" />
    </div>

    {/* Info block */}
    <div className="mt-3 space-y-1.5">
      {/* Category label */}
      <div className="h-2.5 w-1/3 animate-pulse rounded-sm bg-gold/20" />
      {/* Product name */}
      <div className="h-4 w-5/6 animate-pulse rounded-sm bg-foreground/15" />
      {/* Price */}
      <div className="h-3.5 w-1/4 animate-pulse rounded-sm bg-foreground/10" />
    </div>

    {/* CTA button */}
    <div className="mt-3.5 h-9 w-full animate-pulse bg-gold/20" />
  </div>
);

/**
 * Grid of Product Skeletons — renders as a CSS grid so it integrates
 * seamlessly when placed inside a parent grid (e.g. ProductSection).
 * When used standalone it also forms its own 2/3/4-col grid.
 */
export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="col-span-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 w-full">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Product Detail Page Skeleton
 * Matches a standard luxury product detail layout.
 */
export const ProductDetailSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 lg:pt-32 min-h-screen">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
      {/* Left: Product Image Gallery Skeleton */}
      <div className="space-y-4">
        <div className="aspect-square w-full bg-foreground/10 rounded-3xl animate-pulse" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square w-20 bg-foreground/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>

      {/* Right: Product Details Skeleton */}
      <div className="flex flex-col gap-8">
        <div className="space-y-4">
          <div className="h-4 w-24 bg-gold/10 rounded animate-pulse" />
          <div className="h-10 w-3/4 bg-foreground/20 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gold/20 rounded animate-pulse" />
        </div>
        
        <div className="space-y-3">
          <div className="h-4 w-full bg-foreground/10 rounded animate-pulse" />
          <div className="h-4 w-full bg-foreground/10 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-foreground/10 rounded animate-pulse" />
        </div>

        <div className="flex gap-4 mt-4">
          <div className="h-14 flex-[2] bg-gold/10 rounded-2xl animate-pulse" />
          <div className="h-14 flex-1 bg-foreground/10 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);