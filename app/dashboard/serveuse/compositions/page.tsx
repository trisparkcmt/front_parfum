'use client';

import { useState, useEffect, useCallback } from 'react';
import { FlaskConical, Pencil, Eye, Loader2 } from 'lucide-react';
import { labService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { LaptopIcon } from '@/components/icons/CustomIcons';

const toNumber = (value: any) => {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const normalizeComposition = (item: any) => {
  const name = item?.nom || item?.name || item?.titre || `Composition #${item?.id ?? '—'}`;
  const author =
    [item?.user_details?.first_name, item?.user_details?.last_name]
      .filter(Boolean)
      .join(' ') ||
    item?.user_name ||
    item?.client_name ||
    item?.client_details?.first_name ||
    'Client';

  const flaconLabel =
    item?.flacon_detail?.nom ||
    item?.flacon_nom ||
    item?.flacon?.nom ||
    item?.flacon_detail?.type_flacon?.nom ||
    (item?.flacon ? `Flacon #${item.flacon}` : '—');

  const price = toNumber(item?.prix_total ?? item?.prix ?? item?.prix_final ?? item?.montant ?? 0);
  const lines = Array.isArray(item?.lignes) ? item.lignes : [];
  const isAI = Boolean(item?.type === 'ia' || item?.is_ai || item?.source === 'ia' || item?.generated_by === 'ia');

  return {
    ...item,
    name,
    author,
    flaconLabel,
    price,
    lines,
    isAI,
  };
};

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
      setCompositions((Array.isArray(list) ? list : []).map(normalizeComposition));
    } catch (error) {
      addToast('Erreur lors du chargement des compositions', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCompositions();
  }, [fetchCompositions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compositions Sur Mesure</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Créations IA et compositions manuelles des clients (Lecture seule)</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total compositions', value: compositions.length, icon: <FlaskConical size={18} />, color: 'text-gold bg-gold/10' },
          { label: 'Via IA', value: compositions.filter(c => c.isAI).length, icon: <LaptopIcon size={18} />, color: 'text-purple-400 bg-purple-500/10' },
          { label: 'Manuelles', value: compositions.filter(c => !c.isAI).length, icon: <Pencil size={18} />, color: 'text-amber-400 bg-amber-500/10' },
          { label: 'Prix moyen', value: `${(compositions.reduce((s, c) => s + (c.price || 0), 0) / (compositions.length || 1)).toFixed(0)} FCFA`, icon: <FlaskConical size={18} />, color: 'text-emerald-400 bg-emerald-500/10' },
        ].map(k => (
          <div key={k.label} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${k.color}`}>
              {k.icon}
            </div>
            <p className="text-2xl font-bold text-foreground">{k.value}</p>
            <p className="text-xs text-foreground/40 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des compositions...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Composition</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Client / Auteur</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Flacon</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {compositions.map(c => {
                  const item = normalizeComposition(c);

                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                            ${item.isAI ? 'bg-purple-500/10 text-purple-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {item.isAI ? <LaptopIcon size={18} /> : <Pencil size={18} />}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{item.name}</p>
                            <p className="text-[11px] text-foreground/40">ID: {item.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-foreground font-medium">{item.author}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-foreground/60">{item.flaconLabel}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-foreground">{item.price.toLocaleString()} FCFA</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setSelected(item)} className="p-2 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {compositions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-20 text-foreground/40 italic">Aucune composition trouvée.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-sm border border-white/10">
            <h3 className="font-bold text-foreground mb-1">{selected.name}</h3>
            <p className="text-xs text-foreground/40 mb-4">Auteur: {selected.author}</p>
            {selected.description && (
              <p className="text-sm text-foreground/60 italic mb-4">"{selected.description}"</p>
            )}
            <div className="space-y-3 mb-5">
              <p className="text-xs font-semibold text-foreground/40 uppercase">Ingrédients & Formule</p>
              {(selected.lines || []).map((ligne: any, i: number) => {
                const name =
                  ligne.essence_detail?.nom ||
                  ligne.essence_detail?.name ||
                  ligne.ingredient_detail?.nom ||
                  ligne.essence_details?.nom ||
                  ligne.essence_details?.name ||
                  `Essence #${ligne.essence_catalogue ?? ligne.essence_personnalisee ?? ligne.essence ?? ligne.ingredient ?? i + 1}`;
                const quantity = ligne.quantite_ml ?? ligne.quantite ?? ligne.quantite_ml_snapshot ?? 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{name}</span>
                      <span className="text-foreground/40">{Number(quantity).toFixed(1)} ml</span>
                    </div>
                  </div>
                );
              })}
              {(!selected.lines || selected.lines.length === 0) && (
                <p className="text-xs text-foreground/40 italic">Aucun détail sur les lignes de formulation.</p>
              )}
            </div>

            {/* Flacon Info */}
            <div className="space-y-2 mb-5 pb-5 border-b border-white/10">
              <p className="text-xs font-semibold text-foreground/40 uppercase">Flacon</p>
              {selected.flaconLabel && selected.flaconLabel !== '—' && (
                <div className="text-xs text-foreground/60">
                  <p>{selected.flaconLabel}</p>
                </div>
              )}
              {(selected.couleur || selected.flacon_detail?.couleur) && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-xs text-foreground/40">Couleur:</span>
                  <code className="text-xs font-mono text-gold bg-white/5 px-2 py-1 rounded border border-white/10">{selected.couleur || selected.flacon_detail?.couleur}</code>
                  <div 
                    className="w-6 h-6 rounded-full border border-white/20 shadow-md cursor-pointer hover:shadow-lg hover:border-white/40 transition-all"
                    style={{ backgroundColor: selected.couleur || selected.flacon_detail?.couleur }}
                    title="Couleur du flacon"
                  >
                    <div 
                      className="w-full h-full rounded-full pointer-events-none"
                      style={{
                        boxShadow: `inset 0 0 4px ${(selected.couleur || selected.flacon_detail?.couleur) || '#000000'}40, 0 0 6px ${(selected.couleur || selected.flacon_detail?.couleur) || '#000000'}40`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="w-full border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
