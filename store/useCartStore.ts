'use client';

/**
 * @file store/useCartStore.ts
 * @description Global Shopping Cart State synchronized with Backend API.
 *
 * This store acts as the client-side mirror of the server-side cart,
 * supporting both authenticated users and anonymous guests.
 *
 * **State Management**:
 * - **`panierId`**: Server-side cart ID (for anonymous carts or persistence)
 * - **`cart`**: Full cart data from backend
 * - **`isLoading`**: Loading state for async operations
 * - **`error`**: Error message if operation fails
 *
 * **Business Logic Actions**:
 * - **`addPerfume`**: Add perfume to cart via backend
 * - **`addAccessory`**: Add accessory to cart via backend
 * - **`addFinishedEssence`**: Add essence product to cart
 * - **`addCustomPerfume`**: Add custom DIY perfume (auth required)
 * - **`addCustomEssence`**: Add custom DIY essence (auth required)
 * - **`updateQuantity`**: Modify item quantity via backend
 * - **`removeItem`**: Delete item from cart via backend
 * - **`applyPromoCode`**: Apply promo code via backend
 * - **`removePromoCode`**: Remove promo code via backend
 * - **`syncCart`**: Fetch latest cart state from backend
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartService } from '@/services/apiService';
import { useToastStore } from './useToastStore';

function extractApiError(error: any, fallback: string): string {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data.detail === 'string') return data.detail;
  const parts = Object.entries(data).map(([key, val]) => {
    if (Array.isArray(val)) return `${key}: ${val.join(', ')}`;
    return `${key}: ${String(val)}`;
  });
  return parts.length > 0 ? parts.join(' · ') : fallback;
}

export interface CartLine {
  id: number;
  type: 'parfum' | 'accessoire' | 'produit-fini-essence' | 'parfum-personnalise' | 'essence-personnalisee';
  nom: string;
  image?: string;
  quantite: number;
  prix_unitaire_snapshot: number;
  sous_total: number;
  // Type-specific fields
  parfum?: number;
  accessoire?: number;
  produit_fini_essence?: number;
  parfum_personnalise?: number;
  essence_personnalisee?: number;
}

export interface CartData {
  id: number;
  client?: number;
  code_promo_applique: string;
  remise_montant: string;
  remise_pourcentage: string;
  sous_total: string;
  frais_livraison: string;
  total: string;
  statut: string;
  lignes_parfums: CartLine[];
  lignes_accessoires: CartLine[];
  lignes_produit_fini_essence: CartLine[];
  lignes_parfums_perso: CartLine[];
  lignes_essence_personnalisee: CartLine[];
  date_creation: string;
  date_modification: string;
}

interface CartState {
  panierId: number | null;
  cart: CartData | null;
  isLoading: boolean;
  error: string | null;

  // Data fetching
  syncCart: (panierIdOptional?: number) => Promise<void>;

  // Product additions
  addPerfume: (parfumId: number, quantite?: number) => Promise<void>;
  addAccessory: (accessoireId: number, quantite?: number) => Promise<void>;
  addFinishedEssence: (produitId: number, quantite?: number) => Promise<void>;
  addCustomPerfume: (parfumPersoId: number, quantite?: number, noteClient?: string, options?: { silent?: boolean }) => Promise<void>;
  addCustomEssence: (essencePersoId: number, quantite?: number) => Promise<void>;
  addDirectComposition: (data: {
    flacon_id: number;
    lignes: Array<{
      lot_essence_id?: number;
      ingredient?: number;
      quantite_ml: number;
    }>;
    nom?: string;
    note_client?: string;
    quantite?: number;
  }, options?: { silent?: boolean }) => Promise<void>;

  // Legacy API compatibility
  addProduct: (product: any, quantite?: number) => Promise<void>;
  addComposition: (composition: any) => Promise<void>;

  // Cart management
  updateQuantity: (
    type: CartLine['type'],
    ligneId: number,
    quantite: number
  ) => Promise<void>;
  removeItem: (type: CartLine['type'], ligneId: number) => Promise<void>;

  // Promo codes
  applyPromoCode: (code: string) => Promise<void>;
  removePromoCode: () => Promise<void>;

  // Helpers
  getItemCount: () => number;
  getTotalPrice: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getShipping: () => number;
  getAllLines: () => CartLine[];
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      panierId: null,
      cart: null,
      isLoading: false,
      error: null,

      syncCart: async (panierIdOptional?: number) => {
        set({ isLoading: true, error: null });
        const addToast = useToastStore.getState().addToast;
        try {
          const cartData = await cartService.getCart(panierIdOptional);
          set({
            panierId: cartData.id,
            cart: cartData,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMsg =
            error.response?.data?.detail || 'Erreur lors de la synchronisation du panier';
          set({ error: errorMsg, isLoading: false });
          addToast(errorMsg, 'error');
        }
      },

      addPerfume: async (parfumId, quantite = 1) => {
        set({ isLoading: true, error: null });
        const addToast = useToastStore.getState().addToast;
        const state = get();
        try {
          const cartData = await cartService.addPerfume({
            parfum_id: parfumId,
            quantite,
            panier_id: state.panierId || undefined,
          });
          set({
            panierId: cartData.id,
            cart: cartData,
            isLoading: false,
          });
          addToast('Parfum ajouté au panier', 'success');
        } catch (error: any) {
          const errorMsg =
            error.response?.data?.detail || 'Erreur lors de l\'ajout du parfum';
          set({ error: errorMsg, isLoading: false });
          addToast(errorMsg, 'error');
        }
      },

      addAccessory: async (accessoireId, quantite = 1) => {
        set({ isLoading: true, error: null });
        const addToast = useToastStore.getState().addToast;
        const state = get();
        try {
          const cartData = await cartService.addAccessory({
            accessoire_id: accessoireId,
            quantite,
            panier_id: state.panierId || undefined,
          });
          set({
            panierId: cartData.id,
            cart: cartData,
            isLoading: false,
          });
          addToast('Accessoire ajouté au panier', 'success');
        } catch (error: any) {
          const errorMsg =
            error.response?.data?.detail || 'Erreur lors de l\'ajout de l\'accessoire';
          set({ error: errorMsg, isLoading: false });
          addToast(errorMsg, 'error');
        }
      },

      addFinishedEssence: async (produitId, quantite = 1) => {
        set({ isLoading: true, error: null });
        const addToast = useToastStore.getState().addToast;
        const state = get();
        try {
          const cartData = await cartService.addFinishedEssence({
            produit_fini_essence_id: produitId,
            quantite,
            panier_id: state.panierId || undefined,
          });
          set({
            panierId: cartData.id,
            cart: cartData,
            isLoading: false,
          });
          addToast('Essence ajoutée au panier', 'success');
        } catch (error: any) {
          const errorMsg =
            error.response?.data?.detail || 'Erreur lors de l\'ajout de l\'essence';
          set({ error: errorMsg, isLoading: false });
          addToast(errorMsg, 'error');
        }
      },

      addCustomPerfume: async (parfumPersoId, quantite = 1, noteClient, options) => {
        set({ isLoading: true, error: null });
        const addToast = useToastStore.getState().addToast;
        const state = get();
        try {
          const cartData = await cartService.addCustomPerfume({
            parfum_personnalise_id: parfumPersoId,
            quantite,
            panier_id: state.panierId || undefined,
            note_client: noteClient,
          });
          set({
            panierId: cartData.id,
            cart: cartData,
            isLoading: false,
          });
          if (!options?.silent) {
            addToast('Parfum personnalisé ajouté au panier', 'success', {
              href: '/cart',
              hrefLabel: 'Voir le panier →',
            });
          }
        } catch (error: any) {
          const errorMsg = extractApiError(error, 'Erreur lors de l\'ajout du parfum personnalisé');
          set({ error: errorMsg, isLoading: false });
          addToast(errorMsg, 'error');
        }
      },

      addDirectComposition: async (data, options) => {
        set({ isLoading: true, error: null });
        const addToast = useToastStore.getState().addToast;
        const state = get();
        try {
          const cartData = await cartService.addDirectComposition({
            ...data,
            panier_id: state.panierId ?? null,
          });
          set({
            panierId: cartData.id,
            cart: cartData,
            isLoading: false,
          });
          if (!options?.silent) {
            addToast('Composition ajoutée au panier', 'success', {
              href: '/cart',
              hrefLabel: 'Voir le panier →',
            });
          }
        } catch (error: any) {
          const errorMsg = extractApiError(error, 'Erreur lors de l\'ajout de la composition');
          set({ error: errorMsg, isLoading: false });
          addToast(errorMsg, 'error');
          throw error;
        }
      },

      addCustomEssence: async (essencePersoId, quantite = 1) => {
        set({ isLoading: true, error: null });
        const addToast = useToastStore.getState().addToast;
        const state = get();
        try {
          const cartData = await cartService.addCustomEssence({
            essence_personnalisee_id: essencePersoId,
            quantite,
            panier_id: state.panierId || undefined,
          });
          set({
            panierId: cartData.id,
            cart: cartData,
            isLoading: false,
          });
          addToast('Essence personnalisée ajoutée au panier', 'success');
        } catch (error: any) {
          const errorMsg =
            error.response?.data?.detail || 'Erreur lors de l\'ajout de l\'essence personnalisée';
          set({ error: errorMsg, isLoading: false });
          addToast(errorMsg, 'error');
        }
      },

      updateQuantity: async (type, ligneId, quantite) => {
        set({ isLoading: true, error: null });
        const addToast = useToastStore.getState().addToast;
        const state = get();
        try {
          const cartData = await cartService.updateCartLine(
            type,
            ligneId,
            {
              quantite,
              panier_id: state.panierId || undefined,
            }
          );
          set({
            panierId: cartData.id,
            cart: cartData,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMsg =
            error.response?.data?.detail || 'Erreur lors de la mise à jour de la quantité';
          set({ error: errorMsg, isLoading: false });
          addToast(errorMsg, 'error');
        }
      },

      removeItem: async (type, ligneId) => {
        set({ isLoading: true, error: null });
        const addToast = useToastStore.getState().addToast;
        const state = get();
        try {
          const cartData = await cartService.removeCartLine(
            type,
            ligneId,
            state.panierId || undefined
          );
          set({
            panierId: cartData.id,
            cart: cartData,
            isLoading: false,
          });
          addToast('Produit supprimé du panier', 'success');
        } catch (error: any) {
          const errorMsg =
            error.response?.data?.detail || 'Erreur lors de la suppression du produit';
          set({ error: errorMsg, isLoading: false });
          addToast(errorMsg, 'error');
        }
      },

      applyPromoCode: async (code) => {
        set({ isLoading: true, error: null });
        const addToast = useToastStore.getState().addToast;
        const state = get();
        try {
          const cartData = await cartService.applyPromoCode({
            code_promo: code,
            panier_id: state.panierId || undefined,
          });
          set({
            panierId: cartData.id,
            cart: cartData,
            isLoading: false,
          });
          addToast(
            `Code promo appliqué: ${cartData.remise_pourcentage}% de réduction`,
            'success'
          );
        } catch (error: any) {
          const errorMsg =
            error.response?.data?.detail || 'Code promo invalide';
          set({ error: errorMsg, isLoading: false });
          addToast(errorMsg, 'error');
        }
      },

      removePromoCode: async () => {
        set({ isLoading: true, error: null });
        const addToast = useToastStore.getState().addToast;
        const state = get();
        try {
          const cartData = await cartService.removePromoCode(
            state.panierId || undefined
          );
          set({
            panierId: cartData.id,
            cart: cartData,
            isLoading: false,
          });
          addToast('Code promo retiré', 'success');
        } catch (error: any) {
          const errorMsg =
            error.response?.data?.detail || 'Erreur lors du retrait du code promo';
          set({ error: errorMsg, isLoading: false });
          addToast(errorMsg, 'error');
        }
      },

      getItemCount: () => {
        const cart = get().cart;
        if (!cart) return 0;
        return (
          cart.lignes_parfums.reduce((sum, line) => sum + line.quantite, 0) +
          cart.lignes_accessoires.reduce((sum, line) => sum + line.quantite, 0) +
          cart.lignes_produit_fini_essence.reduce(
            (sum, line) => sum + line.quantite,
            0
          ) +
          cart.lignes_parfums_perso.reduce((sum, line) => sum + line.quantite, 0) +
          cart.lignes_essence_personnalisee.reduce(
            (sum, line) => sum + line.quantite,
            0
          )
        );
      },

      getTotalPrice: () => {
        const cart = get().cart;
        return cart ? parseFloat(cart.total) : 0;
      },

      getSubtotal: () => {
        const cart = get().cart;
        return cart ? parseFloat(cart.sous_total) : 0;
      },

      getDiscount: () => {
        const cart = get().cart;
        return cart ? parseFloat(cart.remise_montant) : 0;
      },

      getShipping: () => {
        const cart = get().cart;
        return cart ? parseFloat(cart.frais_livraison) : 0;
      },

      getAllLines: () => {
        const cart = get().cart;
        if (!cart) return [];
        return [
          ...cart.lignes_parfums,
          ...cart.lignes_accessoires,
          ...cart.lignes_produit_fini_essence,
          ...cart.lignes_parfums_perso,
          ...cart.lignes_essence_personnalisee,
        ];
      },

      clearCart: () => {
        set({ panierId: null, cart: null, error: null });
      },

      // Legacy API compatibility - routes Product objects to appropriate endpoints
      addProduct: async (product: any, quantite = 1) => {
        const category = product.category;
        // Route to appropriate endpoint based on product category
        if (category?.includes('perfume')) {
          return get().addPerfume(product.id, quantite);
        } else if (category === 'accessory') {
          return get().addAccessory(product.id, quantite);
        } else {
          // Default to accessory if category unclear
          return get().addAccessory(product.id, quantite);
        }
      },

      // Legacy API compatibility - routes Composition objects
      addComposition: async (composition: any) => {
        // Assume compositions are custom perfumes (parfum-personnalise)
        return get().addCustomPerfume(composition.id, 1);
      },
    }),
    {
      name: 'ae-cart',
      partialize: (state) => ({
        panierId: state.panierId,
      }),
    }
  )
);
