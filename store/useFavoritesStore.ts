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
  addFavorite: (product: Product) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
  syncWithBackend: () => Promise<void>;
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

      addFavorite: async (product) => {
        // Optimistically add to state
        set((state) => {
          if (state.items.some((p) => p.id === product.id)) return state;
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
          const isAccessory = product.category === 'accessory';
          const isFinishedEssence = product.category === 'huile' || product.category === 'produit-fini-essence' || product.taille_ml !== undefined;

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

      removeFavorite: async (productId) => {
        const product = get().items.find((p) => p.id === productId);

        // Optimistically remove from state
        set((state) => ({
          items: state.items.filter((p) => p.id !== productId),
        }));

        const isCustomComposition = (product as any)?.isCustomComposition;
        if (isCustomComposition) {
          return;
        }

        // Sync with backend if authenticated and product is found
        const isAuth = useAuthStore.getState().isAuthenticated;
        if (isAuth && product) {
          try {
            const identifier = product.slug || String(product.id);
            const isAccessory = product.category === 'accessory';
            const isFinishedEssence = product.category === 'huile' || product.category === 'produit-fini-essence' || product.taille_ml !== undefined;

            if (isAccessory) {
              await shopService.toggleAccessoryFavorite(identifier);
            } else if (isFinishedEssence) {
              await shopService.toggleFinishedEssenceFavorite(product.id);
            } else {
              await shopService.togglePerfumeFavorite(identifier);
            }
          } catch (e) {
            console.warn('Could not sync removed favorite with backend, retaining local state.', e);
          }
        }
      },

      isFavorite: (productId) => {
        return get().items.some((p) => p.id === productId);
      },

      clearFavorites: () => {
        set({ items: [] });
      },

      syncWithBackend: async () => {
        const isAuth = useAuthStore.getState().isAuthenticated;
        if (!isAuth) return;

        try {
          // Fetch enriched user profile directly from /auth/me/
          const meData = await authService.getMe();

          // Sync user store with fresh profile data (favoris & parfums_personnalises)
          const currentUser = useAuthStore.getState().user;
          if (currentUser && meData) {
            useAuthStore.setState({
              user: {
                ...currentUser,
                favoris: meData.favoris || currentUser.favoris,
                parfums_personnalises: meData.parfums_personnalises || currentUser.parfums_personnalises,
                commandes: meData.commandes || currentUser.commandes,
                preferences: meData.preferences || currentUser.preferences,
                client: meData.client || currentUser.client,
              },
            });
          }
          
          // Map backend favoris from /auth/me/ to Products
          const backendFavs: any[] = meData?.favoris || [];
          const products: Product[] = backendFavs.map((fav: any) => {
            const typeProduit = String(fav.type_produit || fav.type || '').toLowerCase();
            const isAccessory = typeProduit === 'accessoire' || typeProduit === 'accessory';
            const isCustom = typeProduit === 'parfum-personnalise' || typeProduit === 'custom' || typeProduit === 'numba-creation';
            const isFinishedEssence = typeProduit === 'produit-fini-essence' || typeProduit === 'huile' || fav.essence_id || fav.taille_ml;
            return {
              id: String(fav.produit_id || fav.id_produit || fav.id),
              name: fav.nom_produit || fav.nom || 'Produit',
              description: '',
              price: parseFloat(fav.prix_produit || fav.price || '0'),
              category: isAccessory ? 'accessory' : isCustom ? 'numba-creation' : isFinishedEssence ? 'produit-fini-essence' : 'perfume-brand',
              images: fav.image_produit ? [fav.image_produit] : ['/parfume1.png'],
              inStock: true,
              slug: fav.slug_produit || fav.slug || '',
              createdAt: fav.date_ajout || new Date().toISOString(),
              isCustomComposition: isCustom ? true : undefined,
              taille_ml: fav.taille_ml ? Number(fav.taille_ml) : undefined,
            };
          });

          set({ items: products });
        } catch (e) {
          console.warn('Could not pull favorites from /auth/me/, keeping local stored list.', e);
        }
      }
    }),

    {
      name: 'ae-favorites',
    }
  )
);
