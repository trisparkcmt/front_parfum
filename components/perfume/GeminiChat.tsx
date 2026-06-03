'use client';

/**
 * @file components/perfume/GeminiChat.tsx
 * @description AI-Powered Fragrance Sommelier Chat Interface.
 *
 * This component provides an interactive conversational experience where users can 
 * describe their scent preferences and receive intelligent perfume recommendations.
 * 
 * **Core Functionalities**:
 * - **Natural Language Processing**: Captures user input (prompts) and sends them to the `/api/perfume/ai-advisor` endpoint.
 * - **AI-Driven Formulation**: Processes the JSON response from the AI, which includes a perfume name, an artistic explanation, and a specific essence-by-essence formula.
 * - **Formula Parsing**: Dynamically maps the AI-suggested essence names to the `mockEssences` dataset to calculate real-world prices and volumes.
 * - **One-Click Creation**: Allows users to instantly convert the AI's recommendation into a `CustomComposition` and add it to their shopping cart.
 * 
 * **UI/UX Implementation**:
 * - **Stateful Transitions**: Uses `AnimatePresence` and `motion` to switch between the "Chat Input" state and the "AI Result" state.
 * - **Mockup Suggestion Chips**: Provides quick-start buttons for common user requests (e.g., "Séduisant", "Frais & Sport").
 * - **Loading Feedback**: Features an "Analyse..." state with a spinner during AI computation.
 * 
 * **Integration**:
 * - **Zustand**: Communicates with `useCartStore` for checkout, `useAuthStore` for user context, and `useToastStore` for error handling.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, Plus, ShoppingBag } from 'lucide-react';
import { InputBar } from './InputBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import { API_ROOT } from '@/services/api';
import { labService } from '@/services/apiService';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { formatPrice, generateId } from '@/lib/utils';
import type { CustomComposition, CompositionEssence, Essence, Product, Accessory } from '@/types';

interface AiResponse {
  message: string;
  quantite_demandee_ml?: number;
  flacon?: {
    id: number;
    nom: string;
    prix_unitaire: string;
  };
  parfums_existants?: Array<{
    id: number;
    nom: string;
    prix_unitaire: string;
    image_principale: string;
  }>;
  essences_pre_faites?: Array<{
    id: number;
    nom: string;
    code_reference: string;
    prix_par_ml: string;
    quantite_ml: number;
    prix_total_quantite: string;
  }>;
  ingredients_sur_mesure?: { essenceName: string; quantityMl: number }[];
  accessoires?: Accessory[];
}

export function GeminiChat() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [parsedComposition, setParsedComposition] = useState<CustomComposition | null>(null);
  const [essences, setEssences] = useState<Essence[]>([]);
  const [loadingEssences, setLoadingEssences] = useState(true);

  const { addComposition } = useCartStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchEssences = async () => {
      try {
        const data = await labService.getEssences();
        setEssences(data);
      } catch (error) {
        console.error('Failed to load essences:', error);
      } finally {
        setLoadingEssences(false);
      }
    };
    fetchEssences();
  }, []);

  const handleSend = async (data: { content: string; bottleSize: string; budget: string }) => {
    if (!data.content.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      // On combine le contenu avec la taille et le budget pour l'IA
      const fullPrompt = `${data.content} (Format: ${data.bottleSize}, Budget: ${data.budget})`;
      const response: AiResponse = await labService.getAIRecommendation(fullPrompt);
      setResult(response);

      // Parse the formula into full CompositionEssence array
      let totalPrice = 0;
      let totalMl = 0;
      const compositionEssences: CompositionEssence[] = [];

      // Handle catalog essences recommended by the AI (prioritize this over raw ingredients)
      if (response.essences_pre_faites && response.essences_pre_faites.length > 0) {
        response.essences_pre_faites.forEach(item => {
          // Match essence by id or by name/nom compatibility (some datasets use French 'nom')
          const essence = essences.find(e => e.id === String(item.id) || e.name === item.nom || (e as any).nom === item.nom);
          if (essence) {
            compositionEssences.push({ essence, quantityMl: item.quantite_ml });
            totalPrice += Number(item.prix_total_quantite);
            totalMl += item.quantite_ml;
          }
        });
      } else if (response.ingredients_sur_mesure && response.ingredients_sur_mesure.length > 0) {
        // Fallback to raw ingredients if provided
        response.ingredients_sur_mesure.forEach(item => {
          const essence = essences.find(e => e.name === item.essenceName);
          if (essence) {
            compositionEssences.push({ essence, quantityMl: item.quantityMl });
            totalPrice += essence.pricePerMl * item.quantityMl;
            totalMl += item.quantityMl;
          }
        });
      }

      // Add bottle price to the total if returned in the response
      if (response.flacon) {
        totalPrice += Number(response.flacon.prix_unitaire);
      }

      setParsedComposition({
        id: generateId(),
        name: response.flacon ? `Création IA (${response.flacon.nom})` : "Création IA",
        essences: compositionEssences,
        totalMl,
        totalPrice,
        createdBy: user?.id || 'guest',
        createdAt: new Date().toISOString(),
        isAiGenerated: true,
      });

    } catch (error) {
      addToast('Une erreur est survenue avec le Sommelier IA', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (parsedComposition) {
      addComposition(parsedComposition);
      addToast('Création IA ajoutée au panier !', 'success');
      setResult(null);
      setPrompt('');
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        {!result && (
          <motion.div
            key="chat-input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full"
          >
            <InputBar
              onSend={handleSend}
              status={isLoading ? "streaming" : "ready"}
              placeholder="Ex: Un parfum boisé pour le printemps..."
              className="px-0 pb-0"
            />

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {[
                "I want a perfume for a casual wedding",
                "I'm looking for a fresh scent for daily office wear",
                "Design a bold fragrance for a night out in Paris"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSend({ content: suggestion, bottleSize: "50ml", budget: "" })}
                  className="text-xs px-4 py-2 rounded-full bg-white/5 border border-white/10 text-foreground/60 hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {result && parsedComposition && (
          <motion.div
            key="ai-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gold/10 to-charcoal border border-gold/30 rounded-3xl p-6 md:p-8"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/20 text-gold mb-4 ring-4 ring-gold/10">
                <Sparkles size={32} />
              </div>
              <h2 className="font-display text-3xl font-bold mb-2">{t('ai_recommendation')}</h2>
              <p className="text-foreground/80 italic max-w-lg mx-auto">"{result.message}"</p>
            </div>

            {parsedComposition && parsedComposition.essences.length > 0 && (
              <div className="bg-charcoal/50 border border-white/10 p-6 mb-8">
              <h4 className="font-medium text-sm text-gold mb-4 uppercase tracking-wider">Formule ({parsedComposition.totalMl}ml)</h4>
              <div className="space-y-4">
                {parsedComposition.essences.map(item => (
                  <div key={item.essence.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.essence.color }} />
                      <div>
                        <p className="font-medium">{item.essence.name}</p>
                        <p className="text-xs text-foreground/50">{item.essence.family}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{item.quantityMl}ml</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-foreground/60">Prix calculé ({parsedComposition.totalMl}ml)</span>
                <span className="font-display text-2xl font-bold text-gold">{formatPrice(parsedComposition.totalPrice)}</span>
              </div>
            </div>
            )}

            {/* Display existing product recommendations */}
            {result.parfums_existants && result.parfums_existants.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gold mb-4">Produits suggérés</h4>
                <div className="grid grid-cols-2 gap-4">
                  {result.parfums_existants.map(p => (
                    <Link key={p.id} href={`/shop/product/${p.id}`} className="block group">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/10 hover:border-gold/50 transition-all">
                        {p.image_principale && (
                          <div className="relative aspect-square mb-2 overflow-hidden rounded-lg bg-black/20">
                            <img 
                              src={p.image_principale.startsWith('http') ? p.image_principale : `${API_ROOT}${p.image_principale}`} 
                              alt={p.nom}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        <p className="text-sm font-bold truncate">{p.nom}</p>
                        <p className="text-xs text-gold">{formatPrice(Number(p.prix_unitaire))}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setResult(null)}
              >
                Recommencer
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddToCart}
                rightIcon={<ShoppingBag size={18} />}
              >
                Ajouter au panier
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
