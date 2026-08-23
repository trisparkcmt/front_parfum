'use client';

import { useState, useEffect, useCallback } from 'react';
import { FlaskConical, Pencil, Eye, Loader2 } from 'lucide-react';
import { labService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { SlideOver } from '@/components/ui/SlideOver';
import { LaptopIcon } from '@/components/icons/CustomIcons';

// --- Shared Primitives & Helpers ---

const cx = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

function StatusChip({ isAI }: { isAI: boolean }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        isAI
          ? 'text-purple-400 bg-purple-500/10 ring-purple-500/20'
          : 'text-amber-400 bg-amber-500/10 ring-amber-500/20'
      )}
    >
      <span
        className={cx(
          'h-1.5 w-1.5 rounded-full',
          isAI ? 'bg-purple-400' : 'bg-amber-400'
        )}
      />
      {isAI ? 'IA' : 'Manuelle'}
    </span>
  );
}

function IconButton({
  onClick,
  children,
  variant = 'gold',
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'gold' | 'red' | 'blue';
  title?: string;
}) {
  const hoverColors = {
    gold: 'hover:text-gold hover:bg-gold/10',
    red: 'hover:text-red-400 hover:bg-red-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={cx(
        'rounded-md p-1.5 text-foreground/45 transition-colors',
        hoverColors[variant]
      )}
    >
      {children}
    </button>
  );
}

// --- Main Component ---

export default function CompositionsPage() {
  const [compositions, setCompositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const { addToast } = useToastStore();

  const fetchCompositions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await labService.getCustomPerfumes();
      const list = data.results || data.resultats || (Array.isArray(data) ? data : []);
      setCompositions(list);
    } catch (error) {
      addToast('Erreur lors du chargement des compositions', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCompositions();
  }, [fetchCompositions]);

  const iaCount = compositions.filter(c => c.type === 'ia' || c.is_ai).length;
  const manualCount = compositions.filter(c => !(c.type === 'ia' || c.is_ai)).length;
  const avgPrice = compositions.length
    ? Math.round(compositions.reduce((s, c) => s + (c.prix || 0), 0) / compositions.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Compositions Sur Mesure</h1>
        <p className="text-sm text-foreground/40 mt-0.5">Créations IA et compositions manuelles des clients</p>
      </div>

      {/* KPI Bar */}
      <div className="shadow-black/30 shadow-sm rounded-xl border border-white/10 bg-white/[0.02] grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Total compositions</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-1">{compositions.length}</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Via IA</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-1">{iaCount}</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Manuelles</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-1">{manualCount}</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Prix moyen</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-1">{avgPrice.toLocaleString()} FCFA</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="shadow-black/30 shadow-sm rounded-xl border border-white/10 overflow-hidden bg-white/[0.02] min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-foreground/40 text-xs gap-2">
            <Loader2 className="animate-spin text-gold" size={16} />
            <span>Chargement des compositions...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Composition</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Type</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Client / Auteur</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Flacon</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Prix</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {compositions.map(c => {
                  const isAI = c.type === 'ia' || c.is_ai;
                  const cName = c.nom || c.name || `Custom #${c.id}`;
                  const author = c.user_details?.first_name || c.user_name || 'Client';

                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-foreground text-sm">{cName}</div>
                        <div className="text-[11px] text-foreground/40 font-mono">ID: {c.id}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusChip isAI={isAI} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-foreground/80 font-medium">{author}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-foreground/60">Flacon ID: {c.flacon || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {(c.prix || 0).toLocaleString()} FCFA
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <IconButton onClick={() => setSelected(c)} variant="gold" title="Voir détails">
                          <Eye size={16} />
                        </IconButton>
                      </td>
                    </tr>
                  );
                })}
                {compositions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm italic text-foreground/30">
                      Aucune composition trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <SlideOver
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.nom || selected.name || `Composition #${selected.id}`}
          description={`Créé par ${selected.user_details?.first_name || selected.user_name || 'Client'}`}
          size="md"
          footer={
            <div className="w-full flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-foreground/60 hover:bg-white/5 transition-colors"
              >
                Fermer
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Status Chip Badge */}
            <div>
              <StatusChip isAI={selected.type === 'ia' || selected.is_ai} />
            </div>

            {/* Modal Summary Strip */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] grid grid-cols-2 divide-x divide-white/10 p-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Prix Total</p>
                <p className="text-base font-semibold tabular-nums text-foreground mt-0.5">
                  {(selected.prix || 0).toLocaleString()} FCFA
                </p>
              </div>
              <div className="pl-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Flacon</p>
                <p className="text-base font-semibold text-foreground mt-0.5">
                  {selected.flacon ? `#${selected.flacon}` : '—'}
                </p>
              </div>
            </div>

            {selected.description && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-1">Description</p>
                <p className="text-xs text-foreground/70 italic leading-relaxed">
                  "{selected.description}"
                </p>
              </div>
            )}

            {/* Formula Details */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                Ingrédients & Formule
              </p>
              <div className="divide-y divide-white/5 border-t border-b border-white/10">
                {selected.lignes?.map((ligne: any, i: number) => {
                  const name =
                    ligne.essence_details?.nom ||
                    ligne.essence_details?.name ||
                    `Essence #${ligne.essence_catalogue || ligne.essence_personnalisee}`;
                  return (
                    <div key={i} className="py-2.5 flex justify-between items-center text-xs">
                      <span className="text-foreground/80 font-medium">{name}</span>
                      <span className="text-foreground/40 tabular-nums font-mono">{ligne.quantite_ml} ml</span>
                    </div>
                  );
                })}
              </div>

              {(!selected.lignes || selected.lignes.length === 0) && (
                <p className="text-xs text-foreground/30 italic py-2">
                  Aucun détail sur les lignes de formulation.
                </p>
              )}
            </div>
          </div>
        </SlideOver>
      )}
    </div>
  );
}