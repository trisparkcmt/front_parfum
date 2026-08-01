'use client';

/**
 * @file components/perfume/GeminiChat.tsx
 * @description Redesigned AI Fragrance Sommelier — full chat experience.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppImage from '@/components/ui/AppImage';
import {
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  Plus,
  Package,
  Beaker,
  RefreshCw,
  Droplets,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { InputBar } from './InputBar';
import { API_ROOT } from '@/services/api';
import { api, labService as apiLabService } from '@/services/apiService';
import { labService } from '@/services/labService';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { formatPrice, generateId } from '@/lib/utils';
import type { CustomComposition, CompositionEssence, EssenceClient, Accessory, Product } from '@/types';
import { productService } from '@/services/productService';
import axios from 'axios';

// ── Types ──────────────────────────────────────────────────────────────────

interface AiProduct {
  id: number;
  nom: string;
  slug: string;
  prix_unitaire: string;
  image_principale: string;
}

interface AiEssence {
  id: number;
  nom: string;
  code_reference: string;
  prix_par_ml: string;
  quantite_ml: number;
  prix_total_quantite: string;
}

export interface AiResponse {
  message: string;
  quantite_demandee_ml?: number;
  flacon?: { id: number; nom: string; prix_unitaire: string; contenance_ml?: number; [key: string]: unknown };
  parfums_existants?: AiProduct[];
  essences_pre_faites?: AiEssence[];
  ingredients_sur_mesure?: { essenceName: string; quantityMl: number }[];
  accessoires?: Accessory[];
}

type MessageRole = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  aiData?: AiResponse;
  composition?: CustomComposition;
  metadata?: Record<string, unknown>;
  suggestions?: Product[];
  isError503?: boolean;
  retryPayload?: SendPayload;
  animateText?: boolean;
}

/** Payload sent from InputBar to handleSend */
interface SendPayload {
  content: string;
  /** ml as a number, or null if user didn't specify */
  bottleSize: string | null;
  /** budget in FCFA as a number, or empty string if not set */
  budget: string | number;
}

// ── Loading search texts ────────────────────────────────────────────────────

const LOADING_TEXTS = [
  'Nous analysons vos préférences olfactives...',
  'Recherche des parfums correspondant à votre profil...',
  'Exploration de notre catalogue d\'essences rares...',
  'Sélection des accessoires complémentaires...',
  'Élaboration de votre formule personnalisée...',
  'Affinement de la recommandation par notre IA...',
  'Calcul des prix et des compositions optimales...',
  'Derniers ajustements olfactifs en cours...',
];

// ── Blending color helper ───────────────────────────────────────────────────

function blendHexColors(colors: { hex: string; weight: number }[]): string {
  if (colors.length === 0) return '#C5A059';
  let r = 0, g = 0, b = 0, totalWeight = 0;
  colors.forEach(c => {
    let hex = c.hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(char => char + char).join('');
    const weight = c.weight || 1;
    r += parseInt(hex.substring(0, 2), 16) * weight;
    g += parseInt(hex.substring(2, 4), 16) * weight;
    b += parseInt(hex.substring(4, 6), 16) * weight;
    totalWeight += weight;
  });
  if (totalWeight === 0) return '#C5A059';
  const toHex = (n: number) => Math.round(n / totalWeight).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function LoadingBubble() {
  const [textIdx, setTextIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTextIdx(i => (i + 1) % LOADING_TEXTS.length);
        setVisible(true);
      }, 350);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-end gap-3 justify-start">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Sparkles size={15} className="text-gold" />
      </div>
      <div className="max-w-xs md:max-w-md bg-white/5 border border-white/10 rounded-3xl rounded-bl-md px-5 py-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-gold"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
          <AnimatePresence mode="wait">
            {visible && (
              <motion.p
                key={textIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="text-xs text-foreground/60 italic"
              >
                {LOADING_TEXTS[textIdx]}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function getMetadataValue(metadata: Record<string, unknown> | undefined, keys: string[]) {
  if (!metadata) return null;
  for (const key of keys) {
    const value = metadata[key];
    if (value !== null && value !== undefined && value !== '') return value;
  }
  return null;
}

function normalizeNumericValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (trimmed.toLowerCase() === 'non spécifié' || trimmed.toLowerCase() === 'non-specifie') return null;

    const normalized = trimmed
      .replace(/[^\d.,-]/g, '')
      .replace(/\.(?=\d{3}(?:\D|$))/g, '')
      .replace(',', '.');

    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const numeric = normalizeNumericValue(item);
      if (numeric !== null) return numeric;
    }
    return null;
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const candidateKeys = ['value', 'amount', 'total', 'prix', 'price', 'quantity', 'quantity_ml', 'quantite_ml', 'budget', 'budget_fcfa', 'montant', 'montant_budget'];
    for (const key of candidateKeys) {
      const numeric = normalizeNumericValue(obj[key]);
      if (numeric !== null) return numeric;
    }
  }

  return null;
}

function normalizeQuantity(metadata: Record<string, unknown> | undefined) {
  const raw = getMetadataValue(metadata, ['quantity', 'quantity_ml', 'quantityMl', 'quantite_ml', 'quantite', 'volume_ml', 'volume', 'bottleSize', 'bottle_size', 'format', 'taille_flacon']);
  const numericValue = normalizeNumericValue(raw);
  if (numericValue === null || numericValue <= 0) return null;
  return `${Math.round(numericValue)} ml`;
}

function normalizeBudget(metadata: Record<string, unknown> | undefined) {
  const raw = getMetadataValue(metadata, ['budget', 'budget_fcfa', 'budget_fcfa_total', 'montant_budget', 'budget_total', 'montant']);
  const numericBudget = normalizeNumericValue(raw);
  if (numericBudget === null || numericBudget <= 0) return null;
  return `${numericBudget.toLocaleString('fr-FR')} FCFA`;
}

function extractPromptMetadata(text: string, metadata?: Record<string, unknown>) {
  const normalizedMetadata = metadata ?? {};
  let cleanedText = text.trim();
  let quantity = normalizeQuantity(normalizedMetadata);
  let budget = normalizeBudget(normalizedMetadata);

  const quantityMatch = cleanedText.match(/(?:^|[\s—-])Format:\s*([0-9]+(?:[.,][0-9]+)?)\s*ml/i);
  if (!quantity && quantityMatch) {
    const numeric = Number(quantityMatch[1].replace(',', '.'));
    if (Number.isFinite(numeric) && numeric > 0) {
      quantity = `${Math.round(numeric)} ml`;
    }
  }

  // Budget regex now accepts spaces/dots as thousand separators: "1 000 000" or "1.000.000"
  const budgetMatch = cleanedText.match(/(?:^|[\s—-])Budget:\s*([0-9]+(?:[\s.][0-9]{3})*)\s*(?:FCFA|f cfa)?/i);
  if (!budget && budgetMatch) {
    // Remove spaces and dots used as thousand separators, keep only the number
    const numeric = Number(budgetMatch[1].replace(/[\s.]/g, ''));
    if (Number.isFinite(numeric) && numeric > 0) {
      budget = `${numeric.toLocaleString('fr-FR')} FCFA`;
    }
  }

  cleanedText = cleanedText
    .replace(/\s*(?:—|-|:)?\s*Format:\s*[0-9]+(?:[.,][0-9]+)?\s*ml\s*/gi, ' ')
    .replace(/\s*(?:—|-|:)?\s*Budget:\s*[0-9]+(?:[\s.][0-9]{3})*\s*(?:FCFA|f cfa)?\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { cleanedText, quantity, budget };
}

function collectSuggestionIds(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectSuggestionIds(item));
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const directId = obj.id ?? obj.product_id ?? obj.parfum_id ?? obj.accessoire_id ?? obj.produit_id ?? obj.productId ?? obj.parfumId ?? obj.accessoryId ?? obj.item_id;
    if (directId) return [String(directId)];
    const nestedKeys = ['products', 'parfums', 'parfums_existants', 'suggestions', 'recommandations', 'recommended_products', 'accessoires', 'diffuseurs', 'items', 'data', 'results', 'suggested_products', 'produits_suggeres'];
    const nested = nestedKeys.flatMap((key) => collectSuggestionIds(obj[key]));
    return nested.filter(Boolean);
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const trimmed = String(value).trim();
    if (!trimmed) return [];
    const match = trimmed.match(/-?\d+/);
    return match ? [match[0]] : [trimmed];
  }
  return [];
}

function resolveSuggestionIds(metadata: Record<string, unknown> | undefined) {
  if (!metadata) return [] as string[];

  const values = [
    getMetadataValue(metadata, ['parfums_existants_recommandes', 'parfums_existants', 'suggested_products', 'suggestions', 'recommandations', 'recommended_products', 'products', 'produits_suggeres']),
    getMetadataValue(metadata, ['accessoires', 'accessory_ids', 'accessory_ids_recommandes']),
    getMetadataValue(metadata, ['diffuseurs', 'diffuser_ids']),
  ];

  const ids = values.flatMap((value) => collectSuggestionIds(value));
  return Array.from(new Set(ids.filter(Boolean)));
}

function UserBubble({ text, metadata }: { text: string; metadata?: Record<string, unknown> }) {
  const { cleanedText, quantity, budget } = extractPromptMetadata(text, metadata);

  const chips = [
    quantity ? `Quantité ${quantity}` : null,
    budget ? `Budget ${budget}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="flex justify-end">
      <div className="flex flex-col items-end gap-2 max-w-xs md:max-w-md">
        <div className="bg-gold text-black font-medium rounded-3xl rounded-br-md px-5 py-3.5 shadow-lg shadow-gold/20 text-sm leading-relaxed">
          {cleanedText || text}
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {chips.map((chip) => (
              <div key={chip} className="rounded-full border border-gold/20 bg-gold/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gold">
                {chip}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({
  image, name, price, onAdd,
}: {
  image?: string; name: string; price: string | number; onAdd: () => void;
}) {
  const [added, setAdded] = useState(false);
  const handleAdd = () => { onAdd(); setAdded(true); setTimeout(() => setAdded(false), 2000); };

  return (
    <div className="flex-shrink-0 w-44 bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-gold/30 transition-all group">
      <div className="relative w-full h-36 bg-black/20 overflow-hidden">
        {image ? (
          <AppImage
            src={image.startsWith('http') ? image : `${API_ROOT}${image}`}
            alt={name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            fill
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-foreground/20">
            <Package size={32} />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-bold text-foreground/80 line-clamp-2 leading-tight mb-1">{name}</p>
        <p className="text-xs text-gold font-semibold">{typeof price === 'number' ? formatPrice(price) : formatPrice(Number(price))}</p>
      </div>
      <button
        onClick={handleAdd}
        className={`w-full py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border-t border-white/5 ${
          added ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 hover:bg-gold hover:text-black text-foreground/60'
        }`}
      >
        {added ? <span>Ajouté ✓</span> : <><Plus size={11} /><span>Ajouter</span></>}
      </button>
    </div>
  );
}

function MiniBottleVisual({ composition }: { composition: CustomComposition }) {
  const totalMl = composition.totalMl || 100;
  const percentage = Math.min(100, Math.round((totalMl / 100) * 100));
  const colors = composition.essences.map(e => ({ hex: e.essence.color || '#C5A059', weight: e.quantityMl || 10 }));
  const blendedColor = blendHexColors(colors);

  return (
    <div className="relative flex flex-col items-center justify-center p-4 bg-charcoal/40 rounded-2xl border border-white/5 w-44 flex-shrink-0">
      <div className="absolute inset-0 rounded-2xl opacity-10 blur-xl transition-colors duration-1000" style={{ backgroundColor: blendedColor }} />
      <div className="relative z-10 w-24 h-36 border-2 border-white/20 rounded-b-2xl rounded-t-lg bg-deep-black overflow-hidden flex flex-col justify-end">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-6 border-2 border-white/20 rounded-t-sm bg-deep-black" />
        <motion.div
          className="w-full relative"
          initial={{ height: 5 }}
          animate={{ height: `${percentage}%` }}
          transition={{ type: 'spring', bounce: 0.1, duration: 1 }}
          style={{ backgroundColor: blendedColor }}
        >
          <div className="absolute top-0 inset-x-0 h-2 bg-white/20 mix-blend-overlay" />
          {percentage > 0 && (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <Droplets size={24} className="text-foreground mix-blend-overlay" />
            </div>
          )}
        </motion.div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-foreground mix-blend-difference pointer-events-none">
          <span className="font-display text-lg font-bold">{totalMl}ml</span>
        </div>
      </div>
      <p className="text-[10px] text-foreground/50 mt-3 uppercase tracking-wider truncate max-w-full font-bold">
        {composition.name}
      </p>
    </div>
  );
}

function TypingBubble({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(prev => prev + text.charAt(index));
      index++;
      if (index >= text.length) { clearInterval(interval); onComplete?.(); }
    }, 15);
    return () => clearInterval(interval);
  }, [text, onComplete]);

  return (
    <div className="inline-block max-w-xs md:max-w-lg bg-white/5 border border-white/10 rounded-3xl rounded-tl-md px-5 py-4 shadow-sm backdrop-blur-md">
      <p className="text-sm text-foreground/85 leading-relaxed italic">&ldquo;{displayedText}&rdquo;</p>
    </div>
  );
}

function AiBubble({
  messageObj, onAddAllToCart, onRetry,
}: {
  messageObj: ChatMessage;
  onAddAllToCart: (aiData: AiResponse, composition?: CustomComposition) => void;
  onRetry: (payload: SendPayload) => void;
}) {
  const [isTypingComplete, setIsTypingComplete] = useState(Boolean(messageObj.animateText) ? false : true);
  const { addProduct, addComposition } = useCartStore();
  const { addToast } = useToastStore();
  const { text, aiData, composition, suggestions, isError503, retryPayload, animateText } = messageObj;

  useEffect(() => {
    if (!animateText) {
      setIsTypingComplete(true);
    }
  }, [animateText]);

  const hasProducts = (aiData?.parfums_existants?.length ?? 0) > 0;
  const hasEssences = (aiData?.essences_pre_faites?.length ?? 0) > 0;
  const hasAccessories = (aiData?.accessoires?.length ?? 0) > 0;
  const hasComposition = composition && composition.essences.length > 0;
  const hasAnyItems = hasProducts || hasEssences || hasComposition || hasAccessories;
  const shouldShowContent = !isError503 && (isTypingComplete || !animateText);

  const handleAddProduct = (p: AiProduct) => {
    const product: Product = {
      id: String(p.id), name: p.nom, description: '', price: Number(p.prix_unitaire),
      category: 'perfume-brand', images: p.image_principale ? [p.image_principale] : [],
      inStock: true, createdAt: new Date().toISOString(), slug: p.slug,
    };
    addProduct(product);
  };

  const handleAddAccessory = (a: Accessory) => {
    const rawAcc = a as unknown as Record<string, unknown>;
    const product: Product = {
      ...a, id: String(a.id), name: a.name || String(rawAcc.nom || ''),
      price: Number(a.price || rawAcc.prix_unitaire || 0), category: 'accessory',
      images: a.images || (rawAcc.image_principale ? [String(rawAcc.image_principale)] : []),
    };
    addProduct(product);
  };

  return (
    <div className="flex items-start gap-3 justify-start">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
        <Sparkles size={15} className="text-gold" />
      </div>
      <div className="flex-1 min-w-0 space-y-4">
        {isError503 ? (
          <div className="bg-red-500/10 border border-red-500/35 rounded-3xl p-5 max-w-md space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={18} />
              <p className="text-sm font-bold">Erreur du serveur (503)</p>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Désolé, nous recevons actuellement un trop grand nombre de requêtes. Veuillez réessayer dans un instant.
            </p>
            {retryPayload && (
              <button
                onClick={() => onRetry(retryPayload)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 text-xs font-bold transition-all"
              >
                <RefreshCw size={12} />
                Réessayer la demande
              </button>
            )}
          </div>
        ) : animateText ? (
          <TypingBubble key={`${messageObj.id}-${text}`} text={text} onComplete={() => setIsTypingComplete(true)} />
        ) : (
          <div className="max-w-xs md:max-w-lg bg-white/5 border border-white/10 rounded-3xl rounded-tl-md px-5 py-4 shadow-sm backdrop-blur-md">
            <p className="text-sm text-foreground/85 leading-relaxed">{text}</p>
          </div>
        )}

        {!isError503 && shouldShowContent && hasComposition && (
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg">
            <MiniBottleVisual composition={composition!} />
            <div className="flex-1 bg-white/5 border border-gold/15 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Beaker size={14} className="text-gold" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold">
                    Formule IA ({composition!.totalMl}ml)
                  </p>
                </div>
                <div className="space-y-2">
                  {composition!.essences.map(item => (
                    <div key={item.essence.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.essence.color || '#C5A059' }} />
                        <span className="text-foreground/70">{item.essence.name}</span>
                      </div>
                      <span className="font-bold font-mono text-foreground/50">{item.quantityMl}ml</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
                <span className="text-[10px] text-foreground/40 uppercase font-semibold">Prix composition</span>
                <span className="text-sm font-bold text-gold">{formatPrice(composition!.totalPrice)}</span>
              </div>
            </div>
          </div>
        )}

        {!isError503 && shouldShowContent && hasProducts && (
          <div>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold mb-2 ml-1">Parfums suggérés</p>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {aiData!.parfums_existants!.map(p => (
                <ProductCard key={p.id} image={p.image_principale} name={p.nom} price={p.prix_unitaire} onAdd={() => handleAddProduct(p)} />
              ))}
            </div>
          </div>
        )}

        {!isError503 && suggestions && suggestions.length > 0 && (
          <div>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold mb-2 ml-1">Produits proposés précédemment</p>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {suggestions.map((product) => (
                <ProductCard
                  key={product.id}
                  image={product.images?.[0]}
                  name={product.name}
                  price={product.price}
                  onAdd={() => {
                    addProduct(product);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {!isError503 && shouldShowContent && hasEssences && (
          <div>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold mb-2 ml-1">Essences recommandées</p>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {aiData!.essences_pre_faites!.map(e => (
                <div key={e.id} className="flex-shrink-0 w-44 bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-gold/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/10 flex items-center justify-center mb-3">
                    <Beaker size={18} className="text-gold/70" />
                  </div>
                  <p className="text-xs font-bold text-foreground/80 line-clamp-2 leading-tight mb-1">{e.nom}</p>
                  <p className="text-[10px] text-foreground/40 font-mono mb-2">{e.quantite_ml}ml</p>
                  <p className="text-xs text-gold font-semibold">{formatPrice(Number(e.prix_total_quantite))}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isError503 && shouldShowContent && hasAccessories && (
          <div>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold mb-2 ml-1">Accessoires proposés</p>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {aiData!.accessoires!.map(a => {
                const accessoryLike = a as unknown as { image_principale?: string; nom?: string; prix_unitaire?: number | string };
                const image = a.images?.[0] || accessoryLike.image_principale;
                const name = a.name || String(accessoryLike.nom || '');
                const price = a.price || Number(accessoryLike.prix_unitaire || 0);
                return <ProductCard key={a.id} image={image} name={name} price={price} onAdd={() => handleAddAccessory(a)} />;
              })}
            </div>
          </div>
        )}

        {!isError503 && shouldShowContent && hasAnyItems && (
          <div className="flex flex-wrap gap-2">
            {hasComposition && (
              <button
                onClick={() => { addComposition(composition!); }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider hover:bg-gold/80 transition-all active:scale-95 shadow-lg shadow-gold/20"
              >
                <ShoppingCart size={13} />
                Ajouter la composition
              </button>
            )}
            {(hasProducts || hasAccessories) && (
              <button
                onClick={() => onAddAllToCart(aiData!, composition)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-gold/30 hover:text-gold text-foreground/60 font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
              >
                <ShoppingBag size={13} />
                Tout ajouter au panier
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Prompt builder ──────────────────────────────────────────────────────────

/**
 * Builds the prompt string sent to the AI.
 * - bottleSize is in ml (number) or null (unspecified)
 * - budget is in FCFA (number or string) or empty
 */
function buildPrompt({ content, bottleSize, budget }: SendPayload): string {
  const parts: string[] = [content.trim()];
  const normalizedBottleSize = (() => {
    if (bottleSize === null || bottleSize === undefined || bottleSize === '') return null;
    const raw = String(bottleSize).trim();
    if (!raw) return null;
    const normalized = raw.replace(/\s*ml\s*$/i, '').trim();
    return Number.isFinite(Number(normalized)) ? `${normalized}ml` : raw;
  })();

  if (normalizedBottleSize) parts.push(`Format: ${normalizedBottleSize}`);

  const parsedBudget = (() => {
    if (budget === '' || budget === null || budget === undefined) return null;
    const raw = String(budget).trim();
    if (!raw) return null;
    const numericBudget = Number(raw.replace(/[^\d.-]/g, ''));
    return Number.isFinite(numericBudget) ? numericBudget : null;
  })();

  if (parsedBudget !== null) {
    parts.push(`Budget: ${parsedBudget.toLocaleString('fr-FR')} FCFA`);
  }

  return parts.join(' — ');
}

// ── Main Component ──────────────────────────────────────────────────────────

export interface GeminiChatProps {
  onChatStarted?: (started: boolean) => void;
}

export function GeminiChat({ onChatStarted }: GeminiChatProps) {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [essences, setEssences] = useState<EssenceClient[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const { addProduct, addComposition } = useCartStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const resolveSuggestionsFromMetadata = useCallback(async (metadata?: Record<string, unknown>) => {
    if (!metadata) return [] as Product[];

    const ids = resolveSuggestionIds(metadata);

    if (ids.length === 0) return [] as Product[];

    const resolved = await Promise.all(
      ids.map(async (id) => {
        try {
          const product = await productService.getProductById(id);
          return product ? product : null;
        } catch {
          return null;
        }
      })
    );

    return resolved.filter((product): product is Product => Boolean(product));
  }, []);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    labService.getEssences().then(setEssences).catch(err => console.error('Failed to load essences:', err));
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      setIsHistoryLoading(true);
      try {
        const conv = await apiLabService.getIAConversations();
        if (conv && conv.messages && conv.messages.length > 0) {
          const historyMsgs: ChatMessage[] = await Promise.all(
            conv.messages.map(async (m) => {
              const displayText = typeof m.content === 'string' ? m.content : '';
              const baseMessage: ChatMessage = {
                id: String(m.id),
                role: m.role === 'assistant' ? 'ai' : 'user',
                text: displayText,
                metadata: m.metadata,
                animateText: false,
              };

              if (m.role === 'assistant') {
                const suggestions = await resolveSuggestionsFromMetadata(m.metadata);
                return {
                  ...baseMessage,
                  suggestions: suggestions.length > 0 ? suggestions : undefined,
                };
              }

              return baseMessage;
            })
          );
          setMessages(historyMsgs);
          onChatStarted?.(true);
        } else {
          setMessages([]);
          onChatStarted?.(false);
        }
      } catch (err) {
        console.warn('Failed to load AI conversation history:', err);
        setMessages([]);
        onChatStarted?.(false);
      } finally {
        setIsHistoryLoading(false);
      }
    }
    fetchHistory();
  }, [onChatStarted, resolveSuggestionsFromMetadata]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  const handleResetConversation = useCallback(async () => {
    try {
      const res = await apiLabService.resetIAChatSummary();
      addToast(res.detail || 'Résumé vidé avec succès.', 'success');
    } catch (err: unknown) {
      console.warn('Failed to reset AI chat summary:', err);
    } finally {
      setMessages([]);
      onChatStarted?.(false);
    }
  }, [addToast, onChatStarted]);

  const handleAbort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      addToast('Demande IA annulée.', 'info');
    }
  }, [addToast]);

  const handleSend = useCallback(async (data: SendPayload) => {
    if (!data.content.trim() || isLoading) return;

    abortControllerRef.current = new AbortController();

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text: data.content.trim(),
      metadata: { bottleSize: data.bottleSize, budget: data.budget },
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    onChatStarted?.(true);

    try {
      const fullPrompt = buildPrompt(data);

      const apiResponse = await api.post(
        'lab/ia-recommandation/',
        { prompt: fullPrompt },
        { signal: abortControllerRef.current.signal }
      );

      const response: AiResponse = apiResponse.data;

      let totalPrice = 0;
      let totalMl = 0;
      const compositionEssences: CompositionEssence[] = [];

      if (response.essences_pre_faites && response.essences_pre_faites.length > 0) {
        response.essences_pre_faites.forEach(item => {
          const essence = essences.find(
            e => e.id === String(item.id) || e.name === item.nom || String((e as unknown as { nom?: string }).nom || '') === item.nom
          );
          if (essence) {
            compositionEssences.push({ essence, quantityMl: item.quantite_ml });
            totalPrice += Number(item.prix_total_quantite);
            totalMl += item.quantite_ml;
          }
        });
      } else if (response.ingredients_sur_mesure && response.ingredients_sur_mesure.length > 0) {
        response.ingredients_sur_mesure.forEach(item => {
          const essence = essences.find(e => e.name === item.essenceName);
          if (essence) {
            compositionEssences.push({ essence, quantityMl: item.quantityMl });
            totalPrice += essence.pricePerMl * item.quantityMl;
            totalMl += item.quantityMl;
          }
        });
      }

      if (response.flacon) totalPrice += Number(response.flacon.prix_unitaire);

      const composition: CustomComposition | undefined = compositionEssences.length > 0
        ? {
            id: generateId(),
            name: response.flacon ? `Création IA (${response.flacon.nom})` : 'Création IA',
            essences: compositionEssences,
            totalMl,
            totalPrice,
            createdBy: user?.id || 'guest',
            createdAt: new Date().toISOString(),
            isAiGenerated: true,
          }
        : undefined;

      if (response.flacon && response.flacon.contenance_ml) {
        (composition as CustomComposition & { bottleSizeMl?: number }).bottleSizeMl = response.flacon.contenance_ml;
      }

      setMessages(prev => [...prev, { id: generateId(), role: 'ai', text: response.message, aiData: response, composition, animateText: true }]);
    } catch (error: unknown) {
      const axiosError = error as { name?: string; response?: { status?: number } };
      if (axiosError.name === 'CanceledError' || axiosError.name === 'AbortError' || axios.isCancel(error)) return;

      if (axiosError.response?.status === 503) {
        setMessages(prev => [...prev, { id: generateId(), role: 'ai', text: '', isError503: true, retryPayload: data }]);
      } else {
        addToast('Une erreur est survenue avec le Sommelier IA', 'error');
        setMessages(prev => [...prev, {
          id: generateId(), role: 'ai',
          text: 'Désolé, je rencontre une difficulté technique. Veuillez réessayer dans quelques instants.',
        }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [isLoading, essences, user, addToast, onChatStarted]);

  const handleAddAll = useCallback((aiData: AiResponse, composition?: CustomComposition) => {
    let count = 0;
    if (composition) { addComposition(composition); count++; }

    aiData.parfums_existants?.forEach(p => {
      addProduct({
        id: String(p.id), name: p.nom, description: '', price: Number(p.prix_unitaire),
        category: 'perfume-brand', images: p.image_principale ? [p.image_principale] : [],
        inStock: true, createdAt: new Date().toISOString(), slug: p.slug,
      });
      count++;
    });

    aiData.accessoires?.forEach(a => {
      const accessoryLike = a as unknown as { image_principale?: string; nom?: string; prix_unitaire?: number | string };
      addProduct({
        ...a, id: String(a.id), name: a.name || String(accessoryLike.nom || ''),
        price: Number(a.price || Number(accessoryLike.prix_unitaire || 0)), category: 'accessory',
        images: a.images || (accessoryLike.image_principale ? [String(accessoryLike.image_principale)] : []),
      });
      count++;
    });


  }, [addProduct, addComposition, addToast]);

  if (!mounted) return null;

  const isEmpty = messages.length === 0;
  const showEmptyState = !isHistoryLoading && isEmpty;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-full">
      <div
        ref={chatAreaRef}
        className="flex-1 overflow-y-auto pr-1 space-y-6 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style dangerouslySetInnerHTML={{ __html: `div::-webkit-scrollbar { display: none !important; }` }} />

        <AnimatePresence>
          {isHistoryLoading && (
            <motion.div
              key="history-loading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              className="flex flex-col items-center justify-center h-full text-center py-12 gap-4"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/20 bg-gold/10 text-gold shadow-sm shadow-gold/10">
                <Loader2 size={24} className="animate-spin" />
              </div>
              <p className="text-sm text-foreground/60">Chargement de votre historique…</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showEmptyState && (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              className="flex flex-col items-center justify-center h-full text-center py-12 gap-6"
            >
              <div className="w-20 h-20 rounded-3xl bg-gold/10 border border-gold/20 flex items-center justify-center shadow-sm shadow-gold/10">
                <Sparkles size={36} className="text-gold" />
              </div>
              <div>
                <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">
                  Votre Sommelier <span className="text-gradient-gold">IA</span>
                </h1>
                <p className="text-sm text-foreground/70 max-w-md mx-auto font-light leading-relaxed">
                  Décrivez votre personnalité, vos envies ou une occasion spéciale. Notre IA experte concevra la formule parfaite pour vous.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {[
                  'Un parfum boisé pour une soirée romantique',
                  'Quelque chose de frais pour le bureau',
                  'Un parfum audacieux pour une sortie nocturne',
                ].map(s => (
                  <button
                    key={s}
                    onClick={() => handleSend({ content: s, bottleSize: null, budget: '' })}
                    className="text-xs px-4 py-2 rounded-full bg-white/5 border border-white/10 text-foreground/60 hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div key={`${msg.role}-${msg.id}-${index}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              {msg.role === 'user' ? (
                <UserBubble text={msg.text} metadata={msg.metadata} />
              ) : (
                <AiBubble messageObj={msg} onAddAllToCart={handleAddAll} onRetry={handleSend} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isLoading && (
            <motion.div key="loading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <LoadingBubble />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {!isEmpty && (
        <div className="flex items-center gap-3 py-3">
          <div className="flex-1 h-px bg-white/5" />
          <button
            onClick={handleResetConversation}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-foreground/30 hover:text-gold transition-colors font-bold"
          >
            <RefreshCw size={10} />
            Nouvelle conversation
          </button>
          <div className="flex-1 h-px bg-white/5" />
        </div>
      )}

      <div className="flex-shrink-0 pt-2">
        <InputBar
          onSend={handleSend}
          onStop={handleAbort}
          status={isLoading ? 'streaming' : 'ready'}
          placeholder="Ex: Un parfum boisé pour le printemps..."
          className="px-0 pb-0"

        />
      </div>
    </div>
  );
}