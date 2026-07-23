import { Product, ProductCategory, AccessorySubCategory } from '@/types';
import { shopService as apiShopService } from './apiService';

// Internal map to store perfume category ID to frontend category type mapping
let _perfumeCategoriesMap: Map<number, ProductCategory> | null = null;
let _perfumeCategoryNames: Map<number, string> = new Map();

// Function to load perfume categories from the backend and populate the map
async function _loadPerfumeCategories() {
  if (_perfumeCategoriesMap) return; // Already loaded

  try {
    const response = await apiShopService.getPerfumeCategories();
    const categories = Array.isArray(response) ? response : (response.results || response.resultats || []);
    _perfumeCategoriesMap = new Map();
    categories.forEach((cat: any) => {
      const nomLower = cat.nom?.toLowerCase() || '';
      const frontendCategory: ProductCategory = 
        nomLower.includes('dupe') || nomLower.includes('inspiration') ? 'perfume-dupe' :
        nomLower.includes('numba') ? 'numba-creation' :
        'perfume-brand';
      _perfumeCategoriesMap?.set(cat.id, frontendCategory);
      _perfumeCategoryNames.set(cat.id, cat.nom);
    });
  } catch (error) {
    console.error('Failed to load perfume categories for mapping:', error);
    _perfumeCategoriesMap = new Map(); // Initialize as empty map to prevent repeated attempts
  }
}

// Helper to map backend perfume to frontend Product model
export function mapBackendPerfumeToProduct(p: any): Product {
  // Determine frontend category mapping
  let category: ProductCategory = 'perfume-brand'; // Default fallback

  // Prioritize mapping from backend category ID if available and loaded
  if (typeof p.categorie === 'number' && _perfumeCategoriesMap) {
    const mappedCategory = _perfumeCategoriesMap.get(p.categorie);
    if (mappedCategory) {
      category = mappedCategory;
    }
  } else if (typeof p.categorie === 'string') {
    // Fallback for cases where p.categorie might still be a string (e.g., old data or different endpoint)
    if (p.categorie === 'perfume-dupe') {
      category = 'perfume-dupe';
    } else if (p.categorie === 'numba-creation') {
      category = 'numba-creation';
    }
  } else if (typeof p.categorie === 'object' && p.categorie !== null) {
    category = p.categorie.nom || 'perfume-brand';
  }

  // Apply keyword-based overrides/refinements if they are more specific
  if (p.nom?.toLowerCase().includes('dupe') || p.reference_sku?.startsWith('DUPE') || p.tags?.some((t: any) => t.nom === 'Dupe') || p.reference_sku?.includes('DP')) {
    category = 'perfume-dupe';
  } else if (p.nom?.toLowerCase().includes('numba') || p.brand === 'Numba') {
    category = 'numba-creation';
  }

  const images = collectProductImages(p);

  // Parse notes
  const top = p.notes_tete ? p.notes_tete.split(',').map((s: string) => s.trim()) : [];
  const middle = p.notes_coeur ? p.notes_coeur.split(',').map((s: string) => s.trim()) : [];
  const base = p.notes_fond ? p.notes_fond.split(',').map((s: string) => s.trim()) : [];

  return {
    id: String(p.id),
    name: p.nom,
    description: p.description_courte || p.description_longue || '',
    price: parseFloat(p.prix_actuel || p.prix_unitaire || '0'),
    originalPrice: parseFloat(p.prix_unitaire),
    taux_reduction: p.taux_reduction || (
      p.prix_unitaire && p.prix_actuel && parseFloat(p.prix_unitaire) > parseFloat(p.prix_actuel)
        ? String(Math.round((1 - parseFloat(p.prix_actuel) / parseFloat(p.prix_unitaire)) * 100))
        : undefined
    ),
    category: category,
    images,
    brand: p.marque || (category === 'numba-creation' ? 'Numba' : 'Exclusif Parfums'),
    inStock: p.stock_quantite > 0 && !p.rupture_de_stock,
    rating: p.rating || 4.5,
    reviews: p.reviews || 12,
    notes: { top, middle, base },
    volume: p.contenance_ml ? `${p.contenance_ml}ml` : '100ml',
    longevity: p.longevite || 'Longue durée (8-10h)',
    sillage: p.sillage || 'Modéré',
    gender: p.genre_cible === 'homme' ? 'masculine' : p.genre_cible === 'femme' ? 'feminine' : 'unisex',
    slug: p.slug || '',
    isFeatured: p.est_bestseller || p.est_nouveau || false,
    createdAt: p.date_creation || new Date().toISOString(),
    image_principale: p.image_principale || images[0],
    image_supp_1: p.image_supp_1 || images[1],
  };
}

function collectProductImages(p: any): string[] {
  const images: string[] = [];
  if (p.image_principale) {
    images.push(p.image_principale);
  }
  for (const key of ['image_supp_1', 'image_supp_2', 'image_supp_3', 'image_supp_4'] as const) {
    if (p[key]) {
      images.push(p[key]);
    }
  }
  if (Array.isArray(p.images_supplementaires)) {
    p.images_supplementaires.forEach((img: any) => {
      if (img.image) {
        images.push(img.image);
      } else if (typeof img === 'string') {
        images.push(img);
      }
    });
  }
  if (images.length === 0) {
    images.push('/parfume1.png');
  }
  return images;
}

// Helper to map backend accessory to frontend Product model
export function mapBackendAccessoryToProduct(p: any): Product {
  const images = collectProductImages(p);

  // Determine subCategory
  let subCategory: AccessorySubCategory = 'other';
  const typeNom = p.type_accessoire?.nom?.toLowerCase() || p.type_nom?.toLowerCase() || '';
  if (typeNom.includes('montre') || typeNom.includes('watch')) {
    subCategory = 'watches';
  } else if (typeNom.includes('bijou') || typeNom.includes('jewelry') || typeNom.includes('collier') || typeNom.includes('bracelet') || typeNom.includes('bague')) {
    subCategory = 'jewelry';
  } else if (typeNom.includes('sac') || typeNom.includes('bag')) {
    subCategory = 'bags';
  } else if (typeNom.includes('lunette') || typeNom.includes('glass')) {
    subCategory = 'sunglasses';
  } else if (typeNom.includes('ceinture') || typeNom.includes('belt')) {
    subCategory = 'belts';
  }

  return {
    id: String(p.id),
    name: p.nom,
    description: p.description_courte || '',
    price: parseFloat(p.prix_actuel || p.prix_unitaire || '0'),
    originalPrice: parseFloat(p.prix_unitaire),
    taux_reduction: p.taux_reduction || (
      p.prix_unitaire && p.prix_actuel && parseFloat(p.prix_unitaire) > parseFloat(p.prix_actuel)
        ? String(Math.round((1 - parseFloat(p.prix_actuel) / parseFloat(p.prix_unitaire)) * 100))
        : undefined
    ),
    category: 'accessory',
    subCategory,
    images,
    brand: p.marque || 'Exclusif Collection',
    inStock: (p.stock_quantite > 0 || p.en_stock !== false) && !p.rupture_de_stock,
    rating: p.rating || 4.5,
    reviews: p.reviews || 8,
    volume: p.taille ? `Taille ${p.taille}` : undefined,
    availableColors: p.couleur ? [p.couleur] : [],
    slug: p.slug || '',
    isFeatured: p.est_bestseller || false,
    createdAt: p.date_creation || new Date().toISOString(),
    image_principale: p.image_principale || images[0],
    image_supp_1: p.image_supp_1 || images[1],
  };
}

// Helper to map backend finished essence to frontend Product model
export function mapBackendFinishedEssenceToProduct(p: any): Product {
  const images = collectProductImages(p);

  return {
    id: String(p.id),
    name: p.nom || p.essence_details?.nom || `Essence #${p.essence || p.id}`,
    description: p.description_courte || p.description_longue || '',
    price: parseFloat(p.prix_actuel || p.prix || '0'),
    originalPrice: parseFloat(p.prix_promotionnel || p.prix || '0'),
    taux_reduction: p.taux_reduction || (
      p.prix && p.prix_promotionnel && parseFloat(p.prix) > parseFloat(p.prix_promotionnel)
        ? String(Math.round((1 - parseFloat(p.prix_promotionnel) / parseFloat(p.prix)) * 100))
        : undefined
    ),
    category: 'huile',
    images,
    brand: p.marque || 'Exclusif Collection',
    inStock: (p.stock_disponible > 0 || p.actif !== false),
    rating: p.rating || 4.5,
    reviews: p.reviews || 5,
    volume: p.taille_ml ? `${p.taille_ml}ml` : undefined,
    slug: p.slug || String(p.id),
    isFeatured: p.est_bestseller || false,
    createdAt: p.date_creation || new Date().toISOString(),
    image_principale: p.image_principale || images[0],
    image_supp_1: p.image_supp_1 || images[1],
  };
}

export interface PerfumeFilterParams {
  famille_olfactive?: string;
  humeur?: string;
  saison?: string;
  occasion?: string;
  genre?: 'homme' | 'femme' | 'mixte';
  intensite?: 'légère' | 'moyenne' | 'forte' | 'très forte';
  contenance_ml?: number;
  prix_min?: number;
  prix_max?: number;
  est_nouveau?: boolean;
  est_bestseller?: boolean;
  search?: string;
  ordering?: string;
  categorie?: number;
}

export interface AccessoryFilterParams {
  type_accessoire?: string;
  prix_min?: number;
  prix_max?: number;
  couleur?: string;
  matiere?: string;
  taille?: string;
  en_stock?: boolean;
  search?: string;
  ordering?: string;
}

export const productService = {
  /**
   * Fetch perfumes from API with optional filters - API ONLY
   */
  async getPerfumes(filters?: PerfumeFilterParams): Promise<Product[]> {
    await _loadPerfumeCategories(); // Ensure categories are loaded before fetching products
    const params: any = {};
    if (filters) {
      if (filters.famille_olfactive && filters.famille_olfactive !== 'all') params.famille_olfactive = filters.famille_olfactive;
      if (filters.humeur && filters.humeur !== 'all') params.humeur = filters.humeur;
      if (filters.saison && filters.saison !== 'all') params.saison = filters.saison;
      if (filters.occasion && filters.occasion !== 'all') params.occasion = filters.occasion;
      if (filters.genre && (filters.genre as string) !== 'all') params.genre = filters.genre;
      if (filters.intensite && (filters.intensite as string) !== 'all') params.intensite = filters.intensite;
      if (filters.contenance_ml) params.contenance_ml = filters.contenance_ml;
      if (filters.prix_min) params.prix_min = filters.prix_min;
      if (filters.prix_max) params.prix_max = filters.prix_max;
      if (filters.est_nouveau !== undefined) params.est_nouveau = filters.est_nouveau;
      if (filters.est_bestseller !== undefined) params.est_bestseller = filters.est_bestseller;
      if (filters.search) params.search = filters.search;
      if (filters.ordering) params.ordering = filters.ordering;
      if (filters.categorie) params.categorie = filters.categorie;
    }

    const response = await apiShopService.getPerfumes(params);
    
    // Handle standard paginated response vs raw array
    let results: any[] = [];
    if (response) {
      if (Array.isArray(response)) {
        results = response;
      } else if (Array.isArray(response.results)) {
        results = response.results;
      } else if (Array.isArray(response.resultats)) {
        results = response.resultats;
      }
    }

    return results.map(mapBackendPerfumeToProduct);
  },

  /**
   * Fetch accessories from API with optional filters - API ONLY
   */
  async getAccessories(filters?: AccessoryFilterParams): Promise<Product[]> {
    const params: any = {};
    if (filters) {
      if (filters.type_accessoire && filters.type_accessoire !== 'all') params.type_accessoire = filters.type_accessoire;
      if (filters.prix_min) params.prix_min = filters.prix_min;
      if (filters.prix_max) params.prix_max = filters.prix_max;
      if (filters.couleur && filters.couleur !== 'all') params.couleur = filters.couleur;
      if (filters.matiere && filters.matiere !== 'all') params.matiere = filters.matiere;
      if (filters.taille && filters.taille !== 'all') params.taille = filters.taille;
      if (filters.en_stock !== undefined) params.en_stock = filters.en_stock;
      if (filters.search) params.search = filters.search;
      if (filters.ordering) params.ordering = filters.ordering;
    }

    const response = await apiShopService.getAccessories(params);
    
    let results: any[] = [];
    if (response) {
      if (Array.isArray(response)) {
        results = response;
      } else if (Array.isArray(response.results)) {
        results = response.results;
      } else if (Array.isArray(response.resultats)) {
        results = response.resultats;
      }
    }

    return results.map(mapBackendAccessoryToProduct);
  },

  /**
   * Fetch diffuseurs de parfum from API with optional filters - API ONLY
   */
  async getDiffuseurs(filters?: { search?: string; ordering?: string }): Promise<Product[]> {
    const params: any = {};
    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.ordering) params.ordering = filters.ordering;
    }

    const response = await apiShopService.getDiffuseurs(params);
    
    let results: any[] = [];
    if (response) {
      if (Array.isArray(response)) {
        results = response;
      } else if (Array.isArray(response.results)) {
        results = response.results;
      } else if (Array.isArray(response.resultats)) {
        results = response.resultats;
      }
    }

    return results.map((p: any) => {
      const images = collectProductImages(p);
      return {
        id: String(p.id),
        name: p.nom || 'Diffuseur de Parfum',
        nom: p.nom,
        description: p.description_courte || p.description_longue || '',
        description_courte: p.description_courte,
        price: parseFloat(p.prix_unitaire || '0'),
        prix_unitaire: p.prix_unitaire,
        originalPrice: parseFloat(p.prix_unitaire || '0'),
        category: 'accessory',
        subCategory: 'other',
        images,
        brand: 'Exclusif Diffuseurs',
        inStock: p.stock_quantite > 0 && p.actif !== false,
        rating: 4.8,
        reviews: 12,
        slug: p.slug || String(p.id),
        createdAt: p.date_creation || new Date().toISOString(),
        image_principale: p.image_principale || images[0],
        type_technologie: p.type_technologie,
        is_new: p.est_nouveau,
        is_bestseller: p.est_bestseller,
        capacite_reservoir_ml: p.capacite_reservoir_ml,
        est_connecte: p.est_connecte,
        a_jeux_de_lumiere: p.a_jeux_de_lumiere,
      };
    });
  },

  /**
   * Fetch finished essence products from API with optional search and ordering filters
   */
  async getFinishedEssenceProducts(filters?: { search?: string; ordering?: string }): Promise<Product[]> {
    const params: any = {};
    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.ordering) params.ordering = filters.ordering;
    }

    const response = await apiShopService.getFinishedEssences(params);
    
    let results: any[] = [];
    if (response) {
      if (Array.isArray(response)) {
        results = response;
      } else if (Array.isArray(response.results)) {
        results = response.results;
      } else if (Array.isArray(response.resultats)) {
        results = response.resultats;
      }
    }

    return results.map(mapBackendFinishedEssenceToProduct);
  },

  /**
   * Fetch a single product by ID from API - API ONLY
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      // Try as perfume by slug first
      const perfume = await apiShopService.getPerfumeBySlug(id).catch(() => null);
      if (perfume) {
        return mapBackendPerfumeToProduct(perfume);
      }

      // Try as accessory by slug
      const accessory = await apiShopService.getAccessoryBySlug(id).catch(() => null);
      if (accessory) {
        return mapBackendAccessoryToProduct(accessory);
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      return null;
    }
  },

  /**
   * Fetch all available bottles for DIY
   */
  async getBottles() {
    return apiShopService.getBottles();
  },

  /**
   * Get user favorites
   */
  async getFavorites() {
    return apiShopService.getFavorites();
  },

  /**
   * Toggle favorite status for perfume
   */
  async togglePerfumeFavorite(slug: string) {
    return apiShopService.togglePerfumeFavorite(slug);
  },

  /**
   * Toggle favorite status for accessory
   */
  async toggleAccessoryFavorite(slug: string) {
    return apiShopService.toggleAccessoryFavorite(slug);
  },

  /**
   * Fetch bestseller perfumes from API
   */
  async getBestsellerPerfumes(): Promise<Product[]> {
    await _loadPerfumeCategories(); // Ensure categories are loaded before fetching products
    const response = await apiShopService.getPerfumeBestsellers();
    
    let results: any[] = [];
    if (response) {
      if (Array.isArray(response)) {
        results = response;
      } else if (Array.isArray(response.results)) {
        results = response.results;
      } else if (Array.isArray(response.resultats)) {
        results = response.resultats;
      }
    }

    return results.map(mapBackendPerfumeToProduct);
  },

  /**
   * Fetch hotseller perfumes (trending) from API
   */
  async getHotsellerPerfumes(): Promise<Product[]> {
    await _loadPerfumeCategories(); // Ensure categories are loaded before fetching products
    const response = await apiShopService.getPerfumeHotsellers();
    
    let results: any[] = [];
    if (response) {
      if (Array.isArray(response)) {
        results = response;
      } else if (Array.isArray(response.results)) {
        results = response.results;
      } else if (Array.isArray(response.resultats)) {
        results = response.resultats;
      }
    }

    return results.map(mapBackendPerfumeToProduct);
  },

  /**
   * Fetch all accessory types from backend
   */
  async getAccessoryTypes(): Promise<{id: number, name: string, subcategory: AccessorySubCategory, icone?: string | null}[]> {
    const response = await apiShopService.getAccessoryTypes();
    const results = Array.isArray(response) ? response : (response.results || response.resultats || []);

    return results.map((type: any) => {
      const nom = type.nom?.toLowerCase() || '';
      let subcategory: AccessorySubCategory = 'other';

      if (nom.includes('montre') || nom.includes('watch')) {
        subcategory = 'watches';
      } else if (nom.includes('bijou') || nom.includes('jewelry') || nom.includes('collier') || nom.includes('bracelet') || nom.includes('bague')) {
        subcategory = 'jewelry';
      } else if (nom.includes('sac') || nom.includes('bag')) {
        subcategory = 'bags';
      } else if (nom.includes('lunette') || nom.includes('glass')) {
        subcategory = 'sunglasses';
      } else if (nom.includes('ceinture') || nom.includes('belt')) {
        subcategory = 'belts';
      }

      return {
        id: type.id,
        name: type.nom,
        subcategory,
        icone: type.icone || null,
      };
    });
  },

  async getPerfumeCategories(): Promise<{ id: number; name: string; type: string; image?: string | null; icone?: string | null }[]> {
    const response = await apiShopService.getPerfumeCategories();
    const results = Array.isArray(response) ? response : (response.results || response.resultats || []);

    // Return every real backend category with its actual id and name
    return results.map((cat: any) => ({
      id: cat.id,
      name: cat.nom,
      type: cat.slug || String(cat.id),
      image: cat.image || null,
      icone: cat.icone || null,
    }));
  }
}
