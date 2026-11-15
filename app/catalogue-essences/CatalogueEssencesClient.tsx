'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Droplets, Maximize2, Minimize2, RefreshCw, Search, X } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { productService } from '@/services/productService';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

type OilCategory = 'all' | 'high' | 'premium' | 'super-premium';

function getOilCategory(oil: Product): Exclude<OilCategory, 'all'> {
  const category = String(oil.categorie || '').toLowerCase().replace(/[_\s]+/g, '-');
  if (category === 'high' || category.includes('high')) return 'high';
  if (category === 'super-premium' || category.includes('super-premium')) return 'super-premium';
  return 'premium';
}

function getCategoryLabel(category: Exclude<OilCategory, 'all'>) {
  if (category === 'super-premium') return 'Super Premium';
  return category === 'high' ? 'High' : 'Premium';
}

export default function CatalogueEssencesClient() {
  const { user, isAuthenticated } = useAuthStore();
  const [oils, setOils] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<OilCategory>('all');
  const [selectedOil, setSelectedOil] = useState<Product | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isStaffOrAdmin = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [];
    return roles.includes('superadmin') || roles.includes('serveuse') ||
      user.role === 'superadmin' || user.role === 'serveuse';
  }, [isAuthenticated, user]);

  const dashboardHref = useMemo(() => {
    if (!user) return '/dashboard';
    const roles = Array.isArray(user.roles) ? user.roles : [];
    return roles.includes('serveuse') || user.role === 'serveuse'
      ? '/dashboard/serveuse/dashboard'
      : '/dashboard/admin/dashboard';
  }, [user]);

  useEffect(() => {
    let active = true;
    productService.getEssencesAsProducts({ includeUnavailable: true })
      .then((response) => {
        if (!active) return;
        const products = Array.isArray(response) ? response : response.results;
        setOils(products);
      })
      .catch((error: unknown) => {
        console.error('Erreur lors du chargement du catalogue des huiles:', error);
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const categoryCounts = useMemo(() => ({
    all: oils.length,
    high: oils.filter((oil) => getOilCategory(oil) === 'high').length,
    premium: oils.filter((oil) => getOilCategory(oil) === 'premium').length,
    'super-premium': oils.filter((oil) => getOilCategory(oil) === 'super-premium').length,
  }), [oils]);

  const filteredOils = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return oils.filter((oil) => {
      if (selectedCategory !== 'all' && getOilCategory(oil) !== selectedCategory) return false;
      if (!query) return true;
      return [
        oil.name,
        oil.description,
        oil.brand,
        oil.code_reference,
        oil.categorie,
        ...(oil.famille_olfactive || []),
        ...(oil.notes?.top || []),
        ...(oil.notes?.middle || []),
        ...(oil.notes?.base || []),
      ].some((value) => String(value || '').toLowerCase().includes(query));
    });
  }, [oils, searchQuery, selectedCategory]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error('Impossible de modifier le mode plein écran:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center selection:bg-gold/30">
      <main className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-6 pb-24 shadow-2xl sm:px-6">
        <div className="pointer-events-none fixed left-1/2 top-0 -z-10 h-72 w-full max-w-xl -translate-x-1/2 rounded-full bg-gold/5 blur-[100px]" />

        <div className="flex items-center justify-between gap-2 pb-4 pt-1">
          {isStaffOrAdmin ? (
            <Link
              href={dashboardHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-all hover:border-gold/30 hover:text-gold"
            >
              <ArrowLeft size={14} />
              <span>Tableau de bord</span>
            </Link>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span>Entrée Boutique</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setLoading(true);
                setLoadError(false);
                setRefreshKey((key) => key + 1);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/15 bg-foreground/5 text-foreground/60 transition-all hover:border-gold/30 hover:text-gold"
              title="Actualiser le catalogue"
              aria-label="Actualiser"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/15 bg-foreground/5 text-foreground/60 transition-all hover:border-gold/30 hover:text-gold"
              title={isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}
              aria-label="Plein écran"
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          </div>
        </div>

        <header className="mb-6 mt-2 flex flex-col items-center text-center">
          <img
            src="/logo/Longo only2.svg"
            alt="Accessoires Exclusifs"
            className="mb-3 h-16 w-auto object-contain sm:h-20"
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold sm:text-xs">
            Atelier Numba · Bar à Parfum
          </span>
          <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
            Catalogue des Huiles
          </h1>
          <p className="mt-1 max-w-sm text-xs text-foreground/60 sm:text-sm">
            Découvrez nos huiles de parfum, leurs formats et leurs caractéristiques
          </p>
        </header>

        <div className="sticky top-2 z-20 space-y-3 rounded-2xl bg-background/85 pb-3 pt-1 backdrop-blur-xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher une huile, une note..."
              className="w-full rounded-2xl border border-foreground/10 bg-foreground/5 py-3.5 pl-11 pr-10 text-sm text-foreground shadow-sm transition-all placeholder:text-foreground/40 focus:border-gold/60 focus:bg-foreground/[0.07] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-foreground/10 text-foreground/60 transition-colors hover:bg-foreground/20"
                aria-label="Effacer la recherche"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <nav
            aria-label="Catégories d'huiles"
            className="no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1"
          >
            {([
              { id: 'all', label: 'Toutes' },
              { id: 'high', label: 'High' },
              { id: 'premium', label: 'Premium' },
              { id: 'super-premium', label: 'Super Premium' },
            ] as const).map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`flex-none min-w-[85px] whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gold text-black shadow-lg shadow-gold/20'
                      : 'border border-foreground/10 bg-foreground/5 text-foreground/70 hover:bg-foreground/10 hover:text-foreground'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 font-mono text-[10px] ${isActive ? 'bg-black/20 text-black' : 'bg-foreground/10 text-foreground/60'}`}>
                    {categoryCounts[tab.id]}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <section aria-label="Liste des huiles" className="mt-4 flex-1">
          {loading ? (
            <div className="space-y-3 pt-2">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="h-[76px] animate-pulse rounded-2xl border border-foreground/10 bg-foreground/[0.03]" />
              ))}
            </div>
          ) : loadError ? (
            <div className="rounded-3xl border border-dashed border-red-500/30 px-4 py-12 text-center text-sm text-foreground/60">
              Impossible de charger le catalogue des huiles. Veuillez réessayer.
            </div>
          ) : filteredOils.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-foreground/15 px-4 py-16 text-center">
              <Droplets className="mx-auto mb-3 h-10 w-10 text-foreground/30" />
              <p className="text-base font-semibold text-foreground/80">Aucune huile trouvée</p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-foreground/50">
                {searchQuery ? `Aucun résultat pour « ${searchQuery} ». Essayez un autre mot-clé.` : 'Aucune huile ne correspond à cette catégorie.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {filteredOils.map((oil) => {
                const category = getOilCategory(oil);
                return (
                  <button
                    key={oil.id}
                    type="button"
                    onClick={() => setSelectedOil(oil)}
                    className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4 text-left shadow-sm transition-all hover:border-gold/40 hover:bg-foreground/[0.05] hover:shadow-md"
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-gold sm:text-base">
                          {oil.name}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          category === 'super-premium'
                            ? 'border-amber-500/30 bg-amber-500/20 text-amber-300'
                            : category === 'premium'
                              ? 'border-gold/30 bg-gold/15 text-gold'
                              : 'border-foreground/15 bg-foreground/10 text-foreground/70'
                        }`}>
                          {getCategoryLabel(category)}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-xs text-foreground/55">
                        {oil.description || oil.famille_olfactive?.join(' · ') || 'Huile de parfum'}
                      </span>
                    </span>
                    <span className="shrink-0 pl-2 text-right">
                      <span className="block font-mono text-base font-bold leading-none text-gold sm:text-lg">
                        {oil.price > 0 ? formatPrice(oil.price) : 'Formats disponibles'}
                      </span>
                      <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
                        {oil.price > 0 ? 'Dès le format' : 'Consulter les formats'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-10 flex flex-col items-center gap-1 border-t border-foreground/10 pt-4 text-center text-[11px] text-foreground/45">
          <p>Formats et caractéristiques des huiles disponibles en boutique</p>
          <p>© Accessoires Exclusifs · Tous droits réservés</p>
        </footer>
      </main>

      {selectedOil && (
        <OilDetailsModal oil={selectedOil} onClose={() => setSelectedOil(null)} />
      )}
    </div>
  );
}

function OilDetailsModal({ oil, onClose }: { oil: Product; onClose: () => void }) {
  const availableFormats = (oil.produits_finis || [])
    .filter((format) => format.actif && format.stock_disponible > 0)
    .sort((a, b) => a.taille_ml - b.taille_ml);
  const details = [
    { label: 'Référence', value: oil.code_reference },
    { label: 'Catégorie', value: oil.categorie ? getCategoryLabel(getOilCategory(oil)) : undefined },
    { label: 'Marque', value: oil.brand },
    { label: 'Origine', value: oil.origine_pays },
    { label: 'Intensité', value: oil.intensite },
    { label: 'Cible', value: oil.genre_cible },
    { label: 'Famille olfactive', value: oil.famille_olfactive?.join(', ') },
    { label: 'Concentration', value: oil.concentration_max ? `${oil.concentration_max}%` : undefined },
    { label: 'Durée', value: oil.duree },
  ].filter((detail): detail is { label: string; value: string } => Boolean(detail.value));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="oil-modal-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-foreground/10 bg-background p-5 shadow-2xl sm:rounded-3xl sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
              {getCategoryLabel(getOilCategory(oil))}
            </p>
            <h2 id="oil-modal-title" className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
              {oil.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 text-foreground/65 transition-colors hover:text-gold"
          >
            <X size={18} />
          </button>
        </div>

        {oil.description && (
          <p className="mb-6 whitespace-pre-line text-sm leading-relaxed text-foreground/70">
            {oil.description_longue || oil.description}
          </p>
        )}

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-foreground/55">
            Formats disponibles
          </h3>
          {availableFormats.length ? (
            <div className="divide-y divide-foreground/10 rounded-2xl border border-foreground/10">
              {availableFormats.map((format) => (
                <div key={format.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <span className="text-sm font-semibold text-foreground">
                    {format.taille_ml} ml
                  </span>
                  <span className="text-right">
                    {format.prix_promotionnel && Number(format.prix_promotionnel) > format.prix_actuel && (
                      <span className="mr-2 text-xs text-foreground/40 line-through">
                        {formatPrice(Number(format.prix_promotionnel))}
                      </span>
                    )}
                    <span className="font-mono text-sm font-bold text-gold">
                      {formatPrice(format.prix_actuel)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 text-sm text-foreground/55">
              Aucun format disponible actuellement.
            </p>
          )}
        </div>

        {oil.notes && Object.values(oil.notes).some((notes) => notes.length > 0) && (
          <div className="mt-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-foreground/55">
              Notes olfactives
            </h3>
            {([
              ['Tête', oil.notes.top],
              ['Cœur', oil.notes.middle],
              ['Fond', oil.notes.base],
            ] as const).filter(([, notes]) => notes.length > 0).map(([label, notes]) => (
              <p key={label} className="text-sm leading-relaxed text-foreground/75">
                <span className="font-semibold text-gold">{label} : </span>
                {notes.join(' · ')}
              </p>
            ))}
          </div>
        )}

        {details.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-foreground/55">
              Caractéristiques
            </h3>
            <dl className="divide-y divide-foreground/10 border-t border-foreground/10">
              {details.map((detail) => (
                <div key={detail.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-3 py-3 text-sm">
                  <dt className="text-foreground/45">{detail.label}</dt>
                  <dd className="text-right font-medium text-foreground/80">{detail.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>
    </div>
  );
}
