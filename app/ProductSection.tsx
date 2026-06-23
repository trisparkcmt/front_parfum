"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Product } from "@/types";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeletons";

interface ProductSectionProps {
  title: string;
  viewAllHref?: string;
  products: Product[];
  loading: boolean;
  skeletonCount?: number;
  onAddToCart: (product: Product) => void;
  onToggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
}

/**
 * Shared section renderer for Bestsellers / Hotsellers.
 * Mobile: true 2-column CSS grid (matches the reference screenshot).
 * Desktop: widens naturally via grid-cols breakpoints, no change to
 * ProductCard itself — only the container layout changes.
 */
export default function ProductSection({
  title,
  viewAllHref,
  products,
  loading,
  skeletonCount = 4,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
}: ProductSectionProps) {
  if (!loading && products.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-12">
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">
          {title}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-xs font-medium text-foreground/50 hover:text-gold transition-colors"
          >
            Voir tout
            <ArrowRight size={13} />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {loading ? (
          <ProductGridSkeleton count={skeletonCount} />
        ) : (
          products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
            >
              <ProductCard
                product={product}
                onAddToCart={onAddToCart}
                onToggleFavorite={onToggleFavorite}
                isFavorite={isFavorite(product.id)}
              />
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}