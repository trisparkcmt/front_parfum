'use client';

/**
 * @file store/useFavoritesStore.ts
 * @description User Wishlist & Favorites Management.
 *
 * This store allows users to bookmark luxury items they are interested in, 
 * providing a persistent wishlist across sessions.
 * 
 * **Core Functionalities**:
 * - **`favorites`**: An array of product IDs that the user has marked as favorite.
 * - **`toggleFavorite`**: A smart action that either adds or removes a product ID from the list based on its current presence.
 * - **`isFavorite`**: A helper function to check if a specific product ID is currently in the wishlist.
 * - **`clearFavorites`**: Wipes the entire wishlist.
 * 
 * **Integration**: Uses `persist` middleware to save favorites to `localStorage`. It is primarily consumed by the `ProductCard` component to render the "Heart" icon status.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

interface FavoritesState {
  items: Product[];
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],

      addFavorite: (product) => {
        set((state) => {
          if (state.items.some((p) => p.id === product.id)) return state;
          return { items: [...state.items, product] };
        });
      },

      removeFavorite: (productId) => {
        set((state) => ({
          items: state.items.filter((p) => p.id !== productId),
        }));
      },

      isFavorite: (productId) => {
        return get().items.some((p) => p.id === productId);
      },

      clearFavorites: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'ae-favorites',
    }
  )
);
