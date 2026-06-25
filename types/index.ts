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

export type UserRole = 'client' | 'superadmin' | 'delivery' | 'partner' | 'serveuse';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  roles: UserRole[];
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
  originalPrice?: number; // Original price if there's a promotion
  taux_reduction?: string; // Reduction percentage as a string (e.g., "15.00")
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
  slug?: string;
  isFeatured?: boolean;
  createdAt: string;
  image_principale?: string;
  image_supp_1?: string;
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

export interface EssenceClient {
  id: string;
  name: string;
  family: OlfactiveFamily;
  description: string;
  pricePerMl: number; // FCFA per ml
  color: string; // hex color for visualization
  intensity: 'light' | 'medium' | 'strong';
  imageUrl?: string;
  available: boolean;
  /** Numeric backend ID (essence catalogue or ingredient) */
  backendId?: number;
  /** Active lot ID — required for composition-directe */
  lotEssenceId?: number;
  itemType?: 'ingredient' | 'essence';
}

export interface CompositionEssence {
  essence: EssenceClient;
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

// ---- Backend Order (API response format) ----

export interface BackendOrderLine {
  id: number;
  parfum?: number;
  accessoire?: number;
  produit_fini_essence?: number;
  parfum_personnalise?: number;
  essence_personnalisee?: number;
  nom_snapshot: string;
  quantite: number;
  prix_unitaire_snapshot: string;
  remise_ligne: string;
  sous_total: string;
}

export interface BackendOrder {
  id: number;
  numero_commande: string;
  client: number;
  client_email: string;
  prestataire: number | null;
  prestataire_code: string | null;
  livreur: number | null;
  livreur_nom: string | null;
  statut: 'en_attente' | 'validé' | 'annulée' | 'remboursée';
  statut_livraison: 'en_attente_affectation' | 'assignée' | 'livrée' | 'échouée';
  statut_paiement: 'en_attente' | 'payé' | 'échoué';
  sous_total: string;
  remise_code_promo: string;
  code_promo_utilise: string | null;
  frais_livraison: string;
  total_ttc: string;
  commission_montant: string;
  commission_statut: string;
  livraison_nom_complet: string;
  livraison_quartier: string | null;
  livraison_ville: string | null;
  livraison_telephone: string;
  date_livraison_estimee: string | null;
  date_livraison_reelle: string | null;
  note_client: string;
  note_interne: string;
  motif_echec_livraison: string | null;
  date_creation: string;
  date_modification: string;
  lignes_parfums: BackendOrderLine[];
  lignes_accessoires: BackendOrderLine[];
  lignes_produit_fini_essence: BackendOrderLine[];
  lignes_parfums_perso: BackendOrderLine[];
  lignes_essence_personnalisee: BackendOrderLine[];
  facture?: {
    numero_facture: string;
    date_emission: string;
    fichier_pdf?: string;
    envoye_par_email?: boolean;
  };
}

export interface BackendOrdersPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendOrder[];
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

export type DeliveryMethod = 'delivery' | 'pickup';
export type DeliveryStatus = 'en_attente_affectation' | 'assignée' | 'en_cours' | 'livrée' | 'échouée';

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

export interface OrderDeliveryDetails {
  method: DeliveryMethod;
  status: DeliveryStatus;
  livreurId?: number;
  livreurNom?: string;
  livreurTelephone?: string;
  adressePickup?: string;
  adresseDelivery: string;
  dateEstimee?: string;
  dateReelle?: string;
  motifEchec?: string;
}

export interface OrderDetailsResponse extends BackendOrder {
  deliveryDetails?: OrderDeliveryDetails;
}

export interface AdminOrderValidation {
  deliveryMethod: DeliveryMethod;
  livreurId?: number;
  dateEstimee?: string;
  notes?: string;
}

export interface AdminOrderCancellation {
  reason?: string;
}

export interface OrderStatusUpdate {
  status: OrderStatus;
  motif?: string;
  livreurId?: number;
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

// ---- Catalog: Shop ----

export type GenreCible = 'homme' | 'femme' | 'mixte';
export type Intensite = 'légère' | 'moyenne' | 'forte' | 'très forte';
export type TagType = 'famille_olfactive' | 'humeur' | 'saison' | 'occasion' | 'signe_astrologique' | 'moment_journee';

export interface TagEssence {
  id: number;
  nom: string;
  slug: string;
  type: TagType;
}

export interface PromotionSchedule {
  taux_reduction?: string;
  prix_promotionnel?: string;
  date_debut?: string | null;
  date_fin?: string | null;
  message_promotion?: string | null;
}

export interface ShopPromotion {
  type_article: 'parfum' | 'accessoire';
  id: number;
  slug: string;
  nom: string;
  marque: string;
  image_principale?: string | null;
  prix_original: string;
  prix_promotionnel: string;
  taux_reduction: number;
  message_promotion?: string | null;
  date_debut: string;
  date_fin: string;
}

export interface CategorieAccessoire {
  id: number;
  nom: string;
  slug: string;
  description?: string;
  taux_reduction?: string;
  date_debut?: string | null;
  date_fin?: string | null;
  message_promotion?: string | null;
}

export interface TypeFlacon {
  id: number;
  nom: string;
  slug: string;
  description?: string;
}

export interface Parfum {
  id: number;
  marque: string;
  nom: string;
  slug: string;
  reference_sku?: string;
  description_courte?: string;
  contenance_ml: number;
  prix_unitaire: string;
  prix_actuel: string;
  prix_promotionnel?: string;
  taux_reduction?: string;
  date_debut?: string | null;
  date_fin?: string | null;
  en_promotion: boolean;
  genre_cible: GenreCible;
  intensite?: Intensite;
  notes_tete?: string;
  notes_coeur?: string;
  notes_fond?: string;
  tags: TagEssence[];
  famille_olfactive?: string[];
  humeurs_compatibles?: string[];
  occasions?: string[];
  saisons_compatibles?: string[];
  est_nouveau: boolean;
  est_bestseller: boolean;
  image_principale: string;
  image_supp_1?: string;
  image_supp_2?: string;
  image_supp_3?: string;
  image_supp_4?: string;
  stock_quantite: number;
  date_creation: string;
  date_modification?: string;
  produits_similaires?: Parfum[];
  is_favori: boolean;
  categorie: number;
}

export interface Accessoire {
  id: number;
  marque: string;
  nom: string;
  slug: string;
  reference_sku?: string;
  type_accessoire: CategorieAccessoire | number;
  description_courte?: string;
  description_longue?: string;
  matiere?: string;
  couleur?: string;
  taille?: string;
  prix_unitaire: string;
  prix_actuel: string;
  prix_promotionnel?: string;
  taux_reduction?: string;
  date_debut?: string | null;
  date_fin?: string | null;
  en_promotion: boolean;
  stock_quantite: number;
  seuil_alerte_stock: number;
  poids_grammes?: string;
  image_principale: string;
  image_supp_1?: string;
  image_supp_2?: string;
  image_supp_3?: string;
  image_supp_4?: string;
  actif: boolean;
  est_bestseller: boolean;
  est_hotseller: boolean;
  date_creation: string;
  date_modification: string;
  produits_similaires?: Accessoire[];
  is_favori: boolean;
}

export interface CategorieParfum {
  id: number;
  nom: string;
  slug: string;
  description?: string;
  ordre_affichage?: number;
  actif?: boolean;
  taux_reduction?: string;
  date_debut?: string | null;
  date_fin?: string | null;
  message_promotion?: string | null;
  image?: string | null;
}

export interface Flacon {
  id: number;
  nom: string;
  type_flacon: TypeFlacon | number;
  contenance_ml: number;
  matiere?: string;
  couleur?: string;
  hauteur_cm?: string;
  largeur_cm?: string;
  poids_grammes?: string;
  prix_unitaire: string;
  stock_quantite: number;
  seuil_alerte_stock: number;
  image_principale?: string;
  actif: boolean;
  date_creation: string;
}

export interface EssenceDetails {
  id: number;
  marque: string;
  nom: string;
  slug: string;
  categorie: string;
  code_reference: string;
  description?: string;
  prix_par_ml: string;
  actif: boolean;
  stock_total_ml: string;
}

export interface ProduitFiniEssence {
  id: number;
  essence: number | EssenceDetails;
  essence_details?: EssenceDetails;
  taille_ml: number;
  prix: string;
  prix_actuel: string;
  prix_promotionnel?: string;
  prix_par_ml: string;
  stock_disponible: number;
  stock_precedent?: number;
  actif: boolean;
  image_principale?: string;
  image_supp_1?: string;
  image_supp_2?: string;
  image_supp_3?: string;
  image_supp_4?: string;
}

// ---- Catalog: Lab ----

export interface Essence {
  id: number;
  marque: string;
  nom: string;
  slug: string;
  categorie: string;
  code_reference: string;
  description?: string;
  prix_par_ml: string;
  actif: boolean;
  tags: TagEssence[];
  famille_olfactive?: string[];
  stock_total_ml: string;
  date_creation: string;
  date_modification?: string;
}

export interface LotEssence {
  id: number;
  essence: number | EssenceDetails;
  essence_details?: EssenceDetails;
  stock_ml: string;
  stock_precedent_ml?: string;
  seuil_alerte_ml?: string;
  actif: boolean;
  date_reception: string;
  reference_fournisseur?: string;
}

export interface Ingredient {
  id: number;
  nom: string;
  slug: string;
  description?: string;
  prix_par_ml: string;
  stock_ml: string;
  seuil_alerte_ml: string;
  actif: boolean;
  date_creation: string;
  date_modification?: string;
}

// ---- Pagination ----

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---- Filter Parameters ----

export interface PerfumeFilterParams {
  search?: string;
  ordering?: string;
  marque?: string;
  genre?: GenreCible;
  intensite?: Intensite;
  contenance_ml?: number;
  prix_min?: number;
  prix_max?: number;
  est_nouveau?: boolean;
  est_bestseller?: boolean;
  famille_olfactive?: string;
  humeur?: string;
  saison?: string;
  occasion?: string;
  tags?: string; // comma-separated IDs
  page?: number;
}

export interface AccessoireFilterParams {
  search?: string;
  ordering?: string;
  marque?: string;
  type_accessoire?: number;
  type_nom?: string;
  prix_min?: number;
  prix_max?: number;
  couleur?: string;
  matiere?: string;
  taille?: string;
  en_stock?: boolean;
  page?: number;
}

export interface EssenceFilterParams {
  genre?: GenreCible;
  intensite?: Intensite;
  prix_min?: number;
  prix_max?: number;
  stock_min?: number;
  famille_olfactive?: string;
  humeur?: string;
  saison?: string;
  occasion?: string;
  page?: number;
}
