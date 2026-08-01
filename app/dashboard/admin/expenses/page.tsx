'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Search, RefreshCw, Trash2, User, Filter, X } from 'lucide-react';
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

// Helper utility for conditional classes
function cx(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// Reusable Icon-only Action Button primitive
function IconButton({
  icon: Icon,
  onClick,
  title,
  tint = 'neutral',
}: {
  icon: any;
  onClick?: () => void;
  title?: string;
  tint?: 'gold' | 'red' | 'blue' | 'neutral';
}) {
  const tintStyles = {
    gold: 'hover:text-gold hover:bg-gold/10',
    red: 'hover:text-red-400 hover:bg-red-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
    neutral: 'hover:text-foreground hover:bg-white/10',
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={cx(
        'rounded-md p-1.5 text-foreground/45 transition-colors',
        tintStyles[tint]
      )}
    >
      <Icon size={15} />
    </button>
  );
}

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (dateFilter) count++;
    return count;
  }, [dateFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Gestion des Dépenses</h1>
          <p className="text-sm text-foreground/40 mt-0.5">
            Historique complet des dépenses quotidiennes déclarées par les serveuses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchExpenses()}
            className="border border-white/10 text-foreground/60 hover:bg-white/5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* KPI Bordered Strip */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
        <div className="p-4 flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Total Dépenses Enregistrées</span>
          <span className="text-xl font-semibold tabular-nums text-foreground mt-1">{expenses.length}</span>
        </div>

        <div className="p-4 flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Montant Cumulé</span>
          <span className="text-xl font-semibold tabular-nums text-gold mt-1">
            {totalAmount.toLocaleString()} FCFA
          </span>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre ou serveuse…"
              className="w-full bg-white/[0.02] border border-white/10 rounded-lg pl-9 pr-8 py-1.5 text-xs text-foreground placeholder:text-foreground/40 outline-none focus:border-white/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cx(
              'flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium transition-colors',
              showFilters || activeFiltersCount > 0 ? 'bg-white/10 text-foreground' : 'text-foreground/60 hover:bg-white/5'
            )}
          >
            <Filter size={13} />
            <span>Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="ml-0.5 rounded-full bg-gold px-1.5 py-0.2 text-[10px] font-bold text-black">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/50">Date dépense:</span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-foreground outline-none focus:border-gold/50"
              />
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[11px] text-foreground/40 hover:text-foreground underline ml-auto"
              >
                Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-foreground/40 gap-2 text-xs">
            <Loader2 className="animate-spin text-gold" size={16} />
            <span>Chargement des dépenses globales…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                  <th className="pl-4 py-3">Déclaré par (Serveuse)</th>
                  <th className="px-3 py-3">Titre</th>
                  <th className="px-3 py-3">Description</th>
                  <th className="px-3 py-3">Montant</th>
                  <th className="px-3 py-3">Date Dépense</th>
                  <th className="px-3 py-3">Créé le</th>
                  <th className="pr-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {expenses.map((exp) => {
                  const serveuseNom = exp.cree_par_details
                    ? `${exp.cree_par_details.first_name || ''} ${exp.cree_par_details.last_name || ''}`.trim() || exp.cree_par_details.email
                    : `Serveuse #${exp.cree_par}`;
                  return (
                    <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="pl-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <User size={13} className="text-foreground/40 shrink-0" />
                          <span>{serveuseNom}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium text-foreground">{exp.titre}</td>
                      <td className="px-3 py-3 text-foreground/60 max-w-xs truncate">{exp.description || '—'}</td>
                      <td className="px-3 py-3 font-semibold text-red-400 tabular-nums">
                        {Number(exp.montant).toLocaleString()} FCFA
                      </td>
                      <td className="px-3 py-3 text-foreground/60 tabular-nums">
                        {new Date(exp.date_depense).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-3 py-3 text-[11px] text-foreground/40 tabular-nums">
                        {new Date(exp.date_creation).toLocaleString('fr-FR')}
                      </td>
                      <td className="pr-4 py-3 text-right">
                        <div className="flex items-center justify-end">
                          <IconButton
                            icon={Trash2}
                            onClick={() => handleDelete(exp.id)}
                            title="Supprimer la dépense"
                            tint="red"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm italic text-foreground/30">
                      Aucune dépense trouvée dans le système.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}