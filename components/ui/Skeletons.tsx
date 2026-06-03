import React from 'react';
import { motion } from 'framer-motion';

/**
 * Individual Product Card Skeleton
 * Matches the dimensions and layout of components/ui/ProductCard.tsx
 */
export const ProductCardSkeleton = () => (
  <div className="w-[165px] sm:w-[280px] flex-shrink-0 flex flex-col gap-4 group">
    {/* Image Area */}
    <div className="aspect-[4/5] w-full bg-foreground/15 rounded-2xl animate-pulse relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>
    
    {/* Content Area */}
    <div className="space-y-2 px-1">
      <div className="h-3 w-2/3 bg-foreground/25 rounded animate-pulse" />
      <div className="h-4 w-full bg-foreground/25 rounded animate-pulse" />
      <div className="flex justify-between items-center pt-1">
        <div className="h-4 w-1/3 bg-gold/10 rounded animate-pulse" />
        <div className="h-8 w-8 bg-foreground/15 rounded-full animate-pulse" />
      </div>
    </div>
  </div>
);

/**
 * Grid of Product Skeletons
 * Used in shop listing pages.
 */
export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="flex flex-row flex-wrap justify-center sm:justify-center gap-7 md:gap-6">
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