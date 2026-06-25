'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { generateId } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Minus, Plus, ChevronLeft, ChevronRight, RefreshCcw, Loader2, Save, ShoppingCart } from 'lucide-react';
import type { CustomComposition, CompositionEssence, EssenceClient } from '@/types';
import { labService } from '@/services/labService';
import { labService as apiLabService, shopService } from '@/services/apiService';
import './atelier.css';

/* ═══════════════════════════════════════
   ESSENCE CONSTANTS & HELPER FUNCTIONS
   ═══════════════════════════════════════ */
const TETE_FAMILIES = ['citrus', 'fresh', 'fruity'];
const COEUR_FAMILIES = ['floral', 'spicy', 'aquatic'];
const FOND_FAMILIES = ['woody', 'oriental', 'gourmand', 'musk'];

const EMOJIS: Record<string, string> = {
  citrus:'🍋', fresh:'🌿', fruity:'🍑', floral:'🌹', spicy:'🌶️',
  aquatic:'🌊', woody:'🪵', oriental:'✨', gourmand:'🍫', musk:'🤍',
  premium: '💎', 'super-premium': '👑', high: '🔱'
};

const BOTTLE_SIZES = [
  { ml: 30, label: '30ml', desc: 'Discovery' },
  { ml: 50, label: '50ml', desc: 'Signature' },
  { ml: 100, label: '100ml', desc: 'Prestige' },
];

const FORMAT_PRICES: Record<string, number> = { edc: 5000, edp: 8500, extrait: 12000 };
const FORMAT_LABELS: Record<string, string> = { edc: 'Eau de Cologne', edp: 'Eau de Parfum', extrait: 'Extrait' };

function hexToRgb(h: string) {
  h = h.replace('#','');
  if (h.length===3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return { r:parseInt(h.substring(0,2),16), g:parseInt(h.substring(2,4),16), b:parseInt(h.substring(4,6),16) };
}

function blendColor(quantities: Record<string, number>, allItems: EssenceClient[]) {
  let r=0,g=0,b=0,tw=0;
  for (const e of allItems) {
    const q = quantities[e.id]||0;
    if (q>0) { const c=hexToRgb(e.color); r+=c.r*q; g+=c.g*q; b+=c.b*q; tw+=q; }
  }
  if (tw===0) return { top:'#D4B87A', mid:'#C5A059', bot:'#A8864A' };
  r=Math.round(r/tw); g=Math.round(g/tw); b=Math.round(b/tw);
  return {
    top:`rgba(${Math.min(255,r+30)},${Math.min(255,g+30)},${Math.min(255,b+20)},0.90)`,
    mid:`rgba(${r},${g},${b},0.95)`,
    bot:`rgba(${Math.max(0,r-25)},${Math.max(0,g-25)},${Math.max(0,b-15)},0.98)`,
  };
}

/* ═══════════════════════════════════════
   DETAILED GLASS SHADERS
   ═══════════════════════════════════════ */
const GlassDefs = ({ col, id }: any) => (
  <defs>
    <linearGradient id={`g-glass-${id}`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="rgba(255,255,255,0.80)" />
      <stop offset="12%" stopColor="rgba(255,255,255,0.18)" />
      <stop offset="50%" stopColor="rgba(255,255,255,0.04)" />
      <stop offset="88%" stopColor="rgba(255,255,255,0.22)" />
      <stop offset="100%" stopColor="rgba(255,255,255,0.75)" />
    </linearGradient>
    <linearGradient id={`g-glass-v-${id}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(255,255,255,0.30)" />
      <stop offset="100%" stopColor="rgba(220,210,195,0.12)" />
    </linearGradient>
    <linearGradient id={`g-liquid-${id}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={col.top} stopOpacity="0.95" />
      <stop offset="100%" stopColor={col.bot} stopOpacity="0.98" />
    </linearGradient>
    <radialGradient id={`g-surface-${id}`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor={col.top} stopOpacity="0.8" />
      <stop offset="100%" stopColor={col.top} stopOpacity="1" />
    </radialGradient>
    <linearGradient id={`g-drip-${id}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={col.top} stopOpacity="0.5" />
      <stop offset="100%" stopColor={col.mid} stopOpacity="1" />
    </linearGradient>
    <linearGradient id={`g-chrome-${id}`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#D0CECE" /><stop offset="30%" stopColor="#F8F8F8" />
      <stop offset="60%" stopColor="#BDBDBD" /><stop offset="100%" stopColor="#E8E8E8" />
    </linearGradient>
    <linearGradient id={`g-chrome-v-${id}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#E0E0E0" /><stop offset="50%" stopColor="#A8A8A8" />
      <stop offset="100%" stopColor="#C8C8C8" />
    </linearGradient>
  </defs>
);

/* ═══════════════════════════════════════
   BOTTLE SVG COMPONENTS (WITH DYNAMIC COLORS)
   ═══════════════════════════════════════ */
function Bottle100({ totalMl, maxMl, quantities, allItems }: any) {
  const pct = Math.min(1, totalMl / maxMl);
  const topY = Math.round(420 - pct * 300);
  const col = blendColor(quantities, allItems);
  const isEmpty = totalMl === 0;

  return (
    <svg width="260" height="480" viewBox="0 0 260 480" fill="none" className="mx-auto">
      <GlassDefs col={col} id="100" />
      <clipPath id="c-100"><rect x="42" y="118" width="176" height="310" rx="6" ry="6" /></clipPath>
      <rect x="42" y="118" width="176" height="310" rx="6" fill="url(#g-glass-v-100)" stroke="rgba(180,170,155,0.50)" strokeWidth="1" />
      {!isEmpty && (
        <g clipPath="url(#c-100)">
          <rect x="42" y={topY} width="176" height={Math.max(2, 430 - topY)} fill="url(#g-liquid-100)" className="liquid-body" />
          <ellipse cx="130" cy={topY} rx={Math.round(52 + pct * 32)} ry="8" fill="url(#g-surface-100)" />
        </g>
      )}
      <rect x="42" y="118" width="176" height="310" rx="6" fill="url(#g-glass-100)" opacity="0.60" />
      <line x1="48" y1="124" x2="48" y2="422" stroke="rgba(255,255,255,0.88)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="212" y1="124" x2="212" y2="422" stroke="rgba(255,255,255,0.40)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="130" y1="120" x2="130" y2="428" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
      <text x="130" y="310" textAnchor="middle" fontFamily="serif" fontSize="11" fill="rgba(197,160,89,0.60)" letterSpacing="5">NUMBA</text>
      <text x="130" y="326" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fill="rgba(197,160,89,0.38)" letterSpacing="7">ATELIER</text>
      <rect x="100" y="58" width="60" height="64" rx="2" fill="url(#g-glass-v-100)" stroke="rgba(180,170,155,0.40)" strokeWidth="0.8" />
      <rect x="95" y="48" width="70" height="16" rx="3" fill="url(#g-chrome-100)" stroke="rgba(160,160,160,0.4)" strokeWidth="0.5" />
      <rect x="98" y="38" width="64" height="14" rx="3" fill="url(#g-chrome-100)" stroke="rgba(160,160,160,0.35)" strokeWidth="0.5" />
      <rect x="88" y="6" width="84" height="36" rx="10" fill="url(#g-glass-v-100)" stroke="rgba(180,170,155,0.55)" strokeWidth="1" />
      <rect x="88" y="6" width="84" height="36" rx="10" fill="url(#g-glass-100)" opacity="0.70" />
      <text x="130" y="29" textAnchor="middle" fontFamily="serif" fontSize="8" fontStyle="italic" fill="rgba(197,160,89,0.80)" letterSpacing="2">N</text>
      <g className="drip-group">
        <line x1="130" y1="0" x2="130" y2="46" stroke="url(#g-drip-100)" strokeWidth="3.5" strokeLinecap="round" />
        {!isEmpty && <ellipse cx="130" cy={50} rx={4.5} ry={6} fill={col.mid} opacity="0.90" />}
      </g>
    </svg>
  );
}

function Bottle50({ totalMl, maxMl, quantities, allItems }: any) {
  const pct = Math.min(1, totalMl / maxMl);
  const col = blendColor(quantities, allItems);
  const topY = Math.round(380 - pct * 240);
  const isEmpty = totalMl === 0;

  return (
    <svg width="260" height="480" viewBox="0 0 260 480" fill="none" className="mx-auto">
      <GlassDefs col={col} id="50" />
      <clipPath id="c-50">
        <path d="M130,120 C80,120 45,180 45,280 C45,380 85,415 130,415 C175,415 215,380 215,280 C215,180 180,120 130,120 Z" />
      </clipPath>
      <path d="M130,120 C80,120 45,180 45,280 C45,380 85,415 130,415 C175,415 215,380 215,280 C215,180 180,120 130,120 Z" fill="url(#g-glass-v-50)" stroke="rgba(180,170,155,0.50)" strokeWidth="1" />
      {!isEmpty && (
        <g clipPath="url(#c-50)">
          <rect x="40" y={topY} width="180" height="300" fill="url(#g-liquid-50)" className="liquid-body" />
          <ellipse cx="130" cy={topY} rx={Math.round(40 + pct * 30)} ry={7} fill="url(#g-surface-50)" />
        </g>
      )}
      <path d="M130,120 C80,120 45,180 45,280 C45,380 85,415 130,415 C175,415 215,380 215,280 C215,180 180,120 130,120 Z" fill="url(#g-glass-50)" opacity="0.60" />
      <path d="M70,160 C55,200 55,340 130,400" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
      <rect x="118" y="80" width="24" height="45" fill="url(#g-glass-v-50)" stroke="rgba(180,170,155,0.4)" />
      <circle cx="130" cy="45" r="35" fill="url(#g-glass-v-50)" stroke="rgba(197,160,89,0.5)" strokeWidth="1" />
      <circle cx="130" cy="45" r="35" fill="url(#g-glass-50)" opacity="0.7" />
      <text x="130" y="52" textAnchor="middle" fontFamily="serif" fontSize="14" fill="rgba(197,160,89,0.8)" >N</text>
      <g className="drip-group">
        <line x1="130" y1="0" x2="130" y2="40" stroke="url(#g-drip-50)" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function Bottle30({ totalMl, maxMl, quantities, allItems }: any) {
  const pct = Math.min(1, totalMl / maxMl);
  const col = blendColor(quantities, allItems);
  const topY = Math.round(400 - pct * 300);
  const isEmpty = totalMl === 0;

  return (
    <svg width="260" height="480" viewBox="0 0 260 480" fill="none" className="mx-auto">
      <GlassDefs col={col} id="30" />
      <clipPath id="c-30"><rect x="90" y="100" width="80" height="320" rx="40" /></clipPath>
      <rect x="90" y="100" width="80" height="320" rx="40" fill="url(#g-glass-v-30)" stroke="rgba(180,170,155,0.50)" strokeWidth="1" />
      {!isEmpty && (
        <g clipPath="url(#c-30)">
          <rect x="90" y={topY} width="80" height="330" fill="url(#g-liquid-30)" className="liquid-body" />
          <ellipse cx="130" cy={topY} rx={32} ry="6" fill="url(#g-surface-30)" />
        </g>
      )}
      <rect x="90" y="100" width="80" height="320" rx="40" fill="url(#g-glass-30)" opacity="0.60" />
      <rect x="98" y="140" width="4" height="200" rx="2" fill="rgba(255,255,255,0.6)" opacity="0.3" />
      <rect x="110" y="70" width="40" height="35" rx="2" fill="url(#g-chrome-30)" />
      <rect x="95" y="15" width="70" height="55" rx="5" fill="#111" stroke="#C5A059" strokeWidth="1.5" />
      <text x="130" y="48" textAnchor="middle" fontFamily="serif" fontSize="12" fill="#C5A059">N</text>
      <g className="drip-group">
        <line x1="130" y1="0" x2="130" y2="25" stroke="url(#g-drip-30)" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════ */
export default function AtelierPage() {
  const { addCustomPerfume, addComposition, addDirectComposition } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();
  const { i18n } = useTranslation();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'essences' | 'recap'>('ingredients');
  
  // Sub-tabs
  const [ingredientSubtab, setIngredientSubtab] = useState<'tete' | 'coeur' | 'fond'>('tete');
  const [essenceSubtab, setEssenceSubtab] = useState<'premium' | 'super-premium' | 'high'>('premium');

  // Datasets
  const [ingredients, setIngredients] = useState<EssenceClient[]>([]);
  const [essences, setEssences] = useState<EssenceClient[]>([]);
  const [flacons, setFlacons] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [format, setFormat] = useState('edp');
  const [bottleSize, setBottleSize] = useState(100);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [compositionName, setCompositionName] = useState('');
  const [savedParfumId, setSavedParfumId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [ctaSuccess, setCtaSuccess] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalName, setSaveModalName] = useState('');

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      setLoadingData(true);
      const [ingreds, esss, bottlesRes] = await Promise.all([
        labService.getIngredients(),
        labService.getEssences(),
        shopService.getBottles({ en_stock: true }),
      ]);
      const bottles = bottlesRes.results || bottlesRes.resultats || (Array.isArray(bottlesRes) ? bottlesRes : []);
      setIngredients(ingreds);
      setEssences(esss);
      setFlacons(bottles);
      setLoadingData(false);
    }
    loadData();
  }, []);

  const ALL_ITEMS = useMemo(() => [...ingredients, ...essences], [ingredients, essences]);

  const maxMl = bottleSize;
  const totalMl = useMemo(() => Object.values(quantities).reduce((s, v) => s + v, 0), [quantities]);
  const remaining = maxMl - totalMl;

  const currentIngredientsFiltered = useMemo(() => {
    return ingredients.filter(item => {
      if (ingredientSubtab === 'tete') return TETE_FAMILIES.includes(item.family);
      if (ingredientSubtab === 'coeur') return COEUR_FAMILIES.includes(item.family);
      if (ingredientSubtab === 'fond') return FOND_FAMILIES.includes(item.family);
      return false;
    });
  }, [ingredients, ingredientSubtab]);

  const currentEssencesFiltered = useMemo(() => {
    return essences.filter(item => {
      const familyStr = item.family as string;
      const cat = familyStr === 'premium' || familyStr === 'super-premium' || familyStr === 'high' 
        ? item.family 
        : (item.id.includes('sprem') ? 'super-premium' : item.id.includes('high') ? 'high' : 'premium');
      return cat === essenceSubtab;
    });
  }, [essences, essenceSubtab]);

  const updateQtySlider = useCallback((id: string, value: number) => {
    setSavedParfumId(null);
    setCartAdded(false);
    setQuantities(prev => {
      const newQ = { ...prev };
      if (value <= 0) {
        delete newQ[id];
      } else {
        newQ[id] = value;
      }
      return newQ;
    });
  }, []);

  const handleBottleSizeChange = (size: number) => {
    if (totalMl > size) {
      setQuantities({});
      addToast(
        i18n.language === 'en'
          ? `Bottle changed to ${size}ml — mixture reset.`
          : `Flacon changé à ${size}ml — composition réinitialisée.`, 
        'info'
      );
    }
    setBottleSize(size);
  };

  const calcPrice = useMemo(() => {
    const sizeMultiplier = bottleSize === 30 ? 0.4 : bottleSize === 50 ? 0.65 : 1;
    let total = Math.round((FORMAT_PRICES[format] || 0) * sizeMultiplier);
    for (const e of ALL_ITEMS) {
      const q = quantities[e.id] || 0;
      if (q > 0) total += q * e.pricePerMl;
    }
    return Math.round(total);
  }, [quantities, format, bottleSize, ALL_ITEMS]);

  const formulaSummary = useMemo(() => {
    const list = [];
    
    // Ingredients
    const teteMl = ingredients.filter(e => TETE_FAMILIES.includes(e.family)).reduce((acc, e) => acc + (quantities[e.id] || 0), 0);
    if (teteMl > 0) list.push({ name: i18n.language === 'en' ? 'Top Notes' : 'Notes de Tête', ml: teteMl });
    
    const coeurMl = ingredients.filter(e => COEUR_FAMILIES.includes(e.family)).reduce((acc, e) => acc + (quantities[e.id] || 0), 0);
    if (coeurMl > 0) list.push({ name: i18n.language === 'en' ? 'Heart Notes' : 'Notes de Cœur', ml: coeurMl });
    
    const fondMl = ingredients.filter(e => FOND_FAMILIES.includes(e.family)).reduce((acc, e) => acc + (quantities[e.id] || 0), 0);
    if (fondMl > 0) list.push({ name: i18n.language === 'en' ? 'Base Notes' : 'Notes de Fond', ml: fondMl });
    
    // Essences
    const premiumMl = essences.filter(e => {
      const familyStr = e.family as string;
      const cat = familyStr === 'premium' || familyStr === 'super-premium' || familyStr === 'high' ? e.family : (e.id.includes('sprem') ? 'super-premium' : e.id.includes('high') ? 'high' : 'premium');
      return cat === 'premium';
    }).reduce((acc, e) => acc + (quantities[e.id] || 0), 0);
    if (premiumMl > 0) list.push({ name: i18n.language === 'en' ? 'Premium Essences' : 'Essences Premium', ml: premiumMl });
    
    const superPremiumMl = essences.filter(e => {
      const familyStr = e.family as string;
      const cat = familyStr === 'premium' || familyStr === 'super-premium' || familyStr === 'high' ? e.family : (e.id.includes('sprem') ? 'super-premium' : e.id.includes('high') ? 'high' : 'premium');
      return cat === 'super-premium';
    }).reduce((acc, e) => acc + (quantities[e.id] || 0), 0);
    if (superPremiumMl > 0) list.push({ name: i18n.language === 'en' ? 'Super Premium Essences' : 'Essences Super Premium', ml: superPremiumMl });
    
    const highMl = essences.filter(e => {
      const familyStr = e.family as string;
      const cat = familyStr === 'premium' || familyStr === 'super-premium' || familyStr === 'high' ? e.family : (e.id.includes('sprem') ? 'super-premium' : e.id.includes('high') ? 'high' : 'premium');
      return cat === 'high';
    }).reduce((acc, e) => acc + (quantities[e.id] || 0), 0);
    if (highMl > 0) list.push({ name: i18n.language === 'en' ? 'High Essences' : 'Essences Haute Qualité', ml: highMl });
    
    return list;
  }, [quantities, ingredients, essences, i18n.language]);

  const sommelierHint = useMemo(() => {
    if (totalMl === 0) return { visible: true, text: i18n.language === 'en' 
      ? `Explore our ingredients and premium essences. Add them by <em>1ml</em> to fill your <em>${maxMl}ml</em> bottle.`
      : `Explorez nos ingrédients et essences d'exception. Ajoutez-les par <em>1ml</em> jusqu'à remplir vos <em>${maxMl}ml</em>.` 
    };
    if (remaining > 0) return { visible: true, text: i18n.language === 'en'
      ? `There are <em>${remaining}ml</em> left to compose.`
      : `Il reste <em>${remaining}ml</em> à composer.`
    };
    return { visible: true, text: i18n.language === 'en'
      ? 'Perfect harmony! Your bottle is <em>complete</em>.'
      : 'Harmonie parfaite ! Votre flacon est <em>complet</em>.'
    };
  }, [totalMl, remaining, maxMl, i18n.language]);

  const handleSaveComposition = async (name: string) => {
    if (totalMl === 0) {
      addToast(
        i18n.language === 'en' ? 'Please select at least one essence/ingredient.' : 'Veuillez sélectionner au moins une essence.',
        'info'
      );
      return;
    }
    if (!name.trim()) {
      addToast(
        i18n.language === 'en' ? 'Please enter a name for your composition.' : 'Veuillez donner un nom à votre composition.',
        'error'
      );
      return;
    }

    setIsSaving(true);
    try {
      // Build lignes array with essence IDs
      const lignes = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([essenceId, quantityMl]) => {
          const item = ALL_ITEMS.find(e => e.id === essenceId);
          return {
            essence_catalogue: item?.backendId || undefined,
            ingredient: item?.backendId || undefined,
            quantite_ml: quantityMl,
          };
        });

      const response = await apiLabService.createCustomPerfume({
        nom: name,
        flacon: bottleSize,
        lignes,
      });

      setSavedParfumId(Number(response.id));
      setShowSaveModal(false);
      setSaveModalName('');
      addToast(
        i18n.language === 'en' ? `Composition saved! (ID: ${response.id})` : `Composition sauvegardée ! (ID: ${response.id})`,
        'success'
      );
    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail || (i18n.language === 'en' ? 'Error saving composition.' : 'Erreur lors de la sauvegarde.');
      addToast(errorMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToCart = async () => {
    if (totalMl === 0) {
      addToast(
        i18n.language === 'en' ? 'Please select at least one essence/ingredient.' : 'Veuillez sélectionner au moins une essence.',
        'info'
      );
      return;
    }

    setIsAddingToCart(true);
    try {
      if (savedParfumId) {
        // Add saved composition to cart using the ID
        await addCustomPerfume(savedParfumId, 1, undefined, { silent: false });
      } else {
        // Direct composition (guest/POS mode) — add without saving
        const lignes = Object.entries(quantities)
          .filter(([_, qty]) => qty > 0)
          .map(([essenceId, quantityMl]) => {
            const item = ALL_ITEMS.find(e => e.id === essenceId);
            return {
              lot_essence_id: item?.lotEssenceId || item?.backendId || 0,
              quantite_ml: quantityMl,
            };
          });

        // Find a flacon that matches bottleSize
        const selectedFlacon = flacons.find(f => f.contenance_ml === bottleSize || f.capacity === bottleSize);
        if (!selectedFlacon) {
          addToast(
            i18n.language === 'en' ? 'Please select a valid bottle size.' : 'Veuillez sélectionner une taille de flacon valide.',
            'error'
          );
          return;
        }

        await addDirectComposition({
          flacon_id: selectedFlacon.id,
          lignes,
          nom: saveModalName || `Création Numba ${bottleSize}ml`,
          quantite: 1,
        }, { silent: false });
      }

      setCtaSuccess(true);
      addToast(i18n.language === 'en' ? 'Added to cart!' : 'Ajouté au panier !', 'success');
      setTimeout(() => setCtaSuccess(false), 3000);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail || (i18n.language === 'en' ? 'Error adding to cart.' : 'Erreur lors de l\'ajout au panier.');
      addToast(errorMsg, 'error');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleOrder = async () => {
    if (totalMl === 0) { 
      addToast(
        i18n.language === 'en' ? 'Please select at least one essence/ingredient.' : 'Veuillez sélectionner au moins une essence.', 
        'info'
      ); 
      return; 
    }
    const selectedItems: CompositionEssence[] = ALL_ITEMS
      .filter(e => (quantities[e.id]||0) > 0)
      .map(e => ({ essence: e, quantityMl: quantities[e.id] }));
      
    const comp: CustomComposition = {
      id: generateId(), 
      name: `Création Numba ${maxMl}ml`, 
      essences: selectedItems, 
      totalMl, 
      totalPrice: calcPrice,
      createdBy: user?.id || 'guest', 
      createdAt: new Date().toISOString(), 
      isAiGenerated: false,
    };
    
    addComposition(comp);
    setCtaSuccess(true);
    addToast(i18n.language === 'en' ? 'Added to cart!' : 'Ajouté au panier !', 'success');
    setTimeout(() => setCtaSuccess(false), 3000);
  };

  if (!mounted) return <div className="min-h-screen bg-background" />;

  return (
    <div className="atelier-layout !pt-0">
      {/* Floating Back Button */}
      <div className="fixed top-6 left-6 z-[60]">
        <Link 
          href="/numba" 
          className="flex items-center gap-2 px-4 py-2 bg-background/40 backdrop-blur-md border border-[var(--t-border)] rounded-full text-[10px] uppercase tracking-widest text-foreground/60 hover:text-gold hover:border-gold/30 transition-all group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* LEFT: VISUALIZER */}
      <div className="flacon-panel">
        <div className="flacon-panel-bg" />
        <div className="flacon-eyebrow">Atelier Numba · {maxMl}ml</div>
        
        <button 
          onClick={() => setQuantities({})}
          className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-foreground/5 hover:bg-red-500/10 border border-[var(--t-border)] rounded-full text-[10px] uppercase tracking-widest text-foreground/40 hover:text-red-400 transition-all z-20"
        >
          <RefreshCcw size={12} />
          {i18n.language === 'en' ? 'Empty bottle' : 'Vider le flacon'}
        </button>

        <div className="relative w-full flex items-center justify-center mt-8">
          <div className="size-slider-wrap">
            <button 
              className="size-slider-nav"
              onClick={() => {
                const idx = BOTTLE_SIZES.findIndex(s => s.ml === bottleSize);
                const nextIdx = (idx - 1 + BOTTLE_SIZES.length) % BOTTLE_SIZES.length;
                handleBottleSizeChange(BOTTLE_SIZES[nextIdx].ml);
              }}
            >
              <ChevronLeft size={20} />
            </button>

            <button 
              className="size-slider-nav"
              onClick={() => {
                const idx = BOTTLE_SIZES.findIndex(s => s.ml === bottleSize);
                const nextIdx = (idx + 1) % BOTTLE_SIZES.length;
                handleBottleSizeChange(BOTTLE_SIZES[nextIdx].ml);
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flacon-stage relative transition-all duration-700">
            <div className="bottle-glow" />
            {bottleSize === 100 && <Bottle100 totalMl={totalMl} maxMl={maxMl} quantities={quantities} allItems={ALL_ITEMS} />}
            {bottleSize === 50 && <Bottle50 totalMl={totalMl} maxMl={maxMl} quantities={quantities} allItems={ALL_ITEMS} />}
            {bottleSize === 30 && <Bottle30 totalMl={totalMl} maxMl={maxMl} quantities={quantities} allItems={ALL_ITEMS} />}
            
            <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-40">
              <div className="w-[1px] h-20 bg-gold/50" />
              <span className="text-[10px] tracking-widest vertical-text uppercase">{totalMl}ml</span>
              <div className="w-[1px] h-20 bg-gold/50" />
            </div>
          </div>
        </div>

        <div className="mt-auto pb-12 w-full max-w-xs">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] uppercase tracking-widest text-gold/60">Composition</span>
            <span className="text-[14px] font-light text-cream">{totalMl} / {maxMl} ml</span>
          </div>
          <div className="h-[2px] w-full bg-foreground/5 overflow-hidden">
            <div className="h-full bg-gold transition-all duration-700" style={{ width: `${(totalMl/maxMl)*100}%` }} />
          </div>
        </div>
      </div>

      {/* RIGHT: APOTHECARY INTERFACE */}
      <div className="config-panel !bg-background"> 
        <div className="mb-6">
          <h1 className="flex text-5xl font-extralight tracking-tight text-foreground mb-2">
            Artisanat<br /><span className="text-gold italic serif">Olfactif</span>
          </h1>
        </div>

        {/* Unified Glassmorphism Tabs */}
        <div className="atelier-tab-row flex items-center gap-3 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'ingredients', label: i18n.language === 'en' ? '🧪 Raw Notes' : '🧪 Notes de Base' },
            { id: 'essences', label: i18n.language === 'en' ? '✨ Premium Bases' : '✨ Essences d’Exception' },
            { id: 'recap', label: i18n.language === 'en' ? '📋 Formula' : '📋 Finalisation' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id 
                  ? 'border-gold text-gold font-semibold' 
                  : 'border-transparent text-foreground/60 hover:border-gold/50 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* LOADING INDICATOR */}
        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-foreground/40">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
            <span className="text-xs uppercase tracking-widest font-mono">Chargement du laboratoire...</span>
          </div>
        ) : (
          <>
            {/* SUB-TABS NAVIGATION OR PANEL VIEW */}
            {activeTab === 'ingredients' && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                {/* Steps within ingredients */}
                <div className="atelier-tab-row flex items-center gap-3 overflow-x-auto pb-2">
                  {[
                    { id: 'tete', label: i18n.language === 'en' ? 'Top Notes' : 'Notes de Tête' },
                    { id: 'coeur', label: i18n.language === 'en' ? 'Heart Notes' : 'Notes de Cœur' },
                    { id: 'fond', label: i18n.language === 'en' ? 'Base Notes' : 'Notes de Fond' }
                  ].map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setIngredientSubtab(sub.id as any)}
                      className={`whitespace-nowrap px-3 py-1 text-xs font-medium transition-colors border-b-2 ${
                        ingredientSubtab === sub.id 
                          ? 'border-gold text-gold font-semibold' 
                          : 'border-transparent text-foreground/60 hover:border-gold/50 hover:text-foreground'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                <div className="sommelier visible !mb-0 !bg-transparent !border-white/5 !px-0">
                  <div className="sommelier-text text-sm font-light italic text-foreground/50" dangerouslySetInnerHTML={{ __html: sommelierHint.text }} />
                </div>

                {/* List of Ingredients */}
                <div className="grid grid-cols-1 gap-px bg-[var(--t-border)] border border-[var(--t-border)] rounded-sm overflow-hidden">
                  {currentIngredientsFiltered.map(item => {
                    const qty = quantities[item.id] || 0;
                    const sel = qty > 0;
                    return (
                      <div key={item.id} className="group flex items-center justify-between p-6 bg-[var(--t-surface)] transition-all hover:bg-foreground/[0.02]">
                        <div className="flex items-center gap-6">
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full blur-xl opacity-20" style={{ backgroundColor: item.color }} />
                            <span className="text-2xl relative z-10">{EMOJIS[item.family] || '💧'}</span>
                          </div>
                          <div>
                            <h4 className={`text-sm font-medium tracking-wide transition-colors ${sel ? 'text-gold' : 'text-cream/90 group-hover:text-gold'}`}>
                              {item.name}
                            </h4>
                            <p className="text-[10px] uppercase tracking-widest text-foreground/30 mt-1">
                              {item.pricePerMl.toLocaleString()} FCFA / ml
                            </p>
                          </div>
                        </div>

                        {/* Slider controls */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQtySlider(item.id, Math.max(0, qty - 1))}
                            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-foreground/60 transition-colors disabled:opacity-20"
                            disabled={qty <= 0}
                          >
                            <Minus size={12} />
                          </button>

                          <div className="flex flex-col gap-1 w-28 sm:w-32">
                            <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-foreground/40 font-mono">
                              <span className={sel ? "text-gold font-bold font-sans" : "font-sans"}>{qty} ml</span>
                              <span className="text-foreground/30 font-sans">max {qty + remaining} ml</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max={qty + remaining}
                              step="1"
                              value={qty}
                              onChange={(evt) => updateQtySlider(item.id, Number(evt.target.value))}
                              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-gold outline-none"
                            />
                          </div>

                          <button
                            onClick={() => updateQtySlider(item.id, Math.min(qty + remaining, qty + 1))}
                            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-foreground/60 transition-colors disabled:opacity-20"
                            disabled={remaining <= 0}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'essences' && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                {/* Steps within premium essences */}
                <div className="atelier-tab-row flex items-center gap-3 overflow-x-auto pb-2">
                  {[
                    { id: 'premium', label: 'Premium' },
                    { id: 'super-premium', label: 'Super Premium' },
                    { id: 'high', label: 'High Luxury' }
                  ].map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setEssenceSubtab(sub.id as any)}
                      className={`whitespace-nowrap px-3 py-1 text-xs font-medium transition-colors border-b-2 ${
                        essenceSubtab === sub.id 
                          ? 'border-gold text-gold font-semibold' 
                          : 'border-transparent text-foreground/60 hover:border-gold/50 hover:text-foreground'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                <div className="sommelier visible !mb-0 !bg-transparent !border-white/5 !px-0">
                  <div className="sommelier-text text-sm font-light italic text-foreground/50" dangerouslySetInnerHTML={{ __html: sommelierHint.text }} />
                </div>

                {/* List of Premium Essences */}
                <div className="grid grid-cols-1 gap-px bg-[var(--t-border)] border border-[var(--t-border)] rounded-sm overflow-hidden">
                  {currentEssencesFiltered.map(item => {
                    const qty = quantities[item.id] || 0;
                    const sel = qty > 0;
                    return (
                      <div key={item.id} className="group flex items-center justify-between p-6 bg-[var(--t-surface)] transition-all hover:bg-foreground/[0.02]">
                        <div className="flex items-center gap-6">
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full blur-xl opacity-20" style={{ backgroundColor: item.color }} />
                            <span className="text-2xl relative z-10">{EMOJIS[essenceSubtab] || '✨'}</span>
                          </div>
                          <div className="max-w-[150px] sm:max-w-[200px]">
                            <h4 className={`text-sm font-medium tracking-wide transition-colors ${sel ? 'text-gold' : 'text-cream/90 group-hover:text-gold'}`}>
                              {item.name}
                            </h4>
                            <p className="text-[10px] text-foreground/40 line-clamp-1 mt-0.5">{item.description}</p>
                            <p className="text-[10px] uppercase tracking-widest text-gold/70 mt-1">
                              {item.pricePerMl.toLocaleString()} FCFA / ml
                            </p>
                          </div>
                        </div>

                        {/* Slider controls */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQtySlider(item.id, Math.max(0, qty - 1))}
                            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-foreground/60 transition-colors disabled:opacity-20"
                            disabled={qty <= 0}
                          >
                            <Minus size={12} />
                          </button>

                          <div className="flex flex-col gap-1 w-28 sm:w-32">
                            <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-foreground/40 font-mono">
                              <span className={sel ? "text-gold font-bold font-sans" : "font-sans"}>{qty} ml</span>
                              <span className="text-foreground/30 font-sans">max {qty + remaining} ml</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max={qty + remaining}
                              step="1"
                              value={qty}
                              onChange={(evt) => updateQtySlider(item.id, Number(evt.target.value))}
                              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-gold outline-none"
                            />
                          </div>

                          <button
                            onClick={() => updateQtySlider(item.id, Math.min(qty + remaining, qty + 1))}
                            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-foreground/60 transition-colors disabled:opacity-20"
                            disabled={remaining <= 0}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'recap' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xs uppercase tracking-[0.2em] text-foreground/30 mb-6">Concentration & Format</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
                  {(['edc','edp','extrait'] as const).map(f => (
                    <button 
                      key={f} 
                      onClick={() => setFormat(f)}
                      className={`p-6 border text-left transition-all rounded-lg ${format === f ? 'border-gold bg-gold/5' : 'border-[var(--t-border)] hover:border-foreground/20'}`}
                    >
                      <p className={`text-[10px] uppercase tracking-widest mb-2 ${format === f ? 'text-gold' : 'text-foreground/40'}`}>{FORMAT_LABELS[f]}</p>
                      <p className="text-lg font-light text-cream">{FORMAT_PRICES[f].toLocaleString()} <span className="text-[10px] text-foreground/20 uppercase tracking-tighter">FCFA</span></p>
                    </button>
                  ))}
                </div>

                <div className="bg-foreground/5 p-8 border border-[var(--t-border)] rounded-xl">
                  <h4 className="text-[10px] uppercase tracking-widest text-gold mb-6">Résumé de la Formule</h4>
                  {formulaSummary.length === 0 ? (
                    <p className="text-xs text-foreground/30 italic uppercase tracking-wider text-center">Aucun ingrédient sélectionné</p>
                  ) : (
                    <div className="space-y-4">
                      {formulaSummary.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-foreground/40">{item.name}</span>
                          <span className="text-cream font-light">{item.ml} ml</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer Summary */}
        <div className="mt-auto pt-12 border-t border-[var(--t-border)] flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/30 mb-1">Investissement Total</p>
            <p className="text-4xl font-extralight text-gold">{calcPrice.toLocaleString()} <span className="text-xs tracking-normal">FCFA</span></p>
            <p className="text-[10px] text-foreground/20 mt-2 uppercase tracking-widest">{bottleSize}ml · {FORMAT_LABELS[format]}</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {/* Save button (authenticated only) */}
            {isAuthenticated && (
              <button 
                onClick={() => setShowSaveModal(true)}
                disabled={totalMl === 0 || isSaving}
                className="flex-1 sm:flex-none px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-medium rounded-lg transition-all duration-300 border border-gold/40 text-gold hover:bg-gold/10 disabled:opacity-20"
              >
                {isSaving ? <Loader2 size={14} className="inline animate-spin mr-1" /> : <Save size={14} className="inline mr-1" />}
                {i18n.language === 'en' ? 'Save' : 'Sauvegarder'}
              </button>
            )}

            {/* Add to cart button */}
            <button 
              onClick={handleAddToCart}
              disabled={totalMl === 0 || isAddingToCart}
              className={`flex-1 sm:flex-none px-12 py-5 text-[10px] uppercase tracking-[0.2em] font-medium rounded-lg transition-all duration-300
                ${ctaSuccess ? 'bg-green-600 text-foreground' : 'bg-gold text-black hover:bg-cream disabled:opacity-20'}
              `}
            >
              {ctaSuccess ? '✓ Ajouté' : (isAddingToCart ? <Loader2 size={14} className="inline animate-spin" /> : <>
                <ShoppingCart size={14} className="inline mr-1" />
                {i18n.language === 'en' ? 'Add to Cart' : 'Ajouter au Panier'}
              </>)}
            </button>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-white/10 animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-extralight text-foreground mb-2">
              {i18n.language === 'en' ? 'Save Your Composition' : 'Sauvegarder votre Composition'}
            </h2>
            <p className="text-xs text-foreground/40 uppercase tracking-widest mb-6">
              {i18n.language === 'en' ? 'Give your creation a name' : 'Donnez un nom à votre création'}
            </p>

            <input
              type="text"
              placeholder={i18n.language === 'en' ? 'e.g. Rose & Oud Evening' : 'ex. Rose & Oud Soirée'}
              value={saveModalName}
              onChange={(e) => setSaveModalName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder-foreground/30 focus:outline-none focus:border-gold/50 mb-6 text-sm"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveModalName('');
                }}
                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-foreground/60 transition-colors"
              >
                {i18n.language === 'en' ? 'Cancel' : 'Annuler'}
              </button>
              <button
                onClick={() => handleSaveComposition(saveModalName)}
                disabled={isSaving || !saveModalName.trim()}
                className="flex-1 px-6 py-3 bg-gold text-black hover:bg-cream rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={14} className="inline animate-spin" /> : (i18n.language === 'en' ? 'Save & Add to Cart' : 'Sauvegarder & Ajouter')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}