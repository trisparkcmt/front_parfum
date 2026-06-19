'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  title?: string;
  categoryType?: string;
}

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Nouvelle catégorie',
  categoryType = 'Catégorie',
}) => {
  const [categoryName, setCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCategoryName('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setError('Le nom est requis');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(categoryName.trim());
      setCategoryName('');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Échec de la création';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-background rounded-2xl shadow-2xl border border-white/10 max-w-sm w-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
              <Plus size={16} className="text-gold" />
            </div>
            <h2 className="text-sm font-bold text-foreground">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/50 uppercase tracking-wider">
              Nom de la {categoryType.toLowerCase()} *
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder={`Ex: ${categoryType === 'Catégorie' ? 'Inspiration' : 'Montre'}`}
              disabled={isLoading}
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold placeholder:text-foreground/30 disabled:opacity-50"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-foreground/60 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !categoryName.trim()}
              className="flex-1 px-4 py-2.5 bg-gold text-black rounded-lg text-sm font-bold hover:bg-gold/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
