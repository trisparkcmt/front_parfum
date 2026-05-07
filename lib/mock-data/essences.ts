/**
 * @file lib/mock-data/essences.ts
 * @description Olfactive Essence Dataset for the Numba Atelier.
 *
 * This file contains the complete library of fragrance ingredients (essences) 
 * available for the custom perfume creation experience.
 * 
 * **Essence Data Model**:
 * - **`id` / `name`**: Unique identifiers for each ingredient.
 * - **`family`**: Categorization (e.g., 'Citrus', 'Woody', 'Floral').
 * - **`description`**: A localized sensory description of the scent profile.
 * - **`color`**: A HEX code representing the physical color of the essence, used for liquid blending.
 * - **`pricePerMl`**: The cost in FCFA per milliliter, allowing for granular price calculation.
 * 
 * **Role**: Serves as the primary data source for the `AtelierLab` and the `MixerTool`.
 */
import type { Essence } from '@/types';

export const mockEssences: Essence[] = [
  // CITRUS
  {
    id: 'ess-001',
    name: 'Bergamote de Calabre',
    family: 'citrus',
    description: 'Agrume lumineux et élégant, apportant fraîcheur et énergie solaire.',
    pricePerMl: 350,
    color: '#F4D03F',
    intensity: 'light',
    available: true,
  },
  {
    id: 'ess-002',
    name: 'Citron de Menton',
    family: 'citrus',
    description: 'Zeste de citron vif et pétillant, une explosion de fraîcheur.',
    pricePerMl: 300,
    color: '#F9E74D',
    intensity: 'light',
    available: true,
  },
  {
    id: 'ess-003',
    name: 'Orange Sanguine',
    family: 'citrus',
    description: 'Douceur fruitée avec une touche acidulée unique.',
    pricePerMl: 320,
    color: '#FF8C00',
    intensity: 'medium',
    available: true,
  },
  // FLORAL
  {
    id: 'ess-004',
    name: 'Rose de Damas',
    family: 'floral',
    description: 'La reine des fleurs, riche et envoûtante.',
    pricePerMl: 500,
    color: '#FF69B4',
    intensity: 'strong',
    available: true,
  },
  {
    id: 'ess-005',
    name: 'Jasmin Sambac',
    family: 'floral',
    description: 'Floral blanc intense et narcotique, très sensuel.',
    pricePerMl: 550,
    color: '#FFE4E1',
    intensity: 'strong',
    available: true,
  },
  {
    id: 'ess-006',
    name: 'Ylang-Ylang',
    family: 'floral',
    description: 'Fleur tropicale crémeuse et sucrée.',
    pricePerMl: 400,
    color: '#FFDAB9',
    intensity: 'medium',
    available: true,
  },
  // WOODY
  {
    id: 'ess-007',
    name: 'Bois de Santal',
    family: 'woody',
    description: 'Crémeux et velouté, une base chaleureuse et méditative.',
    pricePerMl: 600,
    color: '#DEB887',
    intensity: 'medium',
    available: true,
  },
  {
    id: 'ess-008',
    name: 'Cèdre de l\'Atlas',
    family: 'woody',
    description: 'Bois sec et noble, apporte structure et élégance.',
    pricePerMl: 380,
    color: '#A0522D',
    intensity: 'medium',
    available: true,
  },
  {
    id: 'ess-009',
    name: 'Vétiver d\'Haïti',
    family: 'woody',
    description: 'Racine terreuse et fumée, sophistication masculine.',
    pricePerMl: 450,
    color: '#556B2F',
    intensity: 'strong',
    available: true,
  },
  // ORIENTAL
  {
    id: 'ess-010',
    name: 'Ambre Gris',
    family: 'oriental',
    description: 'Chaleur dorée, profondeur et mystère intemporel.',
    pricePerMl: 700,
    color: '#DAA520',
    intensity: 'strong',
    available: true,
  },
  {
    id: 'ess-011',
    name: 'Vanille de Madagascar',
    family: 'oriental',
    description: 'Douce, gourmande et réconfortante, la vanille pure.',
    pricePerMl: 480,
    color: '#F5DEB3',
    intensity: 'medium',
    available: true,
  },
  {
    id: 'ess-012',
    name: 'Encens d\'Oman',
    family: 'oriental',
    description: 'Résine sacrée, fumée mystique et spirituelle.',
    pricePerMl: 520,
    color: '#CD853F',
    intensity: 'strong',
    available: true,
  },
  // FRESH
  {
    id: 'ess-013',
    name: 'Menthe Poivrée',
    family: 'fresh',
    description: 'Fraîcheur glaciale et vivifiante.',
    pricePerMl: 280,
    color: '#98FB98',
    intensity: 'light',
    available: true,
  },
  {
    id: 'ess-014',
    name: 'Thé Vert',
    family: 'fresh',
    description: 'Légèreté zen, fraîcheur douce et apaisante.',
    pricePerMl: 350,
    color: '#90EE90',
    intensity: 'light',
    available: true,
  },
  // SPICY
  {
    id: 'ess-015',
    name: 'Poivre Noir',
    family: 'spicy',
    description: 'Piquant et chaleureux, une note de caractère.',
    pricePerMl: 400,
    color: '#2F4F4F',
    intensity: 'strong',
    available: true,
  },
  {
    id: 'ess-016',
    name: 'Cardamome du Guatemala',
    family: 'spicy',
    description: 'Épice verte et aromatique, fraîcheur épicée unique.',
    pricePerMl: 420,
    color: '#8FBC8F',
    intensity: 'medium',
    available: true,
  },
  // FRUITY
  {
    id: 'ess-017',
    name: 'Pêche Velours',
    family: 'fruity',
    description: 'Fruit juteux et velouté, douceur solaire.',
    pricePerMl: 320,
    color: '#FFDAB9',
    intensity: 'light',
    available: true,
  },
  {
    id: 'ess-018',
    name: 'Cassis Sauvage',
    family: 'fruity',
    description: 'Baie noire intense et acidulée, énergie naturelle.',
    pricePerMl: 380,
    color: '#4B0082',
    intensity: 'medium',
    available: true,
  },
  // AQUATIC
  {
    id: 'ess-019',
    name: 'Brise Marine',
    family: 'aquatic',
    description: 'Sel de mer et air iodé, liberté océanique.',
    pricePerMl: 350,
    color: '#4682B4',
    intensity: 'light',
    available: true,
  },
  // GOURMAND
  {
    id: 'ess-020',
    name: 'Cacao Absolu',
    family: 'gourmand',
    description: 'Chocolat noir riche et intense, tentation pure.',
    pricePerMl: 450,
    color: '#3C1414',
    intensity: 'strong',
    available: true,
  },
  {
    id: 'ess-021',
    name: 'Caramel Beurre Salé',
    family: 'gourmand',
    description: 'Douceur caramélisée avec une pointe de sel marin.',
    pricePerMl: 380,
    color: '#C68E17',
    intensity: 'medium',
    available: true,
  },
  // MUSK
  {
    id: 'ess-022',
    name: 'Musc Blanc',
    family: 'musk',
    description: 'Pureté cotonneuse, peau propre et sensuelle.',
    pricePerMl: 400,
    color: '#FFFAF0',
    intensity: 'light',
    available: true,
  },
  {
    id: 'ess-023',
    name: 'Musc d\'Orient',
    family: 'musk',
    description: 'Chaleur animale et poudrée, séduction discrète.',
    pricePerMl: 500,
    color: '#E8D5B7',
    intensity: 'medium',
    available: true,
  },
  {
    id: 'ess-024',
    name: 'Patchouli Intense',
    family: 'woody',
    description: 'Profondeur terreuse et envoutante, signature forte.',
    pricePerMl: 420,
    color: '#4A3728',
    intensity: 'strong',
    available: true,
  },
];
