'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, RotateCcw, LayoutGrid, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { DiffuseurCard } from '@/components/ui/DiffuseurCard';
import { ProductGridSkeleton } from '@/components/ui/Skeletons';
import { productService } from '@/services/productService';
import { useCartStore } from '@/store/useCartStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useToastStore } from '@/store/useToastStore';
import type { Product } from '@/types';

function DiffuseursShopContent() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'horizontal'>('grid');

  const { addDiffuseur } = useCartStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const { addToast } = useToastStore();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [techFilter, setTechFilter] = useState<string>('all');
  const [ordering, setOrdering] = useState<string>('-date_creation');
  const [showFilters, setShowFilters] = useState(false);

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
    setShowFilters(false);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addDiffuseur(Number(product.id), 1);
      addToast(isEn ? 'Added to bag' : 'Ajouté au panier', 'success');
      const { trackAddToCart } = await import('@/lib/gtag');
      trackAddToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        category: 'Diffuseur',
        quantity: 1,
      });
    } catch {
      addToast(
        isEn ? 'Error adding item to bag' : +'+'Erreur lors de l+''+\u2019ajout au panier+''+`,
        'error'
      );
    }
  };
  const handleToggleFavorite = (product: Product) => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
      addToast(
        isEn ? `${product.name} removed from wishlist` : `${product.name} retirÃ© des favoris`,
        'info'
      );
    } else {
      addFavorite(product);
      addToast(
        isEn ? `${product.name} saved to wishlist` : `${product.name} ajoutÃ© aux favoris`,
        'success'
      );
    }
  };

  const activeFiltersCount = (techFilter !== 'all' ? 1 : 0) + (ordering !== '-date_creation' ? 1 : 0);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Hero */}
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
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold text-gold text-[11px] font-medium tracking-[0.15em] uppercase mb-8 bg-gold/5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
            </svg>
            {isEn ? 'Signature Home Scents' : 'Collection Exclusive'}
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.05] mb-5">
            {isEn ? (
              <>
                Scent <em className="italic text-gold">Diffusers</em>
              </>
            ) : (
              <>
                Diffuseurs de <em className="italic text-gold">Parfum</em>
              </>
            )}
          </h1>

          <p className="text-[15px] text-foreground/60 font-light leading-relaxed max-w-md mx-auto">
            {isEn
              ? 'Elevate your sanctuary with our ultrasonic and high-performance scenting systems.'
              : 'Transformez votre intÃ©rieur avec notre sÃ©lection de diffuseurs ultrasoniques et haute technologie d\'ambiance.'}
          </p>

          <div className="w-12 h-px bg-gold mx-auto mt-8 opacity-40" />
        </motion.div>
      </section>

      {/* Filters & View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="max-w-5xl mx-auto px-4 sm:px-6 pb-8"
      >
        <div className="flex items-center gap-1.5 sm:gap-3 w-full">
          <div className="relative flex-1 min-w-0">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
            />
            <input
              type="text"
              placeholder={isEn ? 'Search diffusers...' : 'Rechercher...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-xl pl-8 pr-2 sm:pl-10 sm:pr-4 py-2.5 sm:py-3 text-[12px] sm:text-[13px] text-foreground placeholder:text-foreground/40 outline-none transition-all duration-300 focus:border-gold focus:bg-foreground/10"
            />
          </div>

          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 sm:px-3.5 py-2.5 sm:py-3 text-[12px] sm:text-[13px] font-medium transition-all duration-300 shrink-0 ${
              showFilters || activeFiltersCount > 0
                ? 'border-gold bg-gold/10 text-foreground'
                : 'border-foreground/10 bg-foreground/5 text-foreground/60 hover:border-gold/40 hover:text-foreground'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span className="hidden xs:inline">{isEn ? 'Filter' : 'Filtres'}</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-gold text-[9px] sm:text-[10px] font-semibold text-black">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="flex items-center p-1 bg-foreground/5 border border-foreground/10 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              title={isEn ? 'Grid View' : 'Vue grille'}
              className={`p-1.5 sm:p-2.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-gold text-black'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('horizontal')}
              title={isEn ? 'Expanded List View' : 'Vue liste dÃ©taillÃ©e'}
              className={`p-1.5 sm:p-2.5 rounded-lg transition-all ${
                viewMode === 'horizontal'
                  ? 'bg-gold text-black'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex flex-wrap items-center gap-2"
          >
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="w-full min-w-[160px] flex-1 appearance-none rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-[13px] text-foreground/60 outline-none transition-all duration-300 hover:border-gold/40 hover:text-foreground focus:border-gold sm:max-w-[220px]"
            >
              <option value="all" className="bg-background">
                {isEn ? 'All Technologies' : 'Toutes les technologies'}
              </option>
              <option value="ultrasons" className="bg-background">
                {isEn ? 'Ultrasonic' : 'Ultrasons'}
              </option>
              <option value="nebulisation" className="bg-background">
                {isEn ? 'Cold-Air Nebulization' : 'NÃ©bulisation'}
              </option>
              <option value="chaleur" className="bg-background">
                {isEn ? 'Gentle Heat' : 'Chaleur douce'}
              </option>
            </select>

            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="w-full min-w-[160px] flex-1 appearance-none rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-[13px] text-foreground/60 outline-none transition-all duration-300 hover:border-gold/40 hover:text-foreground focus:border-gold sm:max-w-[220px]"
            >
              <option value="-date_creation" className="bg-background">
                {isEn ? 'Newest Arrivals' : 'NouveautÃ©s'}
              </option>
              <option value="prix_unitaire" className="bg-background">
                {isEn ? 'Price: Low to High' : 'Prix : croissant'}
              </option>
              <option value="-prix_unitaire" className="bg-background">
                {isEn ? 'Price: High to Low' : 'Prix : dÃ©croissant'}
              </option>
            </select>

            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-3 text-[13px] text-foreground/60 transition-all duration-300 hover:border-gold hover:text-foreground"
            >
              <RotateCcw size={14} />
              {isEn ? 'Clear Filters' : 'RÃ©initialiser'}
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Catalog */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        {loading ? (
          <ProductGridSkeleton />
        ) : filteredProducts.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
              {filteredProducts.map((product, i) => (
                <DiffuseurCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={isFavorite(product.id)}
                  viewMode="grid"
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-6 w-full">
              {filteredProducts.map((product, i) => (
                <DiffuseurCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={isFavorite(product.id)}
                  viewMode="horizontal"
                  index={i}
                />
              ))}
            </div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-28"
          >
            <h3 className="font-serif text-[22px] font-normal text-foreground mb-2">
              {isEn ? 'No Diffusers Found' : 'Aucun rÃ©sultat'}
            </h3>
            <p className="text-sm text-foreground/60 max-w-xs mx-auto mb-7 leading-relaxed">
              {isEn
                ? 'Try broadening your search or resetting active filters.'
                : 'Essayez de modifier votre recherche ou de rÃ©initialiser les filtres.'}
            </p>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gold text-black text-[13px] font-semibold transition-all duration-300 hover:bg-gold/90 hover:-translate-y-0.5"
            >
              <RotateCcw size={14} />
              {isEn ? 'Reset All Filters' : 'RÃ©initialiser les filtres'}
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
