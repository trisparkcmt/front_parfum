'use client';

/**
 * @file store/useFavoritesStore.ts
 * @description User Wishlist & Favorites Management synced with Backend API endpoints.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';
import { api } from '@/services/api';
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

        // Sync with backend if authenticated
        const isAuth = useAuthStore.getState().isAuthenticated;
        if (isAuth) {
          const slug = getProductSlug(product);
          const isAccessory = product.category === 'accessory';
          const endpoint = isAccessory
            ? `shop/accessoires/${slug}/favori/`
            : `shop/parfums/${slug}/favori/`;
          
          try {
            const response = await api.post(endpoint);
            // If API returned "retiré" but we added it, keep it in sync or respect the backend status
            if (response.data?.status === 'retiré') {
              // Toggle again to make sure it is "ajouté"
              await api.post(endpoint);
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

        // Sync with backend if authenticated and product is found
        const isAuth = useAuthStore.getState().isAuthenticated;
        if (isAuth && product) {
          const slug = getProductSlug(product);
          const isAccessory = product.category === 'accessory';
          const endpoint = isAccessory
            ? `shop/accessoires/${slug}/favori/`
            : `shop/parfums/${slug}/favori/`;
          
          try {
            const response = await api.post(endpoint);
            // If API returned "ajouté" but we removed it, toggle it again to make it "retiré"
            if (response.data?.status === 'ajouté') {
              await api.post(endpoint);
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
          // Fetch from /api/v1/shop/favoris/
          const response = await api.get('shop/favoris/');
          
          // Map backend favoris structure to Products
          const backendFavs: any[] = response.data || [];
          const products: Product[] = backendFavs.map((fav: any) => {
            const isAccessory = fav.type_produit === 'accessoire' || fav.type_produit === 'accessory';
            return {
              id: String(fav.id_produit || fav.id),
              name: fav.nom_produit,
              description: '',
              price: parseFloat(fav.prix_produit),
              category: isAccessory ? 'accessory' : 'perfume-brand',
              images: fav.image_produit ? [fav.image_produit] : ['/parfume1.png'],
              inStock: true,
              slug: fav.slug_produit || '',
              createdAt: fav.date_ajout || new Date().toISOString(),
            };
          });

          if (products.length > 0) {
            set({ items: products });
          }
        } catch (e) {
          console.warn('Could not pull favorites from backend database, keeping local stored list.', e);
        }
      }
    }),
    {
      name: 'ae-favorites',
    }
  )
);
