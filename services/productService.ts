import { Product, ProductCategory, AccessorySubCategory } from '@/types';
import { shopService as apiShopService } from './apiService';

// Helper to map backend perfume to frontend Product model
export function mapBackendPerfumeToProduct(p: any): Product {
  // Determine frontend category mapping
  let category: ProductCategory = 'perfume-brand';
  if (p.categorie === 'perfume-dupe' || p.nom?.toLowerCase().includes('dupe') || p.reference_sku?.startsWith('DUPE')) {
    category = 'perfume-dupe';
  } else if (p.categorie === 'numba-creation' || p.nom?.toLowerCase().includes('numba') || p.brand === 'Numba') {
    category = 'numba-creation';
  } else if (p.tags?.some((t: any) => t.nom === 'Dupe') || p.reference_sku?.includes('DP')) {
    category = 'perfume-dupe';
  }

  // Handle images
  const images = [];
  if (p.image_principale) {
    images.push(p.image_principale);
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

  // Parse notes
  const top = p.notes_tete ? p.notes_tete.split(',').map((s: string) => s.trim()) : [];
  const middle = p.notes_coeur ? p.notes_coeur.split(',').map((s: string) => s.trim()) : [];
  const base = p.notes_fond ? p.notes_fond.split(',').map((s: string) => s.trim()) : [];

  return {
    id: String(p.id),
    name: p.nom,
    description: p.description_courte || p.description_longue || '',
    price: parseFloat(p.prix_actuel || p.prix_unitaire),
    category,
    images,
    brand: p.marque || (category === 'numba-creation' ? 'Numba' : 'Exclusif Parfums'),
    inStock: p.stock_quantite > 0,
    rating: p.rating || 4.5,
    reviews: p.reviews || 12,
    notes: { top, middle, base },
    volume: p.contenance_ml ? `${p.contenance_ml}ml` : '100ml',
    longevity: p.longevite || 'Longue durée (8-10h)',
    sillage: p.sillage || 'Modéré',
    gender: p.genre_cible === 'homme' ? 'masculine' : p.genre_cible === 'femme' ? 'feminine' : 'unisex',
    isFeatured: p.est_bestseller || p.est_nouveau || false,
    createdAt: p.date_creation || new Date().toISOString(),
  };
}

// Helper to map backend accessory to frontend Product model
export function mapBackendAccessoryToProduct(p: any): Product {
  const images = [];
  if (p.image_principale) {
    images.push(p.image_principale);
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
    price: parseFloat(p.prix_actuel || p.prix_unitaire),
    category: 'accessory',
    subCategory,
    images,
    brand: p.marque || 'Exclusif Collection',
    inStock: p.stock_quantite > 0 || p.en_stock !== false,
    rating: p.rating || 4.5,
    reviews: p.reviews || 8,
    volume: p.taille ? `Taille ${p.taille}` : undefined,
    availableColors: p.couleur ? [p.couleur] : [],
    isFeatured: p.est_bestseller || false,
    createdAt: p.date_creation || new Date().toISOString(),
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
  }
};
