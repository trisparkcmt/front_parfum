'use client';

/**
 * @file app/shop/perfumes/page.tsx
 * @description Main Marketplace Catalog for Brand Perfumes and Dupes with Advanced Filtering.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { ProductCard } from '@/components/ui/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeletons';
import { useCartStore } from '@/store/useCartStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';
import { productService } from '@/services/productService';
import type { Product } from '@/types';

export default function PerfumesShop() {
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [genre, setGenre] = useState<string>('all');
  const [olfactiveFamily, setOlfactiveFamily] = useState<string>('all');
  const [intensity, setIntensity] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(150000);
  const [ordering, setOrdering] = useState<string>('-date_creation'); // default: newest
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'perfume-brand' | 'perfume-dupe' | 'numba-creation'>('perfume-brand');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Load products when filters or tab changes
  useEffect(() => {
    if (!mounted) return;

    async function fetchProducts() {
      setLoading(true);
      
      // Call service
      const params = {
        genre: genre !== 'all' ? genre as any : undefined,
        famille_olfactive: olfactiveFamily !== 'all' ? olfactiveFamily : undefined,
        intensite: intensity !== 'all' ? intensity as any : undefined,
        prix_max: maxPrice < 150000 ? maxPrice : undefined,
        search: debouncedSearch || undefined,
        ordering: ordering || undefined,
      } as any;

      // Use productService to get correctly mapped data and handle backend pagination
      const mappedProducts = await productService.getPerfumes(params);

      setProducts(mappedProducts);
      setLoading(false);
    }

    fetchProducts();
  }, [mounted, genre, olfactiveFamily, intensity, maxPrice, debouncedSearch, ordering]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { addProduct } = useCartStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { addToast } = useToastStore();

  const handleAddToCart = (product: Product) => {
    addProduct(product, 1);
    addToast(`${product.name} ${t('added_to_cart')}`);
  };

  const handleToggleFavorite = (product: Product) => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
    } else {
      addFavorite(product);
      addToast(`${product.name} ${t('added_to_favorites')}`, 'info');
    }
  };

  const tabs = [
    { id: 'perfume-brand', label: t('tab_brand_names'), desc: t('tab_brand_names_desc') },
    { id: 'perfume-dupe', label: t('tab_dupes'), desc: t('tab_dupes_desc') },
    { id: 'numba-creation', label: t('tab_numba_creations'), desc: t('tab_numba_creations_desc') },
  ];

  // Client-side category filtering
  const filteredPerfumes = products.filter(p => p.category === activeTab);

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

  // Localized family and intensity labels
  const families = [
    { value: 'all', label: i18n.language === 'en' ? 'All Families' : 'Toutes les familles' },
    { value: 'floral', label: i18n.language === 'en' ? 'Floral' : 'Floral' },
    { value: 'woody', label: i18n.language === 'en' ? 'Woody' : 'Boisé' },
    { value: 'citrus', label: i18n.language === 'en' ? 'Citrus' : 'Hespéridé / Agrumes' },
    { value: 'oriental', label: i18n.language === 'en' ? 'Oriental' : 'Oriental' },
    { value: 'fresh', label: i18n.language === 'en' ? 'Fresh' : 'Frais' },
    { value: 'spicy', label: i18n.language === 'en' ? 'Spicy' : 'Épicé' },
    { value: 'fruity', label: i18n.language === 'en' ? 'Fruity' : 'Fruité' },
    { value: 'aquatic', label: i18n.language === 'en' ? 'Aquatic' : 'Aquatique' },
    { value: 'gourmand', label: i18n.language === 'en' ? 'Gourmand' : 'Gourmand' },
    { value: 'musk', label: i18n.language === 'en' ? 'Musk' : 'Musqué' },
  ];

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 lg:pt-32 min-h-screen">
      
      {/* Page Header */}
      {/* <div className="flex flex-col text-center mb-10">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{t('haute_perfumery')}</h1>
        <p className="text-foreground/60 max-w-2xl mx-auto">
          {t('perfume_shop_desc')}
        </p>
      </div> */}

      {/* Search and Filters Toggle Row */}
      <div className="flex flex-row gap-2 items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 w-4 h-4" />
          <input
            type="text"
            placeholder={i18n.language === 'en' ? 'Search for a perfume, brand...' : 'Rechercher un parfum, une marque...'}
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
            
            <h1 className='hidden md:block'>
             {i18n.language === 'en' ? 'Filters' : 'Filtres'} 
            </h1>
            {activeFiltersCount > 0 && (
              <span className="bg-gold text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold font-sans">
                {activeFiltersCount}
              </span>
            )}
          </button>
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
              
              {/* Genre Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gold mb-2">
                  {i18n.language === 'en' ? 'Target Gender' : 'Genre Cible'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: i18n.language === 'en' ? 'All' : 'Tous' },
                    { value: 'homme', label: i18n.language === 'en' ? 'Men' : 'Homme' },
                    { value: 'femme', label: i18n.language === 'en' ? 'Women' : 'Femme' },
                    { value: 'mixte', label: i18n.language === 'en' ? 'Unisex' : 'Mixte' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setGenre(item.value)}
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
                  {i18n.language === 'en' ? 'Olfactive Family' : 'Famille Olfactive'}
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
                  {i18n.language === 'en' ? 'Intensity' : 'Intensité'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: 'all', label: i18n.language === 'en' ? 'All' : 'Toutes' },
                    { value: 'légère', label: 'Légère' },
                    { value: 'moyenne', label: 'Moyenne' },
                    { value: 'forte', label: 'Forte' },
                    { value: 'très forte', label: 'Très Forte' },
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

              {/* Price Slider Filter */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-gold">
                    {i18n.language === 'en' ? 'Max Price' : 'Prix Maximum'}
                  </span>
                  <span className="text-xs font-mono font-bold text-foreground bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">
                    {maxPrice === 150000 
                      ? (i18n.language === 'en' ? 'Unlimited' : 'Illimité') 
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

              {/* Reset Filters Section */}
              <div className="col-span-full border-t border-white/5 pt-4 mt-2 flex justify-end">
                <button
                  onClick={resetFilters}
                  disabled={activeFiltersCount === 0 && search === ''}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/40 hover:text-gold disabled:opacity-30 disabled:hover:text-foreground/40 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {i18n.language === 'en' ? 'Reset Filters' : 'Réinitialiser'}
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-full max-w-xl rounded-2xl flex justify-center p-1 bg-foreground/5 border border-white/5 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-xl px-4 py-2.5 flex-1 text-center text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gold text-black shadow-lg'
                  : 'text-foreground/60 hover:text-foreground hover:bg-foreground/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-foreground/45 tracking-wide italic">
          {tabs.find(t => t.id === activeTab)?.desc}
        </p>
      </div>

      {/* Product Grid / Loading State */}
      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + '_' + products.length}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-row flex-wrap justify-center sm:justify-start -mx-2 gap-3 md:gap-6"
          >
            {filteredPerfumes.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
              >
                <ProductCard
                  product={product}
                  onAddToCart={handleAddToCart}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={isFavorite(product.id)}
                />
              </motion.div>
            ))}
            
            {filteredPerfumes.length === 0 && (
              <div className="col-span-full w-full py-20 text-center border border-white/5 rounded-2xl bg-white/[0.02]">
                <div className="text-foreground/30 text-3xl mb-4 font-light">∅</div>
                <div className="text-foreground/50 text-sm font-medium tracking-wide">
                  {t('no_perfumes_available')}
                </div>
                {(activeFiltersCount > 0 || search !== '') && (
                  <button
                    onClick={resetFilters}
                    className="mt-4 text-xs text-gold underline hover:text-gold/80 font-bold uppercase tracking-wider"
                  >
                    {i18n.language === 'en' ? 'Clear active filters' : 'Effacer les filtres actifs'}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
