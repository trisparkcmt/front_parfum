'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, X, RefreshCw, Maximize2, Minimize2, ArrowLeft, 
  Sparkles, Droplets, Store 
} from 'lucide-react';
import { labService } from '@/services/labService';
import { useAuthStore } from '@/store/useAuthStore';
import type { EssenceClient } from '@/types';

type CategoryFilter = 'all' | 'high' | 'premium' | 'super-premium';

export default function CatalogueEssencesClient() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [essences, setEssences] = useState<EssenceClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if current user is admin or collaboratrice
  const isStaffOrAdmin = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [];
    const directRole = user.role;
    return (
      roles.includes('superadmin') ||
      roles.includes('serveuse') ||
      directRole === 'superadmin' ||
      directRole === 'serveuse'
    );
  }, [isAuthenticated, user]);

  const dashboardHref = useMemo(() => {
    if (!user) return '/dashboard';
    const roles = Array.isArray(user.roles) ? user.roles : [];
    if (roles.includes('serveuse') || user.role === 'serveuse') {
      return '/dashboard/serveuse/dashboard';
    }
    return '/dashboard/admin/dashboard';
  }, [user]);

  const loadEssences = useCallback(async () => {
    setLoading(true);
    try {
      const data = await labService.getEssences();
      setEssences(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des essences:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEssences();
  }, [loadEssences]);

  // Fullscreen toggle for Android tablet kiosk mode
  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Helper to normalize and categorize essences identical to Atelier
  const getItemCategory = useCallback((item: EssenceClient): 'high' | 'premium' | 'super-premium' => {
    const familyStr = String(item.family || '').toLowerCase();
    const normalizedFamily = familyStr.replace(/[_\s]+/g, '-');
    if (normalizedFamily === 'premium' || normalizedFamily === 'super-premium' || normalizedFamily === 'high') {
      return normalizedFamily;
    }
    if (item.id.includes('sprem')) return 'super-premium';
    if (item.id.includes('high')) return 'high';
    return 'premium';
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    let high = 0;
    let premium = 0;
    let superPremium = 0;

    for (const item of essences) {
      const cat = getItemCategory(item);
      if (cat === 'high') high++;
      else if (cat === 'premium') premium++;
      else if (cat === 'super-premium') superPremium++;
    }

    return {
      all: essences.length,
      high,
      premium,
      'super-premium': superPremium,
    };
  }, [essences, getItemCategory]);

  // Filtered essences based on category and search
  const filteredEssences = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return essences.filter((item) => {
      const cat = getItemCategory(item);
      const matchesCategory = selectedCategory === 'all' || cat === selectedCategory;
      if (!matchesCategory) return false;

      if (!query) return true;
      const matchesName = item.name.toLowerCase().includes(query);
      const matchesDesc = (item.description || '').toLowerCase().includes(query);
      const matchesFamily = (String(item.family || '')).toLowerCase().includes(query);
      return matchesName || matchesDesc || matchesFamily;
    });
  }, [essences, selectedCategory, searchQuery, getItemCategory]);

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center selection:bg-gold/30">
      {/* Portrait-adapted container: perfectly sized for portrait Android tablets and phones */}
      <main className="w-full max-w-xl mx-auto flex flex-col min-h-screen px-4 sm:px-6 py-6 pb-24 shadow-2xl relative">
        
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-xl h-72 bg-gold/5 blur-[100px] -z-10 rounded-full" />

        {/* Top Control Bar (Dashboard back button & kiosk controls) */}
        <div className="flex items-center justify-between gap-2 pb-4 pt-1">
          {isStaffOrAdmin ? (
            <Link
              href={dashboardHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/15 bg-foreground/5 text-foreground/70 hover:text-gold hover:border-gold/30 text-xs font-medium transition-all"
            >
              <ArrowLeft size={14} />
              <span>Tableau de bord</span>
            </Link>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Entrée Boutique</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={loadEssences}
              className="w-8 h-8 rounded-full border border-foreground/15 bg-foreground/5 hover:border-gold/30 text-foreground/60 hover:text-gold flex items-center justify-center transition-all"
              title="Actualiser le catalogue"
              aria-label="Actualiser"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-full border border-foreground/15 bg-foreground/5 hover:border-gold/30 text-foreground/60 hover:text-gold flex items-center justify-center transition-all"
              title={isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}
              aria-label="Plein écran"
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          </div>
        </div>

        {/* Header & Logo */}
        <header className="flex flex-col items-center text-center mt-2 mb-6">
          <img
            src="/logo/Longo only2.svg"
            alt="Accessoires Exclusifs"
            className="h-16 sm:h-20 w-auto object-contain mb-3"
          />
          <span className="text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase text-gold">
            Atelier Numba · Bar à Parfum
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mt-1">
            Catalogue des Essences
          </h1>
          <p className="text-xs sm:text-sm text-foreground/60 mt-1 max-w-sm">
            Découvrez nos essences pures et leurs tarifs au millilitre
          </p>
        </header>

        {/* Sticky Search & Filter Header for seamless tablet experience */}
        <div className="sticky top-2 z-20 backdrop-blur-xl bg-background/85 pt-1 pb-3 space-y-3 rounded-2xl">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une essence, fragrance, note..."
              className="w-full bg-foreground/5 border border-foreground/10 focus:border-gold/60 focus:bg-foreground/[0.07] rounded-2xl pl-11 pr-10 py-3.5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground/60 flex items-center justify-center transition-colors"
                aria-label="Effacer la recherche"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Categories Tab */}
          <nav
            aria-label="Catégories d'essences"
            className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide no-scrollbar -mx-1 px-1"
          >
            {[
              { id: 'all', label: 'Toutes', count: categoryCounts.all },
              { id: 'high', label: 'High', count: categoryCounts.high },
              { id: 'premium', label: 'Premium', count: categoryCounts.premium },
              { id: 'super-premium', label: 'Super Premium', count: categoryCounts['super-premium'] },
            ].map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id as CategoryFilter)}
                  className={`flex-1 min-w-[85px] py-2.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-gold text-black shadow-lg shadow-gold/20 font-bold'
                      : 'bg-foreground/5 border border-foreground/10 text-foreground/70 hover:bg-foreground/10 hover:text-foreground'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-black/20 text-black' : 'bg-foreground/10 text-foreground/60'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Section: List of Essences */}
        <section aria-label="Liste des essences" className="mt-4 flex-1">
          {loading ? (
            <div className="space-y-3 pt-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4 flex items-center justify-between animate-pulse"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-foreground/10" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-foreground/10 rounded" />
                      <div className="h-3 w-44 bg-foreground/10 rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-20 bg-foreground/10 rounded" />
                </div>
              ))}
            </div>
          ) : filteredEssences.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-foreground/15 mt-2">
              <Droplets className="w-10 h-10 text-foreground/30 mx-auto mb-3" />
              <p className="text-base font-semibold text-foreground/80">Aucune essence trouvée</p>
              <p className="text-xs text-foreground/50 mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? `Aucun résultat pour « ${searchQuery} ». Essayez un autre mot-clé.`
                  : "Aucune essence n'est actuellement répertoriée dans cette catégorie."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-xs font-semibold text-gold underline hover:text-gold/80"
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {filteredEssences.map((item) => {
                const category = getItemCategory(item);
                const accentColor = item.color || '#D4B87A';

                return (
                  <article
                    key={item.id}
                    className="group rounded-2xl border border-foreground/10 bg-foreground/[0.02] hover:bg-foreground/[0.05] hover:border-gold/40 p-4 transition-all duration-200 flex items-center justify-between gap-3 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Visual Color Orb */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white/20 shadow-inner"
                        style={{
                          backgroundColor: accentColor,
                          boxShadow: `0 0 12px ${accentColor}40`,
                        }}
                      >
                        <Droplets size={16} className="text-white drop-shadow" />
                      </div>

                      {/* Essence Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight group-hover:text-gold transition-colors truncate">
                            {item.name}
                          </h2>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              category === 'super-premium'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : category === 'premium'
                                ? 'bg-gold/15 text-gold border border-gold/30'
                                : 'bg-foreground/10 text-foreground/70 border border-foreground/15'
                            }`}
                          >
                            {category === 'super-premium' ? 'Super Premium' : category === 'premium' ? 'Premium' : 'High'}
                          </span>
                        </div>

                        {item.description ? (
                          <p className="text-xs text-foreground/60 line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        ) : (
                          <p className="text-xs text-foreground/40 italic mt-0.5">
                            Essence pure de haute parfumerie
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price tag */}
                    <div className="text-right shrink-0 pl-2">
                      <div className="text-base sm:text-lg font-bold font-mono text-gold leading-none">
                        {item.pricePerMl.toLocaleString()}
                      </div>
                      <div className="text-[10px] uppercase font-semibold tracking-wider text-foreground/50 mt-0.5">
                        FCFA / ml
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Bottom Informational Footer */}
        <footer className="mt-10 pt-4 border-t border-foreground/10 text-center text-[11px] text-foreground/45 flex flex-col items-center gap-1">
          <p className="flex items-center gap-1.5 font-medium text-foreground/60">
            <Sparkles size={12} className="text-gold" />
            <span>Tarifs valables pour la confection de parfums sur-mesure au bar</span>
          </p>
          <p>© Accessoires Exclusifs · Tous droits réservés</p>
        </footer>

      </main>
    </div>
  );
}
