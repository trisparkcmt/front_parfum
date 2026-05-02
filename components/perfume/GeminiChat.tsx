'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, Plus, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { mockEssences } from '@/lib/mock-data';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { formatPrice, generateId } from '@/lib/utils';
import type { CustomComposition, CompositionEssence } from '@/types';

interface AiResponse {
  name: string;
  explanation: string;
  formula: { essenceName: string; quantityMl: number }[];
}

export function GeminiChat() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [parsedComposition, setParsedComposition] = useState<CustomComposition | null>(null);

  const { addComposition } = useCartStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/perfume/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('API Error');

      const data: AiResponse = await response.json();
      setResult(data);

      // Parse the formula into full CompositionEssence array
      let totalPrice = 0;
      let totalMl = 0;
      const essences: CompositionEssence[] = [];

      data.formula.forEach(item => {
        const essence = mockEssences.find(e => e.name === item.essenceName);
        if (essence) {
          essences.push({ essence, quantityMl: item.quantityMl });
          totalPrice += essence.pricePerMl * item.quantityMl;
          totalMl += item.quantityMl;
        }
      });

      setParsedComposition({
        id: generateId(),
        name: data.name,
        essences,
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

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!result && (
          <motion.div
            key="chat-input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles size={100} />
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gold/20 flex items-center justify-center text-gold">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Sommelier IA Numba</h3>
                <p className="text-sm text-foreground/60">Dites-moi ce que vous recherchez.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Je cherche un parfum frais et boisé pour le printemps, avec une touche d'agrumes..."
                className="w-full min-h-[120px] bg-black/20 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 resize-none mb-4"
              />
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex flex-wrap gap-2">
                  {/* Suggestion chips */}
                  {['Pour un mariage', 'Séduisant', 'Frais & Sport'].map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setPrompt(suggestion)}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <Button type="submit" disabled={!prompt.trim() || isLoading} rightIcon={isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}>
                  {isLoading ? 'Analyse...' : 'Composer'}
                </Button>
              </div>
            </form>
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
              <h2 className="font-display text-3xl font-bold mb-2">{result.name}</h2>
              <p className="text-foreground/80 italic max-w-lg mx-auto">"{result.explanation}"</p>
            </div>

            <div className="bg-charcoal/50 border border-white/10 rounded-2xl p-6 mb-8">
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
