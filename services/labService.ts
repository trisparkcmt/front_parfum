import type { EssenceClient } from '@/types';
import { labService as apiLabService } from './apiService';

// Helper to map backend ingredient/essence to frontend model
export function mapBackendLabItemToEssence(item: any, type: 'ingredient' | 'essence'): EssenceClient {
  let category = item.categorie || item.family || 'premium';
  // Determine family
  const family = type === 'essence' ? category : (item.famille_olfactive || item.family || 'fresh');
  
  return {
    id: String(item.id),
    name: item.nom || item.name || '',
    family: family as any,
    description: item.description || '',
    pricePerMl: parseFloat(item.prix_par_ml || item.prix_unitaire || item.pricePerMl || 300),
    color: item.couleur_hex || item.color || '#D4B87A',
    intensity: item.intensite || item.intensity || 'medium',
    available: item.en_stock !== false && item.available !== false,
  };
}

export const labServiceWrapper = {
  async getIngredients(): Promise<EssenceClient[]> {
    const essences = await apiLabService.getIngredients();
    return essences.map((item: any) => mapBackendLabItemToEssence(item, 'ingredient'));
  },

  async getEssences(): Promise<EssenceClient[]> {
    const essences = await apiLabService.getEssences();
    return essences.map((item: any) => mapBackendLabItemToEssence(item, 'essence'));
  }
};

// Export as default and named export for compatibility
export { labServiceWrapper as labService };
