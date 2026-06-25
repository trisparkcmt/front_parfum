import type { EssenceClient } from '@/types';
import { labService as apiLabService } from './apiService';

// Helper to map backend ingredient/essence to frontend model
export function mapBackendLabItemToEssence(item: any, type: 'ingredient' | 'essence'): EssenceClient {
  let category = item.categorie || item.family || 'premium';
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
    available: item.en_stock !== false && item.available !== false && item.actif !== false,
  };
}

async function attachLotsToEssences(essences: EssenceClient[]): Promise<EssenceClient[]> {
  try {
    const lotsRes = await apiLabService.getLotsEssence({ actif: true });
    const lots = lotsRes.results || lotsRes.resultats || (Array.isArray(lotsRes) ? lotsRes : []);
    const lotByEssence = new Map<number, number>();

    for (const lot of lots) {
      const essenceId = typeof lot.essence === 'object' ? lot.essence.id : lot.essence;
      const stock = parseFloat(lot.stock_ml || '0');
      if (!essenceId || stock <= 0) continue;
      if (!lotByEssence.has(essenceId)) {
        lotByEssence.set(essenceId, lot.id);
      }
    }

    return essences.map((e) => ({
      ...e,
      lotEssenceId: e.lotEssenceId ?? (e.backendId ? lotByEssence.get(e.backendId) : undefined),
    }));
  } catch {
    return essences;
  }
}

export const labServiceWrapper = {
  async getIngredients(): Promise<EssenceClient[]> {
    const items = await apiLabService.getIngredients();
    return items.map((item: any) => mapBackendLabItemToEssence(item, 'ingredient'));
  },

  async getEssences(): Promise<EssenceClient[]> {
    const items = await apiLabService.getEssences();
    const mapped = items.map((item: any) => mapBackendLabItemToEssence(item, 'essence'));
    return attachLotsToEssences(mapped);
  },

  /** Essences with active lots — for POS / composition-directe */
  async getEssencesForDirectSale(): Promise<EssenceClient[]> {
    const essences = await this.getEssences();
    return essences.filter((e) => e.lotEssenceId && e.available && e.pricePerMl > 0);
  },
};

export { labServiceWrapper as labService };
