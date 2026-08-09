'use client';

/**
 * @file app/shop/perfumes/PerfumesShopClient.tsx
 * @description Client-side marketplace catalog for brand perfumes, dupes and finished essences.
 */
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, RotateCcw, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/ui/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeletons';
import { useCartStore } from '@/store/useCartStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';
import { productService } from '@/services/productService';
import type { Product } from '@/types';
import { EssenceQuantityModal } from '@/components/ui/EssenceQuantityModal';

export default function PerfumesShopClient() {
  const { t } = useTranslation();

  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishedEssenceLoading, setFinishedEssenceLoading] = useState(false);
  const [finishedEssenceProducts, setFinishedEssenceProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string | number; label: string; desc?: string }[]>([]);

  // Pagination state — driven by backend response
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [genre, setGenre] = useState<'all' | 'homme' | 'femme' | 'mixte'>('all');
  const [olfactiveFamily, setOlfactiveFamily] = useState<string>('all');
  const [intensity, setIntensity] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(150000);
  const [ordering, setOrdering] = useState<string>('-date_creation');
  const [showFilters, setShowFilters] = useState(false);

  // Initialise activeTab from URL ?categorie=<id> if present
  const [activeTab, setActiveTab] = useState<string | number>(() => {
    const catParam = searchParams?.get('categorie');
    return catParam ? Number(catParam) : 'all';
  });

  // Ref for the scrollable tab bar and individual tab buttons
  const tabBarRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string | number, HTMLButtonElement | null>>({});

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset to page 1 whenever any filter/search/tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [genre, olfactiveFamily, intensity, maxPrice, debouncedSearch, ordering, activeTab]);

  // Load products when filters, tab, or page changes
  useEffect(() => {
    if (!mounted) return;

    async function fetchData() {
      setLoading(true);

      // Load dynamic categories from backend (once)
      if (categories.length === 0) {
        const backendCats = await productService.getPerfumeCategories();
        const mappedTabs = [
          {
            id: 'all',
            label: t('all_fragrances'),
            desc: '',
          },
          ...backendCats.map((cat) => ({
            id: cat.id,
            label: cat.name,
            desc: '',
          })),
          {
            id: 'huile',
            label: t('pure_oils'),
            desc: t('pure_oils_desc'),
          },
        ];
        setCategories(mappedTabs);

        if (!searchParams?.get('categorie')) {
          setActiveTab('all');
        }
      }

      const params = {
        genre: genre !== 'all' ? genre : undefined,
        famille_olfactive: olfactiveFamily !== 'all' ? olfactiveFamily : undefined,
        intensite: intensity !== 'all' ? intensity : undefined,
        prix_max: maxPrice < 150000 ? maxPrice : undefined,
        search: debouncedSearch || undefined,
        ordering: ordering || undefined,
        page: currentPage,
        categorie: activeTab !== 'all' && activeTab !== 'huile' && typeof activeTab === 'number' ? activeTab : undefined,
      } as any;

      const response = (await productService.getPerfumes(params)) as
        | Product[]
        | { results?: Product[]; resultats?: Product[]; pages?: number; count?: number };

      if (Array.isArray(response)) {
        setProducts(response);
        setTotalPages(1);
        setTotalCount(response.length);
      } else {
        setProducts(response.results ?? response.resultats ?? []);
        setTotalPages(response.pages ?? 1);
        setTotalCount(response.count ?? 0);
      }

      setLoading(false);
    }

    fetchData();
  }, [mounted, genre, olfactiveFamily, intensity, maxPrice, debouncedSearch, ordering, currentPage, categories.length]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || (activeTab !== 'huile' && activeTab !== 'all')) return;

    async function loadFinishedEssences() {
      setFinishedEssenceLoading(true);
      try {
        const response = await productService.getFinishedEssenceProducts({
          search: debouncedSearch || undefined,
          ordering: ordering || undefined,
        });
        setFinishedEssenceProducts(response);
      } catch (error) {
        console.error('Failed to load finished essences:', error);
      } finally {
        setFinishedEssenceLoading(false);
      }
    }

    loadFinishedEssences();
  }, [mounted, activeTab, debouncedSearch, ordering]);

  // Scroll active tab to center
  useEffect(() => {
    const bar = tabBarRef.current;
    const activeBtn = tabRefs.current[activeTab];
    if (!bar || !activeBtn) return;

    const barRect = bar.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const offset = activeBtn.offsetLeft - bar.offsetLeft - barRect.width / 2 + btnRect.width / 2;

    bar.scrollTo({ left: offset, behavior: 'smooth' });
  }, [activeTab, categories]);

  const { addProduct } = useCartStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { addToast } = useToastStore();

  const [selectedEssence, setSelectedEssence] = useState<Product | null>(null);

  const handleAddToCart = (product: Product) => {
    if (
      activeTab === 'huile' ||
      product.category === 'huile' ||
      product.category === 'produit-fini-essence' ||
      product.taille_ml !== undefined
    ) {
      setSelectedEssence(product);
    } else {
      addProduct(product, 1);
      addToast(
        `${product.name} ${t('added_to_cart')}`,
        'success'
      );
    }
  };

  const handleConfirmEssenceQty = (product: Product, quantite: number) => {
    addProduct(product, quantite);
    addToast(
      `${product.name} ${t('added_to_cart')}`,
      'success'
    );
  };

  const handleToggleFavorite = (product: Product) => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
      addToast(
        `${product.name} ${t('removed_from_wishlist')}`,
        'info'
      );
    } else {
      addFavorite(product);
      addToast(
        `${product.name} ${t('added_to_favorites')}`,
        'success'
      );
    }
  };

  const activeProducts =
    activeTab === 'huile'
      ? finishedEssenceProducts
      : activeTab === 'all'
      ? [...products, ...finishedEssenceProducts]
      : products;

  const isActiveLoading =
    activeTab === 'huile' || activeTab === 'all'
      ? loading || finishedEssenceLoading
      : loading;

  const resetFilters = () => {
    setSearch('');
    setGenre('all');
    setOlfactiveFamily('all');
    setIntensity('all');
    setMaxPrice(150000);
    setOrdering('-date_creation');
  };

  const activeFiltersCount =
    (genre !== 'all' ? 1 : 0) +
    (olfactiveFamily !== 'all' ? 1 : 0) +
    (intensity !== 'all' ? 1 : 0) +
    (maxPrice < 150000 ? 1 : 0);

  const families = [
    { value: 'all', label: t('family_all') },
    { value: 'floral', label: t('family_floral') },
    { value: 'woody', label: t('family_woody') },
    { value: 'citrus', label: t('family_citrus') },
    { value: 'oriental', label: t('family_oriental') },
    { value: 'fresh', label: t('family_fresh') },
    { value: 'spicy', label: t('family_spicy') },
    { value: 'fruity', label: t('family_fruity') },
    { value: 'aquatic', label: t('family_aquatic') },
    { value: 'gourmand', label: t('family_gourmand') },
    { value: 'musk', label: t('family_musk') },
  ];

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 lg:pt-32 min-h-screen">
      {/* Header & Main Controls */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            {t('perfume_shop_title')}
          </h1>
          <p className="text-sm sm:text-base text-foreground/70 max-w-3xl leading-relaxed">
            {t('perfume_shop_subtitle')}
          </p>
        </div>

        <div className="flex flex-row gap-2 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 w-4 h-4" />
            <input
              type="text"
              placeholder={t('search_perfumes_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-foreground/5 hover:bg-foreground/10 focus:bg-foreground/10 border border-foreground/10 rounded-xl py-3 pl-12 pr-4 text-sm text-foreground placeholder-foreground/40 outline-none focus:border-gold transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-1.5">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center h-auto gap-2 px-3 sm:px-5 py-3 rounded-xl border text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
                showFilters || activeFiltersCount > 0
                  ? 'border-gold text-gold bg-gold/5'
                  : 'border-foreground/10 text-foreground/75 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden md:block">{t('refine')}</span>
              {activeFiltersCount > 0 && (
                <span className="bg-gold text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold font-sans">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Collapsible Filter Drawer */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {/* Gender Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gold mb-2">
                  {t('gender_profile')}
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: t('profile_all') },
                    { value: 'homme', label: t('profile_male') },
                    { value: 'femme', label: t('profile_female') },
                    { value: 'mixte', label: t('profile_unisex') },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setGenre(item.value as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                        genre === item.value
                          ? 'bg-gold text-black shadow-md'
                          : 'bg-white/5 text-foreground/60 hover:text-foreground hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Olfactive Family Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gold mb-2">
                  {t('olfactive_family')}
                </span>
                <div className="relative">
                  <select
                    value={olfactiveFamily}
                    onChange={(e) => setOlfactiveFamily(e.target.value)}
                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs text-foreground/80 outline-none focus:border-gold cursor-pointer"
                  >
                    {families.map((fam) => (
                      <option key={fam.value} value={fam.value} className="bg-background text-foreground">
                        {fam.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40 pointer-events-none" />
                </div>
              </div>

              {/* Intensity Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gold mb-2">
                  {t('intensity')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: 'all', label: t('all') },
                    { value: 'légère', label: t('intensity_subtle') },
                    { value: 'moyenne', label: t('intensity_moderate') },
                    { value: 'forte', label: t('intensity_intense') },
                    { value: 'très forte', label: t('intensity_profound') },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setIntensity(item.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        intensity === item.value
                          ? 'bg-gold text-black shadow-md'
                          : 'bg-white/5 text-foreground/60 hover:text-foreground hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-gold">
                    {t('max_price')}
                  </span>
                  <span className="text-xs font-mono font-bold text-foreground bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">
                    {maxPrice === 150000
                      ? t('unlimited')
                      : `${maxPrice.toLocaleString('fr-FR')} FCFA`}
                  </span>
                </div>
                <div className="px-1 flex flex-col gap-1">
                  <input
                    type="range"
                    min="5000"
                    max="150000"
                    step="5000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-foreground/45 mt-1 font-mono">
                    <span>5 000 FCFA</span>
                    <span>150 000+ FCFA</span>
                  </div>
                </div>
              </div>

              {/* Reset Actions */}
              <div className="col-span-full border-t border-white/5 pt-4 mt-2 flex justify-end">
                <button
                  onClick={resetFilters}
                  disabled={activeFiltersCount === 0 && search === ''}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/40 hover:text-gold disabled:opacity-30 disabled:hover:text-foreground/40 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t('reset_filters')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable Category Tabs */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-full max-w-xl mb-4">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 rounded-l-2xl" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 rounded-r-2xl" />

          <div
            ref={tabBarRef}
            className="tab-bar flex items-center gap-1 overflow-x-auto scroll-smooth rounded-2xl p-1 bg-foreground/5 border border-white/5"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style>{`.tab-bar::-webkit-scrollbar{display:none}`}</style>

            {categories.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gold text-black shadow-lg'
                    : 'text-foreground/60 hover:text-foreground hover:bg-foreground/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-foreground/45 tracking-wide italic">
          {categories.find((tab) => tab.id === activeTab)?.desc}
        </p>
      </div>

      {/* Catalog Display */}
      {isActiveLoading ? (
        <ProductGridSkeleton count={8} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}_${currentPage}_${activeProducts.length}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6"
          >
            {activeProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="min-w-0"
              >
                <ProductCard
                  product={product}
                  onAddToCart={handleAddToCart}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={isFavorite(product.id)}
                />
              </motion.div>
            ))}

            {activeProducts.length === 0 && (
              <div className="col-span-full w-full py-20 text-center border border-white/5 rounded-2xl bg-white/[0.02]">
                <div className="text-foreground/30 text-3xl mb-4 font-light">∅</div>
                <div className="text-foreground/50 text-sm font-medium tracking-wide">
                  {t('no_perfumes_matched')}
                </div>
                {(activeFiltersCount > 0 || search !== '') && (
                  <button
                    onClick={resetFilters}
                    className="mt-4 text-xs text-gold underline hover:text-gold/80 font-bold uppercase tracking-wider"
                  >
                    {t('clear_active_filters')}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-12">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-foreground/10 text-xs font-bold uppercase tracking-wider text-foreground/60 hover:text-foreground hover:bg-foreground/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {t('prev')}
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const isVisible =
                page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;

              const isEllipsisBefore = page === currentPage - 2 && page > 2;
              const isEllipsisAfter = page === currentPage + 2 && page < totalPages - 1;

              if (isEllipsisBefore || isEllipsisAfter) {
                return (
                  <span key={page} className="text-foreground/30 text-xs px-1 select-none">
                    …
                  </span>
                );
              }

              if (!isVisible) return null;

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all duration-200 ${
                    page === currentPage
                      ? 'bg-gold text-black shadow-md'
                      : 'border border-foreground/10 text-foreground/60 hover:text-foreground hover:bg-foreground/5'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-foreground/10 text-xs font-bold uppercase tracking-wider text-foreground/60 hover:text-foreground hover:bg-foreground/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {t('next')}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pagination Metadata Counter */}
      {!loading && totalCount > 0 && (
        <p className="text-center text-xs text-foreground/35 mt-4 font-mono tracking-wide">
          {t('pagination_info', { count: totalCount, page: currentPage, totalPages })}
        </p>
      )}

      {selectedEssence && (
        <EssenceQuantityModal
          product={selectedEssence}
          onConfirm={handleConfirmEssenceQty}
          onClose={() => setSelectedEssence(null)}
        />
      )}
    </div>
  );
}