'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Loader2, Search, RefreshCw, Trash2, User, Filter, X, Receipt, Calendar, CalendarClock, ChevronRight } from 'lucide-react';
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

function cx(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

function IconButton({
  icon: Icon,
  onClick,
  title,
  tint = 'neutral',
}: {
  icon: any;
  onClick?: (e: React.MouseEvent) => void;
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
      className={cx('rounded-md p-1.5 text-foreground/45 transition-colors', tintStyles[tint])}
    >
      <Icon size={15} />
    </button>
  );
}

/* ─── Expense Detail Modal ─────────────────────────────────────────── */
function ExpenseDetailModal({
  expense,
  onClose,
  onDelete,
}: {
  expense: Expense | null;
  onClose: () => void;
  onDelete: (id: number) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expense) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [expense, onClose]);

  if (!expense) return null;

  const serveuseNom = expense.cree_par_details
    ? `${expense.cree_par_details.first_name || ''} ${expense.cree_par_details.last_name || ''}`.trim() || expense.cree_par_details.email
    : `Serveuse #${expense.cree_par}`;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-lg bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <Receipt size={16} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground leading-tight">{expense.titre}</h3>
              <p className="text-[11px] text-foreground/40 mt-0.5">Dépense #{expense.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-foreground/40 hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Amount — prominent */}
          <div className="rounded-xl bg-red-500/5 border border-red-500/10 px-5 py-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/35 mb-1">Montant</p>
            <p className="text-2xl font-bold text-red-400 tabular-nums">
              {Number(expense.montant).toLocaleString()} <span className="text-base font-medium">FCFA</span>
            </p>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-2">Description</p>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap min-h-[60px]">
              {expense.description || <span className="text-foreground/30 italic">Aucune description fournie.</span>}
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.08] px-4 py-3 flex items-start gap-3">
              <User size={14} className="text-foreground/35 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-0.5">Déclaré par</p>
                <p className="text-sm font-medium text-foreground truncate">{serveuseNom}</p>
                {expense.cree_par_details?.email && (
                  <p className="text-[11px] text-foreground/40 truncate">{expense.cree_par_details.email}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.02] border border-white/[0.08] px-4 py-3 flex items-start gap-3">
              <Calendar size={14} className="text-foreground/35 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-0.5">Date de la dépense</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(expense.date_depense).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.02] border border-white/[0.08] px-4 py-3 flex items-start gap-3 sm:col-span-2">
              <CalendarClock size={14} className="text-foreground/35 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-0.5">Créé le</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(expense.date_creation).toLocaleString('fr-FR', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={() => { onDelete(expense.id); onClose(); }}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors"
          >
            <Trash2 size={13} />
            Supprimer
          </button>
          <button
            onClick={onClose}
            className="rounded-lg px-5 py-2 text-xs font-semibold bg-white/[0.06] border border-white/10 text-foreground/70 hover:bg-white/10 hover:text-foreground transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────── */
export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
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
      addToast('Dépense supprimée de l\u2019historique', 'success');
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

      {/* KPI Strip */}
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

      {/* Toolbar */}
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

      {/* Clickable hint */}
      {!loading && expenses.length > 0 && (
        <p className="text-[11px] text-foreground/30 flex items-center gap-1">
          <ChevronRight size={11} />
          Cliquez sur une ligne pour voir les détails complets de la dépense.
        </p>
      )}

      {/* Table */}
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
                    <tr
                      key={exp.id}
                      onClick={() => setSelectedExpense(exp)}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="pl-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <User size={13} className="text-foreground/40 shrink-0" />
                          <span>{serveuseNom}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium text-foreground group-hover:text-gold transition-colors">
                        {exp.titre}
                      </td>
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
                            onClick={(e) => { e.stopPropagation(); handleDelete(exp.id); }}
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

      {/* Detail Modal */}
      <ExpenseDetailModal
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}