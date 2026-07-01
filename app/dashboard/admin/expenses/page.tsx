'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, RefreshCw, Trash2, User } from 'lucide-react';
import { api } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';

interface Expense {
  id: number;
  titre: string;
  description: string;
  montant: string;
  date_depense: string;
  date_creation: string;
  cree_par: number;
  cree_par_details?: {
    first_name: string;
    last_name: string;
    email: string;
    telephone?: string;
  };
}

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const { addToast } = useToastStore();

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (dateFilter) params.date_depense = dateFilter;
      const res = await api.get('utilisateur/depenses/', { params });
      const data = res.data;
      setExpenses(data.results ?? data.resultats ?? (Array.isArray(data) ? data : []));
    } catch {
      addToast('Erreur lors du chargement de toutes les dépenses', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, dateFilter, addToast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer définitivement cette dépense ?')) return;
    try {
      await api.delete(`utilisateur/depenses/${id}/`);
      addToast('Dépense supprimée de l’historique', 'success');
      fetchExpenses();
    } catch {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const totalAmount = expenses.reduce((sum, item) => sum + parseFloat(item.montant), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Dépenses</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Historique complet des dépenses quotidiennes déclarées par les serveuses</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            <span className="text-xs text-foreground/40 mr-2">Total :</span>
            <span className="font-bold text-gold">{totalAmount.toLocaleString()} FCFA</span>
          </div>
          <button
            onClick={() => fetchExpenses()}
            className="flex items-center gap-2 border border-white/10 px-4 py-2.5 rounded-xl text-sm text-foreground/60 hover:bg-white/5"
          >
            <RefreshCw size={15} />
            Actualiser
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex-1 min-w-[200px]">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre ou serveuse…"
            className="text-sm bg-transparent outline-none flex-1 text-foreground"
          />
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold"
        />
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden min-h-[250px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm">Chargement des dépenses globales…</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-20 text-foreground/40 italic">
            Aucune dépense trouvée dans le système.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {['Déclaré par (Serveuse)', 'Titre', 'Description', 'Montant', 'Date de la Dépense', 'Créé le', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {expenses.map((exp) => {
                  const serveuseNom = exp.cree_par_details 
                    ? `${exp.cree_par_details.first_name || ''} ${exp.cree_par_details.last_name || ''}`.trim() || exp.cree_par_details.email
                    : `Serveuse #${exp.cree_par}`
                  return (
                    <tr key={exp.id} className="hover:bg-white/5">
                      <td className="px-5 py-4 font-medium text-gold flex items-center gap-2">
                        <User size={14} className="opacity-50" />
                        <span>{serveuseNom}</span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-foreground">{exp.titre}</td>
                      <td className="px-5 py-4 text-foreground/60">{exp.description || '—'}</td>
                      <td className="px-5 py-4 font-bold text-red-400">{Number(exp.montant).toLocaleString()} FCFA</td>
                      <td className="px-5 py-4 text-foreground/60">{new Date(exp.date_depense).toLocaleDateString('fr-FR')}</td>
                      <td className="px-5 py-4 text-[11px] text-foreground/40">{new Date(exp.date_creation).toLocaleString('fr-FR')}</td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
