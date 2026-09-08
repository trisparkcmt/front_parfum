import type { EssenceClient } from '@/types';
import { labService as apiLabService } from './apiService';

// Helper to map backend ingredient/essence to frontend model
export function mapBackendLabItemToEssence(item: Record<string, any>, type: 'ingredient' | 'essence'): EssenceClient {
  const category = item.categorie || item.family || 'premium';
  const family = type === 'essence' ? category : (item.famille_olfactive || item.family || 'fresh');

  const lotId =
    item.lot_essence_id ??
    item.lot_actif_id ??
    (typeof item.lot_actif === 'object' ? item.lot_actif?.id : item.lot_actif) ??
    (typeof item.lot === 'object' ? item.lot?.id : undefined);

  return {
    id: String(item.id),
    backendId: item.id,
    itemType: type,
    lotEssenceId: lotId != null ? Number(lotId) : undefined,
    name: item.nom || item.name || '',
    family: family as EssenceClient['family'],
    description: item.description || '',
    pricePerMl: parseFloat(item.prix_par_ml || item.prix_unitaire || item.pricePerMl || '300'),
    color: item.couleur_hex || item.color || '#D4B87A',
    intensity: item.intensite || item.intensity || 'medium',
    available:
      item.stock_total_ml != null
        ? Number(item.stock_total_ml) > 0 && item.actif !== false
        : item.en_stock !== false && item.available !== false && item.actif !== false,
  };
}

export const labServiceWrapper = {
  async getIngredients(): Promise<EssenceClient[]> {
    const items = await apiLabService.getIngredients();
    return items.map((item) => mapBackendLabItemToEssence(item as Record<string, any>, 'ingredient'));
  },

  async getEssences(): Promise<EssenceClient[]> {
    const items = await apiLabService.getEssences();
    return items.map((item) => mapBackendLabItemToEssence(item as Record<string, any>, 'essence'));
  },

  /** Essences with active lots — for POS / composition-directe */
  async getEssencesForDirectSale(): Promise<EssenceClient[]> {
    const essences = await this.getEssences();
    return essences.filter((e) => e.available && e.pricePerMl > 0);
  },
};

export { labServiceWrapper as labService };
