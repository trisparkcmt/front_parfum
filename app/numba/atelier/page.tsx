'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { generateId } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Minus, Plus, RefreshCcw, Loader2,
  Package, ChevronDown, Check,
} from 'lucide-react';
import type { CustomComposition, CompositionEssence, EssenceClient } from '@/types';
import { labService } from '@/services/labService';
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
   FLACON TYPES & API
   ═══════════════════════════════════════ */
type TypeFlacon = {
  id: number;
  nom: string;
  slug: string;
  description: string | null;
  image: string | null;
  actif: boolean;
  taux_reduction: string;
  type?: number; // some payloads expose the FK; we filter on it when present
};

type Flacon = {
  id: number;
  nom: string;
  slug: string;
  image_principale: string | null;
  prix_unitaire: string;
  contenance_ml: number;
  type?: number | { id: number; nom: string };
};

const API_BASE = 'https://accessoires-exclusifs-api.onrender.com/api/v1/shop';

async function fetchTypesFlacon(): Promise<TypeFlacon[]> {
  try {
    const r = await fetch(`${API_BASE}/types-flacon/`, { cache: 'no-store' });
    if (!r.ok) return [];
    const data = await r.json();
    const list: TypeFlacon[] = Array.isArray(data) ? data : (data.resultats ?? data.results ?? []);
    return list.filter(t => t.actif !== false);
  } catch { return []; }
}

async function fetchFlacons(): Promise<Flacon[]> {
  try {
    const r = await fetch(`${API_BASE}/flacons/?page_size=200`, { cache: 'no-store' });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.resultats ?? data.results ?? data) as Flacon[];
  } catch { return []; }
}

/* ═══════════════════════════════════════
   DETAILED GLASS SHADERS  (fallback SVG bottles)
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
  </defs>
);

function GenericBottle({ totalMl, maxMl, quantities, allItems }: any) {
  const pct = Math.min(1, totalMl / Math.max(1, maxMl));
  const topY = Math.round(420 - pct * 300);
  const col = blendColor(quantities, allItems);
  const isEmpty = totalMl === 0;
  return (
    <svg width="260" height="480" viewBox="0 0 260 480" fill="none" className="mx-auto">
      <GlassDefs col={col} id="gen" />
      <clipPath id="c-gen"><rect x="42" y="118" width="176" height="310" rx="6" /></clipPath>
      <rect x="42" y="118" width="176" height="310" rx="6" fill="url(#g-glass-v-gen)" stroke="rgba(180,170,155,0.50)" />
      {!isEmpty && (
        <g clipPath="url(#c-gen)">
          <rect x="42" y={topY} width="176" height={Math.max(2, 430 - topY)} fill="url(#g-liquid-gen)" className="liquid-body" />
          <ellipse cx="130" cy={topY} rx={Math.round(52 + pct * 32)} ry="8" fill="url(#g-surface-gen)" />
        </g>
      )}
      <rect x="42" y="118" width="176" height="310" rx="6" fill="url(#g-glass-gen)" opacity="0.60" />
      <rect x="88" y="6" width="84" height="36" rx="10" fill="url(#g-glass-v-gen)" stroke="rgba(180,170,155,0.55)" />
    </svg>
  );
}

/* ═══════════════════════════════════════
   FLACON PICKER (Desktop popover + Mobile sheet)
   ═══════════════════════════════════════ */
function FlaconPicker({
  open, onClose, types, flacons, selected, onSelect,
}: {
  open: boolean;
  onClose: () => void;
  types: TypeFlacon[];
  flacons: Flacon[];
  selected: Flacon | null;
  onSelect: (f: Flacon) => void;
}) {
  const [activeType, setActiveType] = useState<number | 'all'>('all');
  const filtered = useMemo(() => {
    if (activeType === 'all') return flacons;
    return flacons.filter(f => {
      const tid = typeof f.type === 'object' ? f.type?.id : f.type;
      return tid === activeType;
    });
  }, [activeType, flacons]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-3xl bg-background border-t sm:border border-[var(--t-border)] rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--t-border)]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold/70">Atelier · Choix du flacon</p>
            <h3 className="text-xl font-extralight text-cream mt-1">Sélectionnez votre <span className="italic text-gold">contenant</span></h3>
          </div>
          <button onClick={onClose} className="text-foreground/50 hover:text-gold text-xs uppercase tracking-widest">Fermer</button>
        </div>

        {/* Type tabs */}
        <div className="atelier-tab-row flex items-center gap-2 px-6 pt-3 overflow-x-auto">
          <button
            onClick={() => setActiveType('all')}
            className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              activeType === 'all' ? 'border-gold text-gold' : 'border-transparent text-foreground/60 hover:text-foreground'
            }`}
          >Tous</button>
          {types.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveType(t.id)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                activeType === t.id ? 'border-gold text-gold' : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >{t.nom}</button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {filtered.length === 0 ? (
            <p className="text-center text-foreground/40 text-sm py-12 italic">Aucun flacon disponible pour ce type.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filtered.map(f => {
                const isSel = selected?.id === f.id;
                const price = Math.round(parseFloat(f.prix_unitaire || '0'));
                return (
                  <button
                    key={f.id}
                    onClick={() => { onSelect(f); onClose(); }}
                    className={`relative group flex flex-col items-center text-center p-4 rounded-xl border transition-all overflow-hidden
                      ${isSel
                        ? 'border-gold bg-gold/5 shadow-[0_0_0_1px_var(--atl-gold)]'
                        : 'border-[var(--t-border)] bg-[var(--t-surface)] hover:border-gold/40 hover:bg-foreground/[0.03]'}`}
                  >
                    {isSel && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gold text-black flex items-center justify-center">
                        <Check size={12} />
                      </span>
                    )}
                    <div className="relative w-24 h-32 flex items-center justify-center mb-3">
                      {f.image_principale ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.image_principale}
                          alt={f.nom}
                          className="max-h-full max-w-full object-contain drop-shadow-[0_8px_18px_rgba(197,160,89,0.25)]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={56} className="text-gold/40" strokeWidth={1} />
                        </div>
                      )}
                    </div>
                    <h4 className={`text-sm font-medium tracking-wide line-clamp-1 ${isSel ? 'text-gold' : 'text-cream/90'}`}>{f.nom}</h4>
                    <p className="text-[10px] uppercase tracking-widest text-foreground/40 mt-1">{f.contenance_ml} ml</p>
                    <p className="text-[11px] text-gold/80 mt-2 font-light">{price.toLocaleString()} FCFA</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════ */
export default function AtelierPage() {
  const { addComposition } = useCartStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { i18n } = useTranslation();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'essences' | 'recap'>('ingredients');

  const [ingredientSubtab, setIngredientSubtab] = useState<'tete' | 'coeur' | 'fond'>('tete');
  const [essenceSubtab, setEssenceSubtab] = useState<'premium' | 'super-premium' | 'high'>('premium');

  // Datasets
  const [ingredients, setIngredients] = useState<EssenceClient[]>([]);
  const [essences, setEssences] = useState<EssenceClient[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Flacons
  const [types, setTypes] = useState<TypeFlacon[]>([]);
  const [flacons, setFlacons] = useState<Flacon[]>([]);
  const [selectedFlacon, setSelectedFlacon] = useState<Flacon | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [ctaSuccess, setCtaSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    (async () => {
      setLoadingData(true);
      const [ingreds, esss, ts, fs] = await Promise.all([
        labService.getIngredients(),
        labService.getEssences(),
        fetchTypesFlacon(),
        fetchFlacons(),
      ]);
      setIngredients(ingreds);
      setEssences(esss);
      setTypes(ts);
      setFlacons(fs);
      if (fs.length > 0) setSelectedFlacon(fs[0]);
      setLoadingData(false);
    })();
  }, []);

  const ALL_ITEMS = useMemo(() => [...ingredients, ...essences], [ingredients, essences]);

  const maxMl = selectedFlacon?.contenance_ml ?? 100;
  const flaconBasePrice = selectedFlacon ? Math.round(parseFloat(selectedFlacon.prix_unitaire || '0')) : 0;
  const totalMl = useMemo(() => Object.values(quantities).reduce((s, v) => s + v, 0), [quantities]);
  const remaining = maxMl - totalMl;

  const currentIngredientsFiltered = useMemo(() => ingredients.filter(item => {
    if (ingredientSubtab === 'tete') return TETE_FAMILIES.includes(item.family);
    if (ingredientSubtab === 'coeur') return COEUR_FAMILIES.includes(item.family);
    if (ingredientSubtab === 'fond') return FOND_FAMILIES.includes(item.family);
    return false;
  }), [ingredients, ingredientSubtab]);

  const currentEssencesFiltered = useMemo(() => essences.filter(item => {
    const familyStr = item.family as string;
    const cat = familyStr === 'premium' || familyStr === 'super-premium' || familyStr === 'high'
      ? item.family
      : (item.id.includes('sprem') ? 'super-premium' : item.id.includes('high') ? 'high' : 'premium');
    return cat === essenceSubtab;
  }), [essences, essenceSubtab]);

  const updateQtySlider = useCallback((id: string, value: number) => {
    setQuantities(prev => {
      const newQ = { ...prev };
      if (value <= 0) delete newQ[id]; else newQ[id] = value;
      return newQ;
    });
  }, []);

  const handleSelectFlacon = (f: Flacon) => {
    if (totalMl > f.contenance_ml) {
      setQuantities({});
      addToast(
        i18n.language === 'en'
          ? `Bottle changed to ${f.contenance_ml}ml — mixture reset.`
          : `Flacon changé à ${f.contenance_ml}ml — composition réinitialisée.`,
        'info'
      );
    }
    setSelectedFlacon(f);
  };

  const calcPrice = useMemo(() => {
    let total = flaconBasePrice;
    for (const e of ALL_ITEMS) {
      const q = quantities[e.id] || 0;
      if (q > 0) total += q * e.pricePerMl;
    }
    return Math.round(total);
  }, [quantities, ALL_ITEMS, flaconBasePrice]);

  const sommelierHint = useMemo(() => {
    if (!selectedFlacon) return { visible: true, text: i18n.language === 'en'
      ? 'Choose a <em>bottle</em> to begin your composition.'
      : 'Choisissez un <em>flacon</em> pour commencer votre composition.'
    };
    if (totalMl === 0) return { visible: true, text: i18n.language === 'en'
      ? `Explore our ingredients and essences. Fill your <em>${maxMl}ml</em> bottle.`
      : `Explorez les ingrédients et essences. Remplissez vos <em>${maxMl}ml</em>.`
    };
    if (remaining > 0) return { visible: true, text: i18n.language === 'en'
      ? `There are <em>${remaining}ml</em> left to compose.`
      : `Il reste <em>${remaining}ml</em> à composer.`
    };
    return { visible: true, text: i18n.language === 'en'
      ? 'Perfect harmony! Your bottle is <em>complete</em>.'
      : 'Harmonie parfaite ! Votre flacon est <em>complet</em>.'
    };
  }, [totalMl, remaining, maxMl, i18n.language, selectedFlacon]);

  const handleOrder = () => {
    if (!selectedFlacon) {
      addToast(i18n.language === 'en' ? 'Please choose a bottle first.' : 'Veuillez choisir un flacon.', 'info');
      setPickerOpen(true);
      return;
    }
    if (totalMl === 0) {
      addToast(i18n.language === 'en' ? 'Select at least one essence.' : 'Veuillez sélectionner au moins une essence.', 'info');
      return;
    }
    const selectedItems: CompositionEssence[] = ALL_ITEMS
      .filter(e => (quantities[e.id]||0) > 0)
      .map(e => ({ essence: e, quantityMl: quantities[e.id] }));

    const comp: CustomComposition = {
      id: generateId(),
      name: `Création Numba · ${selectedFlacon.nom} ${maxMl}ml`,
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
      <div className="fixed top-6 left-6 z-[60]">
        <Link href="/numba" className="flex items-center gap-2 px-4 py-2 bg-background/40 backdrop-blur-md border border-[var(--t-border)] rounded-full text-[10px] uppercase tracking-widest text-foreground/60 hover:text-gold hover:border-gold/30 transition-all group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* LEFT: VISUALIZER */}
      <div className="flacon-panel">
        <div className="flacon-panel-bg" />
        <div className="flacon-eyebrow">
          Atelier Numba · {selectedFlacon ? `${selectedFlacon.nom} · ${maxMl}ml` : 'Aucun flacon'}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2 z-20">
          {/* Flacon picker trigger */}
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/40 rounded-full text-[10px] uppercase tracking-widest text-gold transition-all"
          >
            <Package size={12} />
            {selectedFlacon
              ? (i18n.language === 'en' ? 'Change bottle' : 'Changer de flacon')
              : (i18n.language === 'en' ? 'Choose bottle' : 'Choisir un flacon')}
            <ChevronDown size={12} />
          </button>

          <button
            onClick={() => setQuantities({})}
            className="flex items-center gap-1.5 px-4 py-2 bg-foreground/5 hover:bg-red-500/10 border border-[var(--t-border)] rounded-full text-[10px] uppercase tracking-widest text-foreground/40 hover:text-red-400 transition-all"
          >
            <RefreshCcw size={12} />
            {i18n.language === 'en' ? 'Empty' : 'Vider'}
          </button>
        </div>

        {/* Bottle visualization */}
        <div className="relative w-full flex items-center justify-center mt-2 sm:mt-8">
          <div className="flacon-stage relative transition-all duration-700">
            <div className="bottle-glow" />
            {selectedFlacon?.image_principale ? (
              <div className="relative w-[260px] h-[480px] flex items-end justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedFlacon.image_principale}
                  alt={selectedFlacon.nom}
                  className="max-h-full max-w-full object-contain drop-shadow-[0_30px_40px_rgba(197,160,89,0.25)]"
                />
                {/* liquid overlay bar showing fill */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-6 w-1 h-[60%] bg-foreground/5 rounded-full overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gold/70 transition-all duration-700"
                    style={{ height: `${(totalMl/Math.max(1,maxMl))*100}%` }}
                  />
                </div>
              </div>
            ) : (
              <GenericBottle totalMl={totalMl} maxMl={maxMl} quantities={quantities} allItems={ALL_ITEMS} />
            )}

            <div className="hidden sm:flex absolute -right-12 top-1/2 -translate-y-1/2 flex-col items-center gap-1 opacity-40">
              <div className="w-[1px] h-20 bg-gold/50" />
              <span className="text-[10px] tracking-widest vertical-text uppercase">{totalMl}ml</span>
              <div className="w-[1px] h-20 bg-gold/50" />
            </div>
          </div>
        </div>

        {/* Selected flacon info card */}
        {selectedFlacon && (
          <div className="mt-4 px-4 py-3 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] w-full max-w-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gold/70">Flacon</p>
                <p className="text-sm text-cream font-light">{selectedFlacon.nom}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-foreground/40">Contenant</p>
                <p className="text-sm text-cream font-light">{flaconBasePrice.toLocaleString()} FCFA</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto pb-3 sm:pb-12 w-full max-w-xs">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] uppercase tracking-widest text-gold/60">Composition</span>
            <span className="text-[14px] font-light text-cream">{totalMl} / {maxMl} ml</span>
          </div>
          <div className="h-[2px] w-full bg-foreground/5 overflow-hidden">
            <div className="h-full bg-gold transition-all duration-700" style={{ width: `${(totalMl/Math.max(1,maxMl))*100}%` }} />
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

        <div className="atelier-tab-row flex items-center gap-3 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'ingredients', label: i18n.language === 'en' ? '🧪 Raw Notes' : '🧪 Notes de Base' },
            { id: 'essences', label: i18n.language === 'en' ? '✨ Premium Bases' : '✨ Essences d’Exception' },
            { id: 'recap', label: i18n.language === 'en' ? '📋 Recap' : '📋 Récap' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id ? 'border-gold text-gold font-semibold' : 'border-transparent text-foreground/60 hover:border-gold/50 hover:text-foreground'
              }`}
            >{tab.label}</button>
          ))}
        </div>

        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-foreground/40">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
            <span className="text-xs uppercase tracking-widest font-mono">Chargement du laboratoire...</span>
          </div>
        ) : (
          <>
            {!selectedFlacon && (
              <div className="mb-6 p-5 rounded-xl border border-gold/30 bg-gold/5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-1">Étape 1</p>
                  <p className="text-sm text-cream/90 font-light">Sélectionnez un flacon pour démarrer votre composition.</p>
                </div>
                <button
                  onClick={() => setPickerOpen(true)}
                  className="px-4 py-2 bg-gold text-black rounded-full text-[10px] uppercase tracking-widest hover:bg-cream transition-all whitespace-nowrap"
                >Choisir</button>
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                <div className="atelier-tab-row flex items-center gap-3 overflow-x-auto pb-2">
                  {[
                    { id: 'tete', label: i18n.language === 'en' ? 'Top Notes' : 'Notes de Tête' },
                    { id: 'coeur', label: i18n.language === 'en' ? 'Heart Notes' : 'Notes de Cœur' },
                    { id: 'fond', label: i18n.language === 'en' ? 'Base Notes' : 'Notes de Fond' }
                  ].map(sub => (
                    <button key={sub.id} onClick={() => setIngredientSubtab(sub.id as any)}
                      className={`whitespace-nowrap px-3 py-1 text-xs font-medium transition-colors border-b-2 ${
                        ingredientSubtab === sub.id ? 'border-gold text-gold font-semibold' : 'border-transparent text-foreground/60 hover:border-gold/50 hover:text-foreground'
                      }`}>{sub.label}</button>
                  ))}
                </div>

                <div className="sommelier visible !mb-0 !bg-transparent !border-white/5 !px-0">
                  <div className="sommelier-text text-sm font-light italic text-foreground/50" dangerouslySetInnerHTML={{ __html: sommelierHint.text }} />
                </div>

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
                            <h4 className={`text-sm font-medium tracking-wide ${sel ? 'text-gold' : 'text-cream/90 group-hover:text-gold'}`}>{item.name}</h4>
                            <p className="text-[10px] uppercase tracking-widest text-foreground/30 mt-1">{item.pricePerMl.toLocaleString()} FCFA / ml</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateQtySlider(item.id, Math.max(0, qty - 1))}
                            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-foreground/60 disabled:opacity-20"
                            disabled={qty <= 0 || !selectedFlacon}><Minus size={12} /></button>
                          <div className="flex flex-col gap-1 w-28 sm:w-32">
                            <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-foreground/40 font-mono">
                              <span className={sel ? "text-gold font-bold font-sans" : "font-sans"}>{qty} ml</span>
                              <span className="text-foreground/30 font-sans">max {qty + remaining} ml</span>
                            </div>
                            <input type="range" min="0" max={qty + remaining} step="1" value={qty}
                              disabled={!selectedFlacon}
                              onChange={(evt) => updateQtySlider(item.id, Number(evt.target.value))}
                              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-gold outline-none disabled:opacity-30" />
                          </div>
                          <button onClick={() => updateQtySlider(item.id, Math.min(qty + remaining, qty + 1))}
                            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-foreground/60 disabled:opacity-20"
                            disabled={remaining <= 0 || !selectedFlacon}><Plus size={12} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'essences' && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                <div className="atelier-tab-row flex items-center gap-3 overflow-x-auto pb-2">
                  {[
                    { id: 'premium', label: 'Premium' },
                    { id: 'super-premium', label: 'Super Premium' },
                    { id: 'high', label: 'High Luxury' }
                  ].map(sub => (
                    <button key={sub.id} onClick={() => setEssenceSubtab(sub.id as any)}
                      className={`whitespace-nowrap px-3 py-1 text-xs font-medium transition-colors border-b-2 ${
                        essenceSubtab === sub.id ? 'border-gold text-gold font-semibold' : 'border-transparent text-foreground/60 hover:border-gold/50 hover:text-foreground'
                      }`}>{sub.label}</button>
                  ))}
                </div>

                <div className="sommelier visible !mb-0 !bg-transparent !border-white/5 !px-0">
                  <div className="sommelier-text text-sm font-light italic text-foreground/50" dangerouslySetInnerHTML={{ __html: sommelierHint.text }} />
                </div>

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
                            <h4 className={`text-sm font-medium tracking-wide ${sel ? 'text-gold' : 'text-cream/90 group-hover:text-gold'}`}>{item.name}</h4>
                            <p className="text-[10px] text-foreground/40 line-clamp-1 mt-0.5">{item.description}</p>
                            <p className="text-[10px] uppercase tracking-widest text-gold/70 mt-1">{item.pricePerMl.toLocaleString()} FCFA / ml</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateQtySlider(item.id, Math.max(0, qty - 1))}
                            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-foreground/60 disabled:opacity-20"
                            disabled={qty <= 0 || !selectedFlacon}><Minus size={12} /></button>
                          <div className="flex flex-col gap-1 w-28 sm:w-32">
                            <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-foreground/40 font-mono">
                              <span className={sel ? "text-gold font-bold font-sans" : "font-sans"}>{qty} ml</span>
                              <span className="text-foreground/30 font-sans">max {qty + remaining} ml</span>
                            </div>
                            <input type="range" min="0" max={qty + remaining} step="1" value={qty}
                              disabled={!selectedFlacon}
                              onChange={(evt) => updateQtySlider(item.id, Number(evt.target.value))}
                              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-gold outline-none disabled:opacity-30" />
                          </div>
                          <button onClick={() => updateQtySlider(item.id, Math.min(qty + remaining, qty + 1))}
                            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-foreground/60 disabled:opacity-20"
                            disabled={remaining <= 0 || !selectedFlacon}><Plus size={12} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'recap' && (
              <div className="animate-in fade-in duration-300">
                <div className="bg-foreground/5 p-8 border border-[var(--t-border)] rounded-xl">
                  <h4 className="text-[10px] uppercase tracking-widest text-gold mb-6">Résumé de la Formule</h4>
                  {selectedFlacon && (
                    <div className="flex justify-between items-center text-sm mb-4 pb-4 border-b border-[var(--t-border)]">
                      <span className="text-foreground/40">Flacon · {selectedFlacon.nom} ({maxMl} ml)</span>
                      <span className="text-cream font-light">{flaconBasePrice.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  {Object.keys(quantities).length === 0 ? (
                    <p className="text-xs text-foreground/30 italic uppercase tracking-wider text-center">Aucun ingrédient sélectionné</p>
                  ) : (
                    <div className="space-y-3">
                      {ALL_ITEMS.filter(e => (quantities[e.id]||0) > 0).map(e => (
                        <div key={e.id} className="flex justify-between items-center text-sm">
                          <span className="text-foreground/60">{e.name}</span>
                          <span className="text-cream font-light">{quantities[e.id]} ml</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-auto pt-12 border-t border-[var(--t-border)] flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/30 mb-1">Investissement Total</p>
            <p className="text-4xl font-extralight text-gold">{calcPrice.toLocaleString()} <span className="text-xs tracking-normal">FCFA</span></p>
            <p className="text-[10px] text-foreground/20 mt-2 uppercase tracking-widest">
              {selectedFlacon ? `${selectedFlacon.nom} · ${maxMl}ml` : 'Aucun flacon'}
            </p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button onClick={handleOrder}
              disabled={totalMl === 0 || !selectedFlacon}
              className={`flex-1 sm:flex-none px-12 py-5 text-[10px] uppercase tracking-[0.2em] font-medium rounded-lg transition-all duration-300
                ${ctaSuccess ? 'bg-green-600 text-foreground' : 'bg-gold text-black hover:bg-cream disabled:opacity-20'}
              `}>
              {ctaSuccess ? 'Ajouté ✓' : 'Commander →'}
            </button>
          </div>
        </div>
      </div>

      {/* Flacon Picker Modal/Sheet */}
      <FlaconPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        types={types}
        flacons={flacons}
        selected={selectedFlacon}
        onSelect={handleSelectFlacon}
      />
    </div>
  );
}
