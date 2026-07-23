'use client';

/**
 * @file app/shop/diffuseurs/page.tsx
 * @description Public E-commerce Catalog for Perfume Diffusers — Redesigned.
 */
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, RotateCcw } from 'lucide-react';
import { DiffuseurCard } from '@/components/ui/DiffuseurCard';
import { ProductGridSkeleton } from '@/components/ui/Skeletons';
import { productService } from '@/services/productService';
import type { Product } from '@/types';

/* ── Animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.6, ease: [0.23, 1, 0.32, 1] as const },
  }),
};

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
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8] font-sans">
      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(201,169,110,0.08), transparent 70%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 max-w-2xl mx-auto px-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c9a96e] text-[#c9a96e] text-[11px] font-medium tracking-[0.15em] uppercase mb-8 bg-[rgba(201,169,110,0.05)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
            </svg>
            Collection Exclusive
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.05] mb-5">
            Diffuseurs de{' '}
            <em className="italic text-[#c9a96e]">Parfum</em>
          </h1>

          <p className="text-[15px] text-[#a8a29e] font-light leading-relaxed max-w-md mx-auto">
            Transformez votre intérieur avec notre sélection de diffuseurs ultrasoniques et haute technologie d'ambiance.
          </p>

          <div className="w-12 h-px bg-[#c9a96e] mx-auto mt-8 opacity-40" />
        </motion.div>
      </section>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="max-w-5xl mx-auto px-6 pb-12 flex flex-wrap items-center justify-center gap-4"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[260px] max-w-[360px]">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#57534e]"
          />
          <input
            type="text"
            placeholder="Rechercher un diffuseur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-[rgba(201,169,110,0.12)] rounded-xl pl-11 pr-4 py-3 text-[13px] text-[#f5f0e8] placeholder:text-[#57534e] outline-none transition-all duration-300 focus:border-[#c9a96e] focus:shadow-[0_0_0_3px_rgba(201,169,110,0.1)]"
          />
        </div>

        {/* Tech filter */}
        <select
          value={techFilter}
          onChange={(e) => setTechFilter(e.target.value)}
          className="appearance-none bg-[#111111] border border-[rgba(201,169,110,0.12)] rounded-xl px-4 py-3 text-[13px] text-[#a8a29e] outline-none cursor-pointer transition-all duration-300 hover:border-[rgba(201,169,110,0.25)] hover:text-[#f5f0e8] focus:border-[#c9a96e] min-w-[180px]"
        >
          <option value="all" className="bg-[#0a0a0a]">Toutes les technologies</option>
          <option value="ultrasons" className="bg-[#0a0a0a]">Ultrasons</option>
          <option value="nebulisation" className="bg-[#0a0a0a]">Nébulisation</option>
          <option value="chaleur" className="bg-[#0a0a0a]">Chaleur douce</option>
        </select>

        {/* Ordering */}
        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="appearance-none bg-[#111111] border border-[rgba(201,169,110,0.12)] rounded-xl px-4 py-3 text-[13px] text-[#a8a29e] outline-none cursor-pointer transition-all duration-300 hover:border-[rgba(201,169,110,0.25)] hover:text-[#f5f0e8] focus:border-[#c9a96e] min-w-[160px]"
        >
          <option value="-date_creation" className="bg-[#0a0a0a]">Nouveautés</option>
          <option value="prix_unitaire" className="bg-[#0a0a0a]">Prix : croissant</option>
          <option value="-prix_unitaire" className="bg-[#0a0a0a]">Prix : décroissant</option>
        </select>

        {/* Reset */}
        <button
          onClick={resetFilters}
          title="Réinitialiser les filtres"
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#111111] border border-[rgba(201,169,110,0.12)] text-[#57534e] transition-all duration-300 hover:border-[#c9a96e] hover:text-[#c9a96e] hover:bg-[rgba(201,169,110,0.05)]"
        >
          <RotateCcw size={16} />
        </button>
      </motion.div>

      {/* ── Product Grid ── */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        {loading ? (
          <ProductGridSkeleton />
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <DiffuseurCard product={product} index={i} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-28"
          >
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="mx-auto mb-6 text-[#57534e] opacity-50"
            >
              <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
            </svg>
            <h3 className="font-serif text-[22px] font-normal text-[#f5f0e8] mb-2">
              Aucun résultat
            </h3>
            <p className="text-sm text-[#a8a29e] max-w-xs mx-auto mb-7 leading-relaxed">
              Essayez de modifier votre recherche ou de réinitialiser les filtres.
            </p>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#c9a96e] text-[#0a0a0a] text-[13px] font-semibold transition-all duration-300 hover:bg-[#d4b87a] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(201,169,110,0.3)]"
            >
              <RotateCcw size={14} />
              Réinitialiser les filtres
            </button>
          </motion.div>
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
