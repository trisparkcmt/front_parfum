/**
 * @file types/index.ts
 * @description Global TypeScript Type Definitions & Interfaces.
 *
 * This file centralizes all domain models and data structures used throughout 
 * the Accessories Exclusif platform, ensuring strong type safety and consistency.
 * 
 * **Core Model Groups**:
 * - **User & Auth**: Defines `User`, `UserRole`, and login/registration payloads.
 * - **Product & Shop**: Interfaces for `Product`, `ProductCategory`, and `OlfactiveFamily` metadata.
 * - **Numba Atelier**: Complex structures for `Essence`, `CompositionEssence`, and `CustomComposition`.
 * - **Order & Cart**: Definitions for `CartItem`, `Order`, `OrderStatus`, and `DeliveryTask`.
 * - **UI & Navigation**: Types for `NavLink`, `GeminiMessage`, and component-specific interfaces.
 * 
 * **Benefit**: Provides a unified source for type information, reducing runtime errors and improving developer productivity.
 */
// ============================================================
// Accessories Exclusif — Type Definitions
// ============================================================

// ---- User & Auth ----

export type UserRole = 'client' | 'admin' | 'delivery' | 'partner';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ---- Products ----

export type ProductCategory =
  | 'accessory'
  | 'perfume-brand'
  | 'perfume-dupe'
  | 'numba-creation';

export type AccessorySubCategory =
  | 'watches'
  | 'jewelry'
  | 'bags'
  | 'sunglasses'
  | 'belts'
  | 'other';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in FCFA
  category: ProductCategory;
  subCategory?: AccessorySubCategory;
  images: string[];
  brand?: string;
  inStock: boolean;
  rating?: number;
  reviews?: number;
  // Perfume-specific
  notes?: {
    top: string[];
    middle: string[];
    base: string[];
  };
  volume?: string; // e.g., "100ml"
  longevity?: string; // e.g., "Longue durée (8-10h)"
  sillage?: string; // e.g., "Modéré"
  gender?: 'masculine' | 'feminine' | 'unisex';
  availableColors?: string[]; // hex codes or names
  originalBrand?: string; // for dupes — the brand they imitate
  slug: string;
  isFeatured?: boolean;
  createdAt: string;
}

export interface Accessory extends Product {}

// ---- Essences & Custom Perfume ----

export type OlfactiveFamily =
  | 'citrus'
  | 'floral'
  | 'woody'
  | 'oriental'
  | 'fresh'
  | 'spicy'
  | 'fruity'
  | 'aquatic'
  | 'gourmand'
  | 'musk';

export interface Essence {
  id: string;
  name: string;
  family: OlfactiveFamily;
  description: string;
  pricePerMl: number; // FCFA per ml
  color: string; // hex color for visualization
  intensity: 'light' | 'medium' | 'strong';
  imageUrl?: string;
  available: boolean;
}

export interface CompositionEssence {
  essence: Essence;
  quantityMl: number; // in increments of 10ml
}

export interface CustomComposition {
  id: string;
  name: string;
  essences: CompositionEssence[];
  totalMl: number; // max 100ml
  totalPrice: number;
  createdBy: string; // user id
  createdAt: string;
  isAiGenerated: boolean;
}

// ---- Cart ----

export type CartItemType = 'product' | 'custom-composition';

export interface CartItem {
  id: string;
  type: CartItemType;
  product?: Product;
  composition?: CustomComposition;
  quantity: number;
  unitPrice: number;
}

export interface CartState {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number; // percentage (e.g., 10 for 10%)
  addProduct: (product: Product, quantity?: number) => void;
  addComposition: (composition: CustomComposition) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  applyPromoCode: (code: string) => void;
  clearPromoCode: () => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

// ---- Favorites ----

export interface FavoritesState {
  items: Product[];
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
}

// ---- Orders ----

export type OrderStatus = 'pending' | 'validated' | 'delivering' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  type: CartItemType;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  items: OrderItem[];
  subtotal: number;
  promoCode?: string;
  promoDiscount?: number;
  total: number;
  status: OrderStatus;
  deliveryPersonId?: string;
  deliveryPersonName?: string;
  partnerId?: string; // the prestataire whose code was used
  createdAt: string;
  validatedAt?: string;
  deliveredAt?: string;
}

// ---- Promo / Partner ----

export interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  partnerId: string;
  partnerName: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface PartnerStats {
  partnerId: string;
  promoCode: string;
  totalSales: number;
  totalOrders: number;
  totalEarnings: number;
  commissionPercent: number;
  orders: Order[];
}

// ---- Delivery ----

export interface DeliveryTask {
  orderId: string;
  clientName: string;
  clientPhone: string;
  items: OrderItem[];
  total: number;
  assignedAt: string;
  status: 'assigned' | 'in_transit' | 'delivering' | 'delivered' | 'failed';
  deliveryAddress?: string;
}

// ---- AI / Gemini ----

export interface GeminiMessage {
  role: 'user' | 'assistant';
  content: string;
  recommendation?: CustomComposition;
}

export interface GeminiRequest {
  messages: { role: string; content: string }[];
  preferences?: {
    occasion?: string;
    season?: string;
    personality?: string;
    intensity?: string;
    budget?: number;
  };
}

// ---- Navigation ----

export interface NavLink {
  label: string;
  href: string;
  icon?: string;
  roles?: UserRole[]; // which roles can see this link
}
