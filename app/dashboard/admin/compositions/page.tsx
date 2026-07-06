'use client';

import { useState, useEffect, useCallback } from 'react';
import { FlaskConical, Cpu, Pencil, Eye, Loader2 } from 'lucide-react';
import { labService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { BackButton } from '@/components/ui/BackButton';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compositions Sur Mesure</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Créations IA et compositions manuelles des clients</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total compositions', value: compositions.length, icon: <FlaskConical size={18} />, color: 'text-gold bg-gold/10' },
          { label: 'Via IA', value: compositions.filter(c => c.type === 'ia' || c.is_ai).length, icon: <Cpu size={18} />, color: 'text-purple-400 bg-purple-500/10' },
          { label: 'Manuelles', value: compositions.filter(c => !(c.type === 'ia' || c.is_ai)).length, icon: <Pencil size={18} />, color: 'text-amber-400 bg-amber-500/10' },
          { label: 'Prix moyen', value: `${(compositions.reduce((s, c) => s + (c.prix || 0), 0) / (compositions.length || 1)).toFixed(0)} FCFA`, icon: <FlaskConical size={18} />, color: 'text-emerald-400 bg-emerald-500/10' },
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
                  const isAI = c.type === 'ia' || c.is_ai;
                  const cName = c.nom || c.name || `Custom #${c.id}`;
                  const author = c.user_details?.first_name || c.user_name || 'Client';

                  return (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                            ${isAI ? 'bg-purple-500/10 text-purple-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {isAI ? <Cpu size={18} /> : <Pencil size={18} />}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{cName}</p>
                            <p className="text-[11px] text-foreground/40">ID: {c.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-foreground font-medium">{author}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-foreground/60">Flacon ID: {c.flacon || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-foreground">{(c.prix || 0).toLocaleString()} FCFA</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setSelected(c)} className="p-2 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
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
            <h3 className="font-bold text-foreground mb-1">{selected.nom || selected.name || `Composition #${selected.id}`}</h3>
            <p className="text-xs text-foreground/40 mb-4">Auteur: {selected.user_details?.first_name || 'Client'}</p>
            {selected.description && (
              <p className="text-sm text-foreground/60 italic mb-4">"{selected.description}"</p>
            )}
            <div className="space-y-3 mb-5">
              <p className="text-xs font-semibold text-foreground/40 uppercase">Ingrédients & Formule</p>
              {selected.lignes?.map((ligne: any, i: number) => {
                const name = ligne.essence_details?.nom || ligne.essence_details?.name || `Essence #${ligne.essence_catalogue || ligne.essence_personnalisee}`;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{name}</span>
                      <span className="text-foreground/40">{ligne.quantite_ml} ml</span>
                    </div>
                  </div>
                );
              })}
              {(!selected.lignes || selected.lignes.length === 0) && (
                <p className="text-xs text-foreground/40 italic">Aucun détail sur les lignes de formulation.</p>
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
