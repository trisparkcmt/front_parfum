'use client';

/**
 * @file components/perfume/GeminiChat.tsx
 * @description Redesigned AI Fragrance Sommelier — full chat experience.
 *
 * - User prompts appear as right-aligned chat bubbles.
 * - While awaiting the AI, a series of rotating search status messages animate on the left.
 * - AI response arrives as a left-aligned bubble.
 * - Recommended products (parfums, essences) render in a horizontally scrollable card row
 *   beneath the AI bubble, each with an individual "Add to cart" action plus a "Add all" CTA.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  Plus,
  Package,
  Beaker,
  RefreshCw,
} from 'lucide-react';
import { InputBar } from './InputBar';
import { API_ROOT } from '@/services/api';
import { labService } from '@/services/apiService';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { formatPrice, generateId } from '@/lib/utils';
import type { CustomComposition, CompositionEssence, Essence, Accessory, Product } from '@/types';

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

interface AiResponse {
  message: string;
  quantite_demandee_ml?: number;
  flacon?: { id: number; nom: string; prix_unitaire: string };
  parfums_existants?: AiProduct[];
  essences_pre_faites?: AiEssence[];
  ingredients_sur_mesure?: { essenceName: string; quantityMl: number }[];
  accessoires?: Accessory[];
}

type MessageRole = 'user' | 'ai';

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  aiData?: AiResponse;
  composition?: CustomComposition;
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
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Sparkles size={15} className="text-gold" />
      </div>

      <div className="max-w-xs md:max-w-md bg-white/5 border border-white/10 rounded-3xl rounded-bl-md px-5 py-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Animated dots */}
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

          {/* Rotating text */}
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

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-xs md:max-w-md bg-gold text-black font-medium rounded-3xl rounded-br-md px-5 py-3.5 shadow-lg shadow-gold/20 text-sm leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function ProductCard({
  image,
  name,
  price,
  onAdd,
}: {
  image?: string;
  name: string;
  price: string | number;
  onAdd: () => void;
}) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex-shrink-0 w-44 bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-gold/30 transition-all group">
      {/* Image */}
      <div className="relative w-full h-36 bg-black/20 overflow-hidden">
        {image ? (
          <img
            src={image.startsWith('http') ? image : `${API_ROOT}${image}`}
            alt={name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-foreground/20">
            <Package size={32} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-bold text-foreground/80 line-clamp-2 leading-tight mb-1">{name}</p>
        <p className="text-xs text-gold font-semibold">{typeof price === 'number' ? formatPrice(price) : formatPrice(Number(price))}</p>
      </div>

      {/* Add to Cart */}
      <button
        onClick={handleAdd}
        className={`w-full py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border-t border-white/5
          ${added
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-white/5 hover:bg-gold hover:text-black text-foreground/60'
          }`}
      >
        {added ? (
          <>
            <span>Ajouté ✓</span>
          </>
        ) : (
          <>
            <Plus size={11} />
            <span>Ajouter</span>
          </>
        )}
      </button>
    </div>
  );
}

function AiBubble({
  text,
  aiData,
  composition,
  onAddAllToCart,
}: {
  text: string;
  aiData?: AiResponse;
  composition?: CustomComposition;
  onAddAllToCart: (aiData: AiResponse, composition?: CustomComposition) => void;
}) {
  const { addProduct, addComposition } = useCartStore();
  const { addToast } = useToastStore();

  const hasProducts = (aiData?.parfums_existants?.length ?? 0) > 0;
  const hasEssences = (aiData?.essences_pre_faites?.length ?? 0) > 0;
  const hasComposition = composition && composition.essences.length > 0;
  const hasAnyItems = hasProducts || hasEssences || hasComposition;

  const handleAddProduct = (p: AiProduct) => {
    // Map to Product type minimal shape
    const product: Product = {
      id: String(p.id),
      name: p.nom,
      description: '',
      price: Number(p.prix_unitaire),
      category: 'perfume-brand',
      images: p.image_principale ? [p.image_principale] : [],
      inStock: true,
      createdAt: new Date().toISOString(),
      slug: p.slug,
    };
    addProduct(product);
    addToast(`"${p.nom}" ajouté au panier`, 'success');
  };

  return (
    <div className="flex items-start gap-3 justify-start">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
        <Sparkles size={15} className="text-gold" />
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        {/* Message bubble */}
        <div className="inline-block max-w-xs md:max-w-lg bg-white/5 border border-white/10 rounded-3xl rounded-tl-md px-5 py-4 shadow-xl backdrop-blur-md">
          <p className="text-sm text-foreground/85 leading-relaxed italic">&ldquo;{text}&rdquo;</p>
        </div>

        {/* Composition formula card */}
        {hasComposition && (
          <div className="bg-white/5 border border-gold/15 rounded-2xl p-4 max-w-md">
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
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.essence.color || '#C5A059' }}
                    />
                    <span className="text-foreground/70">{item.essence.name}</span>
                  </div>
                  <span className="font-bold font-mono text-foreground/50">{item.quantityMl}ml</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
              <span className="text-[10px] text-foreground/40 uppercase font-semibold">Prix composition</span>
              <span className="text-sm font-bold text-gold">{formatPrice(composition!.totalPrice)}</span>
            </div>
          </div>
        )}

        {/* Horizontal product cards */}
        {hasProducts && (
          <div>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold mb-2 ml-1">Parfums suggérés</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {aiData!.parfums_existants!.map(p => (
                <ProductCard
                  key={p.id}
                  image={p.image_principale}
                  name={p.nom}
                  price={p.prix_unitaire}
                  onAdd={() => handleAddProduct(p)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Essence cards */}
        {hasEssences && (
          <div>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold mb-2 ml-1">Essences recommandées</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {aiData!.essences_pre_faites!.map(e => (
                <div
                  key={e.id}
                  className="flex-shrink-0 w-44 bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-gold/30 transition-all"
                >
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

        {/* Add all + add composition CTAs */}
        {hasAnyItems && (
          <div className="flex flex-wrap gap-2">
            {hasComposition && (
              <button
                onClick={() => {
                  addComposition(composition!);
                  addToast('Composition IA ajoutée au panier !', 'success');
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider hover:bg-gold/80 transition-all active:scale-95 shadow-lg shadow-gold/20"
              >
                <ShoppingCart size={13} />
                Ajouter la composition
              </button>
            )}
            {hasProducts && (
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

// ── Main Component ──────────────────────────────────────────────────────────

export function GeminiChat() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [essences, setEssences] = useState<Essence[]>([]);

  const { addProduct, addComposition } = useCartStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const bottomRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Load essences catalog once
  useEffect(() => {
    labService.getEssences()
      .then(setEssences)
      .catch(err => console.error('Failed to load essences:', err));
  }, []);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── Handle user prompt submission ──
  const handleSend = useCallback(async (data: { content: string; bottleSize: string; budget: string }) => {
    if (!data.content.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text: data.content.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const fullPrompt = `${data.content} (Format: ${data.bottleSize}, Budget: ${data.budget})`;
      const response: AiResponse = await labService.getAIRecommendation(fullPrompt);

      // Parse essences into a composition object
      let totalPrice = 0;
      let totalMl = 0;
      const compositionEssences: CompositionEssence[] = [];

      if (response.essences_pre_faites && response.essences_pre_faites.length > 0) {
        response.essences_pre_faites.forEach(item => {
          const essence = essences.find(
            e => e.id === String(item.id) || e.name === item.nom || (e as unknown as Record<string, unknown>).nom === item.nom
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

      const aiMsg: ChatMessage = {
        id: generateId(),
        role: 'ai',
        text: response.message,
        aiData: response,
        composition,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      addToast('Une erreur est survenue avec le Sommelier IA', 'error');
      setMessages(prev => [
        ...prev,
        {
          id: generateId(),
          role: 'ai',
          text: 'Désolé, je rencontre une difficulté technique. Veuillez réessayer dans quelques instants.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, essences, user, addToast]);

  // ── Add all recommended products to cart ──
  const handleAddAll = useCallback((aiData: AiResponse, composition?: CustomComposition) => {
    let count = 0;

    if (composition) {
      addComposition(composition);
      count++;
    }

    aiData.parfums_existants?.forEach(p => {
      const product: Product = {
        id: String(p.id),
        name: p.nom,
        description: '',
        price: Number(p.prix_unitaire),
        category: 'perfume-brand',
        images: p.image_principale ? [p.image_principale] : [],
        inStock: true,
        createdAt: new Date().toISOString(),
        slug: p.slug,
      };
      addProduct(product);
      count++;
    });

    if (count > 0) addToast(`${count} article(s) ajouté(s) au panier !`, 'success');
  }, [addProduct, addComposition, addToast]);

  if (!mounted) return null;

  const isEmpty = messages.length === 0;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 260px)', minHeight: 480 }}>
      {/* ── Chat area ── */}
      <div
        ref={chatAreaRef}
        className="flex-1 overflow-y-auto pr-1 space-y-6 scroll-smooth"
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Empty state */}
        {isEmpty && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center py-12 gap-6"
          >
            <div className="w-20 h-20 rounded-3xl bg-gold/10 border border-gold/20 flex items-center justify-center shadow-xl shadow-gold/10">
              <Sparkles size={36} className="text-gold" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Votre Sommelier IA</h2>
              <p className="text-sm text-foreground/50 max-w-sm leading-relaxed">
                Décrivez votre personnalité, une occasion spéciale ou une envie. Nous composerons la formule parfaite.
              </p>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {[
                'Un parfum boisé pour une soirée romantique',
                'Quelque chose de frais pour le bureau',
                'Un parfum audacieux pour une sortie nocturne',
              ].map(s => (
                <button
                  key={s}
                  onClick={() => handleSend({ content: s, bottleSize: '50ml', budget: '' })}
                  className="text-xs px-4 py-2 rounded-full bg-white/5 border border-white/10 text-foreground/60 hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {msg.role === 'user' ? (
                <UserBubble text={msg.text} />
              ) : (
                <AiBubble
                  text={msg.text}
                  aiData={msg.aiData}
                  composition={msg.composition}
                  onAddAllToCart={handleAddAll}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <LoadingBubble />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* ── Divider + new conversation button if chat has started ── */}
      {!isEmpty && (
        <div className="flex items-center gap-3 py-3">
          <div className="flex-1 h-px bg-white/5" />
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-foreground/30 hover:text-gold transition-colors font-bold"
          >
            <RefreshCw size={10} />
            Nouvelle conversation
          </button>
          <div className="flex-1 h-px bg-white/5" />
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="flex-shrink-0 pt-2">
        <InputBar
          onSend={handleSend}
          status={isLoading ? 'streaming' : 'ready'}
          placeholder="Ex: Un parfum boisé pour le printemps..."
          className="px-0 pb-0"
        />
      </div>
    </div>
  );
}
