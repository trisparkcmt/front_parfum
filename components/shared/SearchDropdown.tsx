'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, Package, Sparkles, Tag, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productService } from '@/services/productService';
import type { Product } from '@/types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface Category {
  id: number | string;
  name: string;
  type?: string;
  href: string;
  icon?: string;
}

interface SearchDropdownProps {
  query: string;
  onClose: () => void;
  className?: string;
}

export function SearchDropdown({ query, onClose, className }: SearchDropdownProps) {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Fetch products + categories when query changes
  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const run = async () => {
      try {
        const [perfumes, accessories, perfumeCats, accessoryTypes] = await Promise.allSettled([
          productService.getPerfumes({ search: query }),
          productService.getAccessories({ search: query }),
          productService.getPerfumeCategories(),
          productService.getAccessoryTypes(),
        ]);

        if (cancelled) return;

        // Combine perfume + accessory results, limit to 6
        const allProducts: Product[] = [
          ...(perfumes.status === 'fulfilled' ? perfumes.value : []),
          ...(accessories.status === 'fulfilled' ? accessories.value : []),
        ].slice(0, 6);

        // Build category suggestions — filter by name match
        const q = query.toLowerCase();
        const catList: Category[] = [];

        if (perfumeCats.status === 'fulfilled') {
          perfumeCats.value
            .filter(c => c.name?.toLowerCase().includes(q))
            .slice(0, 3)
            .forEach(c => catList.push({
              id: c.id,
              name: c.name,
              href: `/shop/perfumes?categorie=${c.id}`,
            }));
        }

        if (accessoryTypes.status === 'fulfilled') {
          accessoryTypes.value
            .filter(c => c.name?.toLowerCase().includes(q))
            .slice(0, 3)
            .forEach(c => catList.push({
              id: c.id,
              name: c.name,
              href: `/shop/accessories?type=${c.id}`,
            }));
        }

        setProducts(allProducts);
        setCategories(catList);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [query]);

  const hasResults = products.length > 0 || categories.length > 0;
  const showEmpty = !loading && query.trim().length > 0 && !hasResults;

  return (
    <AnimatePresence>
      {query.trim().length > 0 && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={cn(
            'absolute top-full left-0 right-0 mt-2 z-50',
            'bg-[var(--t-surface)] border border-[var(--t-border)]',
            'rounded-2xl shadow-xl shadow-black/10 overflow-hidden',
            className
          )}
        >
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-foreground/40">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">{t('searching', 'Recherche…')}</span>
            </div>
          )}

          {/* Empty */}
          {showEmpty && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-foreground/40">
              <Search size={22} />
              <span className="text-xs">{t('no_results', 'Aucun résultat pour')}{' '}«{query}»</span>
            </div>
          )}

          {!loading && hasResults && (
            <div className="py-2">
              {/* Category suggestions */}
              {categories.length > 0 && (
                <div className="px-3 pb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/40 mb-1.5 px-1">
                    {t('categories', 'Catégories')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map(cat => (
                      <Link
                        key={cat.id}
                        href={cat.href}
                        onClick={onClose}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-medium hover:bg-gold/20 transition-colors"
                      >
                        <Tag size={10} />
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              {categories.length > 0 && products.length > 0 && (
                <div className="mx-3 my-2 border-t border-[var(--t-border)]" />
              )}

              {/* Product results */}
              {products.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/40 mb-1 px-4">
                    {t('products', 'Produits')}
                  </p>
                  {products.map(product => (
                    <Link
                      key={product.id}
                      href={`/shop/${product.category?.includes('accessory') ? 'accessories' : 'perfumes'}/${product.slug || product.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-foreground/5 transition-colors group"
                    >
                      {/* Thumbnail */}
                      <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-foreground/5 border border-foreground/8">
                        {product.image_principale || product.images?.[0] ? (
                          <img
                            src={product.image_principale || product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            {product.category?.includes('perfume') ? (
                              <Sparkles size={14} className="text-gold/60" />
                            ) : (
                              <Package size={14} className="text-foreground/30" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-gold transition-colors">
                          {product.name}
                        </p>
                        {product.brand && (
                          <p className="text-xs text-foreground/50 truncate">
                            {product.brand}
                          </p>
                        )}
                      </div>

                      <ArrowRight size={14} className="text-foreground/20 group-hover:text-gold group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}

              {/* See all results footer */}
              <div className="px-3 pt-1.5 pb-2 border-t border-[var(--t-border)] mt-1">
                <Link
                  href={`/shop/accessories?search=${encodeURIComponent(query)}`}
                  onClick={onClose}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-gold/8 hover:bg-gold/15 text-gold text-xs font-semibold transition-colors group"
                >
                  <span>{t('see_all_results', 'Voir tous les résultats pour')} «{query}»</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
