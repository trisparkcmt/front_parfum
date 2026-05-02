import type { NavLink, OlfactiveFamily } from '@/types';

// ============================================================
// Theme Colors
// ============================================================

export const COLORS = {
  gold: '#C5A059',
  goldLight: '#D4B87A',
  goldDark: '#A8864A',
  black: '#050505',
  charcoal: '#1A1A1A',
  cream: '#FAF7F2',
  creamDark: '#F0EBE3',
  white: '#FFFFFF',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  status: {
    pending: '#F59E0B',
    validated: '#3B82F6',
    delivering: '#8B5CF6',
    delivered: '#10B981',
    cancelled: '#EF4444',
  },
} as const;

// ============================================================
// Olfactive Families
// ============================================================

export const OLFACTIVE_FAMILIES: Record<
  OlfactiveFamily,
  { label: string; color: string; emoji: string; description: string }
> = {
  citrus: {
    label: 'Agrumes',
    color: '#FFD700',
    emoji: '🍋',
    description: 'Notes fraîches et pétillantes de citron, bergamote, orange',
  },
  floral: {
    label: 'Floral',
    color: '#FF69B4',
    emoji: '🌸',
    description: 'Rose, jasmin, ylang-ylang, pivoine',
  },
  woody: {
    label: 'Boisé',
    color: '#8B4513',
    emoji: '🌲',
    description: 'Cèdre, santal, vétiver, patchouli',
  },
  oriental: {
    label: 'Oriental',
    color: '#C5A059',
    emoji: '✨',
    description: 'Ambre, vanille, encens, musc',
  },
  fresh: {
    label: 'Frais',
    color: '#00CED1',
    emoji: '💨',
    description: 'Menthe, eucalyptus, notes vertes',
  },
  spicy: {
    label: 'Épicé',
    color: '#FF4500',
    emoji: '🌶️',
    description: 'Cannelle, poivre, cardamome, gingembre',
  },
  fruity: {
    label: 'Fruité',
    color: '#FF6347',
    emoji: '🍑',
    description: 'Pêche, framboise, cassis, pomme',
  },
  aquatic: {
    label: 'Aquatique',
    color: '#4169E1',
    emoji: '🌊',
    description: 'Notes marines, ozones, eau fraîche',
  },
  gourmand: {
    label: 'Gourmand',
    color: '#D2691E',
    emoji: '🍫',
    description: 'Chocolat, caramel, praline, café',
  },
  musk: {
    label: 'Musqué',
    color: '#DEB887',
    emoji: '🤍',
    description: 'Musc blanc, notes poudrées, peau propre',
  },
};

// ============================================================
// Navigation Links
// ============================================================

export const PUBLIC_NAV_LINKS: NavLink[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Accessoires', href: '/shop/accessories' },
  { label: 'Parfumerie', href: '/shop/perfumes' },
  { label: 'Atelier Numba', href: '/numba' },
];

export const DASHBOARD_NAV_LINKS: Record<string, NavLink[]> = {
  admin: [
    { label: 'Vue d\'ensemble', href: '/admin', icon: 'LayoutDashboard' },
    { label: 'Commandes', href: '/admin/orders', icon: 'ShoppingBag' },
    { label: 'Inventaire', href: '/admin/inventory', icon: 'Package' },
    { label: 'Prestataires', href: '/admin/partners', icon: 'Users' },
    { label: 'Livreurs', href: '/admin/delivery', icon: 'Truck' },
  ],
  delivery: [
    { label: 'Mes Livraisons', href: '/delivery', icon: 'Truck' },
  ],
  partner: [
    { label: 'Mon Dashboard', href: '/partner', icon: 'BarChart3' },
  ],
  client: [
    { label: 'Mon Profil', href: '/client/profile', icon: 'User' },
    { label: 'Mes Favoris', href: '/client/favorites', icon: 'Heart' },
    { label: 'Mes Compositions', href: '/client/compositions', icon: 'FlaskConical' },
  ],
};

// ============================================================
// WhatsApp Config
// ============================================================

export const WHATSAPP_NUMBER = '+237680254243';
export const WHATSAPP_BASE_URL = 'https://wa.me';

// ============================================================
// Business Config
// ============================================================

export const DEFAULT_COMMISSION_PERCENT = 10;
export const MAX_COMPOSITION_ML = 100;
export const ESSENCE_INCREMENT_ML = 10;
export const CURRENCY = 'FCFA';
export const CURRENCY_LOCALE = 'fr-CM';

// ============================================================
// Product Categories Labels
// ============================================================

export const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  'accessory': 'Accessoire',
  'perfume-brand': 'Parfum de Marque',
  'perfume-dupe': 'Dupe',
  'numba-creation': 'Création Numba',
};

export const ACCESSORY_SUBCATEGORY_LABELS: Record<string, string> = {
  watches: 'Montres',
  jewelry: 'Bijoux',
  bags: 'Sacs',
  sunglasses: 'Lunettes de soleil',
  belts: 'Ceintures',
  other: 'Autres',
};

// ============================================================
// Order Status Labels
// ============================================================

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  validated: 'Validée',
  delivering: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};
