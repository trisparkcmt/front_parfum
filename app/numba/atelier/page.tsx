'use client';

/**
 * @file app/numba/atelier/page.tsx
 * @description The Interactive Perfume Creation Lab (Atelier).
 *
 * This is the flagship interactive experience of the platform, enabling users to 
 * professionally mix and design their own custom fragrances in a virtual environment.
 * 
 * **Complex State & Logic**:
 * - **`composition` State**: Manages an array of `CompositionEssence` objects, tracking which ingredients have been added and their specific volume in milliliters.
 * - **Capacity Management**: Strictly enforces a `MAX_COMPOSITION_ML` (100ml) limit. It prevents adding more liquid than the bottle can hold while providing visual and toast feedback.
 * - **Dynamic Pricing**: Uses `useMemo` (or derived state) to calculate the `totalPrice` based on the unique `pricePerMl` of each selected essence.
 * - **Visual Blending**: Communicates with the `MixerTool` to update the bottle's fill level and liquid color dynamically as the user interacts with the lab.
 * 
 * **User Workflow**:
 * - **Filtering**: Provides an olfactive family filter (Citrus, Woody, etc.) to help users navigate the library of essences.
 * - **Naming & Saving**: Authenticated users can open a `Modal` to name their creation before it is persisted to their profile and added to the `useCartStore`.
 * - **Guest Support**: Allows unauthenticated users to add creations directly to the cart with a generic name.
 * 
 * **Integrations**:
 * - **Zustand**: Syncs with `useCartStore` for shopping integration and `useAuthStore` for session-aware saving.
 * - **Framer Motion**: Implements smooth animations for the essence cards and modal transitions.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, ShoppingBag, Settings2, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ScentCard } from '@/components/perfume/ScentCard';
import { MixerTool } from '@/components/perfume/MixerTool';
import { mockEssences } from '@/lib/mock-data';
import { MAX_COMPOSITION_ML, ESSENCE_INCREMENT_ML, OLFACTIVE_FAMILIES } from '@/lib/constants';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { formatPrice, generateId } from '@/lib/utils';
import type { CompositionEssence, CustomComposition } from '@/types';

export default function AtelierManuel() {
  const router = useRouter();
  const { addComposition } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useToastStore();

  const [composition, setComposition] = useState<CompositionEssence[]>([]);
  const [activeFamilyFilter, setActiveFamilyFilter] = useState<string>('all');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [perfumeName, setPerfumeName] = useState('');

  const totalMl = composition.reduce((sum, item) => sum + item.quantityMl, 0);
  const totalPrice = composition.reduce((sum, item) => sum + (item.essence.pricePerMl * item.quantityMl), 0);
  const isFull = totalMl >= MAX_COMPOSITION_ML;

  const handleAddEssence = (essenceId: string, amount: number) => {
    if (totalMl + amount > MAX_COMPOSITION_ML) {
      addToast(`Capacité maximale (${MAX_COMPOSITION_ML}ml) atteinte`, 'info');
      return;
    }

    setComposition(prev => {
      const existing = prev.find(item => item.essence.id === essenceId);
      if (existing) {
        return prev.map(item =>
          item.essence.id === essenceId
            ? { ...item, quantityMl: item.quantityMl + amount }
            : item
        );
      }
      const essence = mockEssences.find(e => e.id === essenceId);
      if (!essence) return prev;
      return [...prev, { essence, quantityMl: amount }];
    });
  };

  const handleRemoveEssence = (essenceId: string, amount: number) => {
    setComposition(prev => {
      const existing = prev.find(item => item.essence.id === essenceId);
      if (!existing) return prev;

      if (existing.quantityMl <= amount) {
        return prev.filter(item => item.essence.id !== essenceId);
      }

      return prev.map(item =>
        item.essence.id === essenceId
          ? { ...item, quantityMl: item.quantityMl - amount }
          : item
      );
    });
  };

  const createCompositionObject = (name: string): CustomComposition => {
    return {
      id: generateId(),
      name,
      essences: [...composition],
      totalMl,
      totalPrice,
      createdBy: user?.id || 'guest',
      createdAt: new Date().toISOString(),
      isAiGenerated: false,
    };
  };

  const handleSaveToProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfumeName.trim()) return;

    // In a real app, this would send to the backend to save in the user's profile
    const customPerfume = createCompositionObject(perfumeName);

    // We add it to cart as well for convenience
    addComposition(customPerfume);

    setIsSaveModalOpen(false);
    setPerfumeName('');
    addToast('Création sauvegardée et ajoutée au panier !', 'success');

    // Reset composition after successful save/add
    setComposition([]);
  };

  const handleDirectAddToCart = () => {
    const customPerfume = createCompositionObject('Création Numba (Non nommée)');
    addComposition(customPerfume);
    addToast('Création ajoutée au panier !', 'success');
    setComposition([]);
  };

  const families = ['all', ...Object.keys(OLFACTIVE_FAMILIES)];
  const filteredEssences = activeFamilyFilter === 'all'
    ? mockEssences
    : mockEssences.filter(e => e.family === activeFamilyFilter);

  return (
    <div className="min-h-screen bg-background pt-16 lg:pt-20">
      {/* Header */}
      <div className="sticky top-16 lg:top-20 z-40 bg-background/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/numba" className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-gold transition-colors">
              <ArrowLeft size={16} /> Retour
            </Link>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block mr-4">
                <p className="text-xs text-foreground/50 uppercase tracking-wider">Prix Total</p>
                <p className="font-display font-bold text-xl text-gold">{formatPrice(totalPrice)}</p>
              </div>

              {isAuthenticated ? (
                <Button
                  onClick={() => setIsSaveModalOpen(true)}
                  disabled={totalMl === 0}
                  rightIcon={<Save size={18} />}
                >
                  Sauvegarder
                </Button>
              ) : (
                <Button
                  onClick={handleDirectAddToCart}
                  disabled={totalMl === 0}
                  rightIcon={<ShoppingBag size={18} />}
                >
                  Ajouter au panier
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Column: Mixer Visualizer */}
          <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-40 self-start">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">L'Atelier</h1>
              <p className="text-foreground/60 text-sm">
                Composez votre parfum en ajoutant des essences. Capacité maximale de {MAX_COMPOSITION_ML}ml.
              </p>
            </div>

            <MixerTool essences={composition} totalMl={totalMl} />

            {/* Composition Summary List */}
            {composition.length > 0 && (
              <div className="bg-white/5 border border-white/10  p-6">
                <h3 className="font-medium text-sm text-foreground/70 mb-4 flex items-center gap-2">
                  <Settings2 size={16} />
                  Formule Actuelle
                </h3>
                <div className="space-y-3">
                  {composition.map(item => (
                    <div key={item.essence.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.essence.color }} />
                        <span>{item.essence.name}</span>
                      </div>
                      <span className="font-medium">{item.quantityMl}ml</span>
                    </div>
                  ))}
                  <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between font-bold">
                    <span>Total</span>
                    <span className={isFull ? "text-emerald-400" : ""}>{totalMl}ml</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Essences Library */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {families.map(family => (
                <button
                  key={family}
                  onClick={() => setActiveFamilyFilter(family)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeFamilyFilter === family
                    ? 'bg-gold text-deep-black'
                    : 'bg-white/5 border border-white/10 hover:border-gold/50'
                    }`}
                >
                  {family === 'all'
                    ? 'Toutes les essences'
                    : `${OLFACTIVE_FAMILIES[family as keyof typeof OLFACTIVE_FAMILIES].emoji} ${OLFACTIVE_FAMILIES[family as keyof typeof OLFACTIVE_FAMILIES].label}`
                  }
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredEssences.map(essence => {
                  const currentQuantity = composition.find(c => c.essence.id === essence.id)?.quantityMl || 0;
                  return (
                    <motion.div
                      key={essence.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ScentCard
                        essence={essence}
                        currentQuantity={currentQuantity}
                        onAdd={(amount) => handleAddEssence(essence.id, amount)}
                        onRemove={(amount) => handleRemoveEssence(essence.id, amount)}
                        disabled={isFull}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      {/* Save Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="Sauvegarder votre création"
      >
        <form onSubmit={handleSaveToProfile} className="space-y-6">
          <p className="text-sm text-foreground/70">
            Donnez un nom à votre création unique pour l'ajouter à votre collection et passer commande.
          </p>

          <Input
            label="Nom de votre parfum"
            placeholder="Ex: Nuit d'Été"
            value={perfumeName}
            onChange={(e) => setPerfumeName(e.target.value)}
            autoFocus
          />

          <div className="bg-gold/10 border border-gold/20 p-4  flex gap-3 text-sm">
            <Info size={18} className="text-gold shrink-0 mt-0.5" />
            <p>
              Votre création (<span className="font-bold">{totalMl}ml</span>) sera sauvegardée dans votre profil et ajoutée à votre panier pour <span className="font-bold text-gold">{formatPrice(totalPrice)}</span>.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsSaveModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!perfumeName.trim()}>
              Sauvegarder & Commander
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
