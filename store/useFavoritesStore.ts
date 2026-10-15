'use client';

/**
 * @file store/useFavoritesStore.ts
 * @description User Wishlist & Favorites Management synced with Backend API endpoints.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';
import { api } from '@/services/api';
import { authService, shopService } from '@/services/apiService';
import { useAuthStore } from './useAuthStore';

interface FavoritesState {
  items: Product[];
  customPerfumes: any[];
  addFavorite: (product: Product) => Promise<void>;
  removeFavorite: (productId: string, category?: string) => Promise<void>;
  isFavorite: (productId: string, category?: string) => boolean;
  clearFavorites: () => void;
  syncWithBackend: () => Promise<void>;
}

export function normalizeCategory(cat?: string): string {
  if (!cat) return '';
  const c = String(cat).toLowerCase().trim();
  if (c === 'accessoire' || c === 'accessory' || c === 'accessoires') return 'accessory';
  if (c === 'huile' || c === 'produit-fini-essence' || c === 'produit_fini_essence' || c === 'essence') return 'essence';
  if (c === 'diffuseur' || c === 'diffuser' || c === 'diffuseurs') return 'diffuseur';
  if (c === 'custom' || c === 'numba-creation' || c === 'parfum-personnalise' || c === 'parfum_personnalise') return 'custom';
  if (c === 'perfume' || c === 'parfum' || c === 'parfums' || c.startsWith('perfume-')) return 'perfume';
  return c;
}

export function matchesProduct(
  p: Product,
  targetIdOrSlug: string | number,
  targetCategory?: string,
  targetSlug?: string
): boolean {
  const targetStr = String(targetIdOrSlug).trim();
  const pId = String(p.id).trim();
  const pSlug = p.slug ? String(p.slug).trim() : '';
  const tSlug = targetSlug ? String(targetSlug).trim() : '';

  const normTarget = targetCategory ? normalizeCategory(targetCategory) : '';
  const normP = p.category ? normalizeCategory(p.category) : '';

  // If both have categories and they differ, they CANNOT be the same product
  if (normTarget && normP && normTarget !== normP) {
    return false;
  }

  // Check matching by slug
  if (pSlug && (pSlug === targetStr || (tSlug && pSlug === tSlug))) {
    return true;
  }

  // Check matching by ID
  if (pId === targetStr) {
    return true;
  }

  return false;
}

// Helper to convert product name to slug if not present
function getProductSlug(product: Product): string {
  // Try using name to form slug if not directly on the model
  const rawSlug = (product as any).slug || product.name;
  return rawSlug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      customPerfumes: [],

      addFavorite: async (product) => {
        // Optimistically add to state if not already existing
        set((state) => {
          if (state.items.some((p) => matchesProduct(p, product.id, product.category, product.slug))) return state;
          return { items: [...state.items, product] };
        });

        const isCustomComposition = (product as any).isCustomComposition;
        if (isCustomComposition) {
          return;
        }

        // Sync with backend if authenticated
        const isAuth = useAuthStore.getState().isAuthenticated;
        if (isAuth) {
          const identifier = product.slug || String(product.id);
          const normCat = normalizeCategory(product.category);
          const isAccessory = normCat === 'accessory';
          const isFinishedEssence = normCat === 'essence' || product.taille_ml !== undefined;

          try {
            let response;
            if (isAccessory) {
              response = await shopService.toggleAccessoryFavorite(identifier);
            } else if (isFinishedEssence) {
              response = await shopService.toggleFinishedEssenceFavorite(product.id);
            } else {
              response = await shopService.togglePerfumeFavorite(identifier);
            }

            // If API returned "retiré" but we added it, keep it in sync or respect the backend status
            if (response?.status === 'retiré') {
              if (isAccessory) {
                await shopService.toggleAccessoryFavorite(identifier);
              } else if (isFinishedEssence) {
                await shopService.toggleFinishedEssenceFavorite(product.id);
              } else {
                await shopService.togglePerfumeFavorite(identifier);
              }
            }
          } catch (e) {
            console.warn('Could not sync added favorite with backend, retaining local state.', e);
          }
        }
      },

      removeFavorite: async (productId, category) => {
        const product = get().items.find((p) => matchesProduct(p, productId, category));

        // Optimistically remove from state
        set((state) => ({
          items: state.items.filter((p) => !matchesProduct(p, productId, category)),
        }));

        const isCustomComposition = (product as any)?.isCustomComposition;
        if (isCustomComposition) {
          return;
        }

        // Sync with backend if authenticated and product is found
        const isAuth = useAuthStore.getState().isAuthenticated;
        if (isAuth) {
          try {
            const identifier = product?.slug || String(productId);
            const effectiveCategory = product?.category || category;
            const normCat = normalizeCategory(effectiveCategory);
            const isAccessory = normCat === 'accessory';
            const isFinishedEssence = normCat === 'essence' || (product as any)?.taille_ml !== undefined;

            if (isAccessory) {
              await shopService.toggleAccessoryFavorite(identifier);
            } else if (isFinishedEssence) {
              await shopService.toggleFinishedEssenceFavorite(productId);
            } else {
              await shopService.togglePerfumeFavorite(identifier);
            }
          } catch (e) {
            console.warn('Could not sync removed favorite with backend, retaining local state.', e);
          }
        }
      },

      isFavorite: (productId, category) => {
        return get().items.some((p) => matchesProduct(p, productId, category));
      },

      clearFavorites: () => {
        set({ items: [] });
      },

      syncWithBackend: async () => {
        const isAuth = useAuthStore.getState().isAuthenticated;
        if (!isAuth) return;

        try {
          // Fetch favorites & custom perfumes directly from /shop/favoris/ (no /auth/me/ call)
          const data = await shopService.getFavorites();

          let backendFavs: any[] = [];
          let backendCustom: any[] = [];

          if (data && typeof data === 'object') {
            if (Array.isArray(data.favoris)) {
              backendFavs = data.favoris;
              backendCustom = Array.isArray(data.parfums_personnalises) ? data.parfums_personnalises : [];
            } else if (Array.isArray(data)) {
              backendFavs = data;
            }
          }

          // Sync user store with fresh parfums_personnalises without calling /auth/me/
          const currentUser = useAuthStore.getState().user;
          if (currentUser && backendCustom.length > 0) {
            useAuthStore.setState({
              user: {
                ...currentUser,
                parfums_personnalises: backendCustom,
              },
            });
          }

          // Map backend favoris from /shop/favoris/ to Products
          const products: Product[] = backendFavs.map((fav: any) => {
            const typeProduit = String(fav.type_produit || fav.type || '').toLowerCase();
            const isAccessory = typeProduit === 'accessoire' || typeProduit === 'accessory';
            const isCustom = typeProduit === 'parfum-personnalise' || typeProduit === 'custom' || typeProduit === 'numba-creation';
            const isFinishedEssence = typeProduit === 'produit_fini_essence' || typeProduit === 'produit-fini-essence' || typeProduit === 'huile' || fav.essence_id || fav.taille_ml;
            const isDiffuseur = typeProduit === 'diffuseur' || typeProduit === 'diffuser';
            return {
              id: String(fav.produit_id || fav.id_produit || fav.id),
              name: fav.nom_produit || fav.nom || 'Produit',
              description: '',
              price: parseFloat(fav.prix_produit || fav.price || '0'),
              category: isAccessory ? 'accessory' : isCustom ? 'numba-creation' : isFinishedEssence ? 'produit-fini-essence' : isDiffuseur ? 'diffuseur' : 'perfume-brand',
              images: fav.image_produit ? [fav.image_produit] : [],
              inStock: true,
              slug: fav.slug_produit || fav.slug || '',
              createdAt: fav.date_ajout || new Date().toISOString(),
              isCustomComposition: isCustom ? true : undefined,
              taille_ml: fav.taille_ml ? Number(fav.taille_ml) : undefined,
            };
          });

          set({ items: products, customPerfumes: backendCustom });
        } catch (e) {
          console.warn('Could not pull favorites from /shop/favoris/, keeping local stored list.', e);
        }
      }
    }),

    {
      name: 'ae-favorites',
    }
  )
);
