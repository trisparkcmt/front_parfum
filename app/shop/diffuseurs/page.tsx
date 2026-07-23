'use client';

/**
 * @file app/shop/diffuseurs/page.tsx
 * @description Public E-commerce Catalog for Perfume Diffusers.
 */
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, RotateCcw, Sparkles, Wifi, Zap } from 'lucide-react';
import { ProductCard } from '@/components/ui/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeletons';
import { productService } from '@/services/productService';
import type { Product } from '@/types';

function DiffuseursShopContent() {
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [techFilter, setTechFilter] = useState<string>('all');
  const [ordering, setOrdering] = useState<string>('-date_creation');

  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
    const q = searchParams.get('search');
    if (q) setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (!mounted) return;

    async function fetchProducts() {
      try {
        setLoading(true);
        const mappedProducts = await productService.getDiffuseurs({
          search: debouncedSearch || undefined,
          ordering: ordering || undefined,
        });

        setProducts(mappedProducts);
      } catch (error) {
        console.error('Failed to load diffuseurs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [mounted, debouncedSearch, ordering]);

  const filteredProducts = products.filter((p: any) => {
    if (techFilter !== 'all' && p.type_technologie && p.type_technologie !== techFilter) {
      return false;
    }
    return true;
  });

  const resetFilters = () => {
    setSearch('');
    setTechFilter('all');
    setOrdering('-date_creation');
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Header */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-900 border border-gold/20 p-8 sm:p-12 mb-10 shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gold/10 text-gold border border-gold/30 mb-4">
              <Sparkles size={14} /> High-Tech & Diffusion Ambiance
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-3 font-serif">
              Diffuseurs de Parfum
            </h1>
            <p className="text-sm sm:text-base text-foreground/60 leading-relaxed">
              Transformez votre intérieur avec notre collection exclusive de diffuseurs ultrasoniques et haute technologie d'ambiance.
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
            <input
              type="text"
              placeholder="Rechercher un diffuseur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-gold"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
            >
              <option value="all" className="bg-neutral-900">Toutes les technologies</option>
              <option value="ultrasons" className="bg-neutral-900">Ultrasons</option>
              <option value="nebulisation" className="bg-neutral-900">Nébulisation</option>
              <option value="chaleur" className="bg-neutral-900">Chaleur douce</option>
            </select>

            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
            >
              <option value="-date_creation" className="bg-neutral-900">Nouveautés</option>
              <option value="prix_unitaire" className="bg-neutral-900">Prix : croissant</option>
              <option value="-prix_unitaire" className="bg-neutral-900">Prix : décroissant</option>
            </select>

            <button
              onClick={resetFilters}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-foreground/60 hover:text-foreground transition-colors"
              title="Réinitialiser les filtres"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <ProductGridSkeleton />
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 p-8 space-y-4">
            <Sparkles className="mx-auto text-foreground/20" size={48} />
            <h3 className="text-lg font-bold text-foreground">Aucun diffuseur ne correspond à vos critères</h3>
            <p className="text-sm text-foreground/40 max-w-md mx-auto">
              Essayez de modifier votre recherche ou de réinitialiser les filtres.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-gold text-black text-xs font-bold hover:bg-gold/80 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiffuseursShopPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <DiffuseursShopContent />
    </Suspense>
  );
}
