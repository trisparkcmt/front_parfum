'use client';

/**
 * @file app/shop/accessories/page.tsx
 * @description Main Marketplace Catalog for Luxury Accessories with Advanced Filtering.
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

// Mapping for accessory types to match backend IDs
const accessoryTypeMap: Record<string, number> = {
  'watches': 1,
  'jewelry': 2,
  'bags': 3,
  'sunglasses': 4,
  'belts': 5,
  'other': 6
};

export default function AccessoriesShop() {
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeSubcat, setActiveSubcat] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(200000);
  const [color, setColor] = useState<string>('all');
  const [material, setMaterial] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [ordering, setOrdering] = useState<string>('-date_creation'); // default: newest
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Load products when filters or subcategory changes
  useEffect(() => {
    if (!mounted) return;

    async function fetchProducts() {
      try {
        setLoading(true);

        // Use productService to get correctly mapped data and handle backend pagination
        const mappedProducts = await productService.getAccessories({
          type_accessoire: activeSubcat !== 'all' ? String(accessoryTypeMap[activeSubcat]) : undefined,
          prix_max: maxPrice < 200000 ? maxPrice : undefined,
          couleur: color !== 'all' ? color : undefined,
          matiere: material !== 'all' ? material : undefined,
          en_stock: inStockOnly ? true : undefined,
          search: debouncedSearch || undefined,
          ordering: ordering || undefined,
        });

        setProducts(mappedProducts);
      } catch (error) {
        console.error('AccessoriesShop: Failed to fetch products', error);
        addToast(t('error_loading_products', { defaultValue: 'Erreur lors du chargement des accessoires' }), 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [mounted, activeSubcat, maxPrice, color, material, inStockOnly, debouncedSearch, ordering]);

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

  const subCategories = ['all', 'watches', 'jewelry', 'bags', 'sunglasses', 'belts', 'other'];

  const resetFilters = () => {
    setSearch('');
    setMaxPrice(200000);
    setColor('all');
    setMaterial('all');
    setInStockOnly(false);
    setOrdering('-date_creation');
  };

  const activeFiltersCount = 
    (maxPrice < 200000 ? 1 : 0) +
    (color !== 'all' ? 1 : 0) +
    (material !== 'all' ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  // Distinct colors and materials for accessories catalog
  const colors = [
    { value: 'all', label: i18n.language === 'en' ? 'All Colors' : 'Toutes les couleurs' },
    { value: 'Or', label: i18n.language === 'en' ? 'Gold' : 'Or' },
    { value: 'Argent', label: i18n.language === 'en' ? 'Silver' : 'Argent' },
    { value: 'Noir', label: i18n.language === 'en' ? 'Black' : 'Noir' },
    { value: 'Rose', label: i18n.language === 'en' ? 'Rose Gold' : 'Or Rose' },
  ];

  const materials = [
    { value: 'all', label: i18n.language === 'en' ? 'All Materials' : 'Toutes les matières' },
    { value: 'Acier inoxydable', label: i18n.language === 'en' ? 'Stainless Steel' : 'Acier inoxydable' },
    { value: 'Cuir', label: i18n.language === 'en' ? 'Leather' : 'Cuir' },
    { value: 'Perles', label: i18n.language === 'en' ? 'Pearls' : 'Perles' },
    { value: 'Or', label: i18n.language === 'en' ? 'Solid Gold' : 'Or Fin' },
  ];

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 lg:pt-32 min-h-screen">
      
      {/* Page Header */}
      {/* <div className="flex flex-col text-center mb-10">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{t('nav_accessories')}</h1>
        <p className="text-foreground/60 max-w-2xl mx-auto">
          {i18n.language === 'en' 
            ? 'Discover our exclusive collection of watches, jewelry, bags and luxury leather accessories.' 
            : 'Découvrez notre collection exclusive de montres, bijoux, sacs et accessoires de maroquinerie fine.'}
        </p>
      </div> */} 

      {/* Subcategory Scrollable Ribbon */}
      <div className="w-full border-b border-white/5 mb-8">
        <div className="flex items-center gap-8 overflow-x-auto pb-4 scrollbar-hide px-4 sm:px-0">
          {subCategories.map((subcat) => (
            <button
              key={subcat}
              onClick={() => setActiveSubcat(subcat)}
              className={`relative whitespace-nowrap text-[0.6rem] font-bold uppercase tracking-[0.2em] transition-all pb-2 ${
                activeSubcat === subcat
                  ? 'text-gold font-extrabold'
                  : 'text-foreground/40 hover:text-foreground'
              }`}
            >
              {subcat === 'all' ? t('see_all') : t(`subcat_${subcat}`)}
              {activeSubcat === subcat && (
                <motion.div
                  layoutId="activeSubcatUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters Toggle Row */}
      <div className="flex flex-row gap-2 items-center justify-between mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 w-4 h-4" />
          <input
            type="text"
            placeholder={i18n.language === 'en' ? 'Search for an accessory, brand...' : 'Rechercher un accessoire, une marque...'}
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
            className={`flex items-center gap-2 px-3 sm:px-5 py-3 rounded-xl border text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
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
              
              {/* Color Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gold mb-2">
                  {i18n.language === 'en' ? 'Color' : 'Couleur'}
                </span>
                <div className="relative">
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs text-foreground/80 outline-none focus:border-gold cursor-pointer"
                  >
                    {colors.map((c) => (
                      <option key={c.value} value={c.value} className="bg-background text-foreground">
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40 pointer-events-none" />
                </div>
              </div>

              {/* Material Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gold mb-2">
                  {i18n.language === 'en' ? 'Material' : 'Matière'}
                </span>
                <div className="relative">
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs text-foreground/80 outline-none focus:border-gold cursor-pointer"
                  >
                    {materials.map((m) => (
                      <option key={m.value} value={m.value} className="bg-background text-foreground">
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40 pointer-events-none" />
                </div>
              </div>

              {/* Availability Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gold mb-2">
                  {i18n.language === 'en' ? 'Availability' : 'Disponibilité'}
                </span>
                <div className="flex items-center mt-2">
                  <label className="relative flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-white/10 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-foreground/30 peer-checked:after:bg-gold after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold/25" />
                    <span className="ml-3 text-xs font-medium text-foreground/70">
                      {i18n.language === 'en' ? 'In stock only' : 'En stock uniquement'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Price Slider Filter */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-gold">
                    {i18n.language === 'en' ? 'Max Price' : 'Prix Maximum'}
                  </span>
                  <span className="text-xs font-mono font-bold text-foreground bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">
                    {maxPrice === 200000 
                      ? (i18n.language === 'en' ? 'Unlimited' : 'Illimité') 
                      : `${maxPrice.toLocaleString('fr-FR')} FCFA`}
                  </span>
                </div>
                <div className="px-1 flex flex-col gap-1">
                  <input
                    type="range"
                    min="5000"
                    max="200000"
                    step="5000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-foreground/45 mt-1 font-mono">
                    <span>5 000 FCFA</span>
                    <span>200 000+ FCFA</span>
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

      {/* Product Grid / Loading State */}
      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubcat + '_' + products.length}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-row flex-wrap justify-center sm:justify-start -mx-4 gap-2
             md:gap-6"
          >
            {products.map((product, index) => (
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

            {products.length === 0 && (
              <div className="col-span-full w-full py-20 text-center border border-white/5 rounded-2xl bg-white/[0.02]">
                <div className="text-foreground/30 text-3xl mb-4 font-light">∅</div>
                <div className="text-foreground/50 text-sm font-medium tracking-wide">
                  {i18n.language === 'en' ? 'No accessories available matching your criteria.' : 'Aucun accessoire disponible correspondant à vos critères.'}
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
