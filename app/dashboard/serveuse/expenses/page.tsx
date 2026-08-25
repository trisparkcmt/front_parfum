'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Search, RefreshCw, X } from 'lucide-react';
import { api } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';
import { FloatInput } from '@/components/ui/Input';

interface Expense {
  id: number;
  titre: string;
  description: string;
  montant: string;
  date_depense: string;
  date_creation: string;
}

export default function ServeuseExpensesPage() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const { addToast } = useToastStore();

  const [form, setForm] = useState({
    titre: '',
    description: '',
    montant: '',
    date_depense: new Date().toISOString().split('T')[0],
  });

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (dateFilter) params.date_depense = dateFilter;
      const res = await api.get('utilisateur/depenses/', { params });
      const data = res.data;
      setExpenses(data.results ?? data.resultats ?? (Array.isArray(data) ? data : []));
    } catch {
      addToast(t('expenses_load_error', { defaultValue: 'Erreur lors du chargement des dépenses' }), 'error');
    } finally {
      setLoading(false);
    }
  }, [search, dateFilter, addToast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const openAdd = () => {
    setForm({
      titre: '',
      description: '',
      montant: '',
      date_depense: new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.titre || !form.montant) {
      setFormError(t('expense_required', { defaultValue: 'Le titre et le montant sont requis' }));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        titre: form.titre,
        description: form.description,
        montant: parseFloat(form.montant).toFixed(2),
        date_depense: form.date_depense,
      };
      await api.post('utilisateur/depenses/', payload);
      addToast(t('expense_saved', { defaultValue: 'Dépense enregistrée' }), 'success');
      setShowModal(false);
      fetchExpenses();
    } catch (err: any) {
      setFormError(err.response?.data ? JSON.stringify(err.response.data) : t('expense_save_error', { defaultValue: 'Erreur lors de la sauvegarde' }));
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('daily_expenses', { defaultValue: 'Dépenses Journalières' })}</h1>
          <p className="text-sm text-foreground/40 mt-0.5">{t('daily_expenses_desc', { defaultValue: 'Enregistrez vos dépenses quotidiennes de la boutique' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchExpenses()}
            className="flex items-center gap-2 border border-white/10 px-4 py-2.5 rounded-xl text-sm text-foreground/60 hover:bg-white/5"
          >
            <RefreshCw size={15} />
            {t('refresh', { defaultValue: 'Actualiser' })}
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80"
          >
            <Plus size={16} /> {t('record_expense', { defaultValue: 'Enregistrer une dépense' })}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex-1 min-w-[200px]">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_by_title', { defaultValue: 'Rechercher par titre' })}
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
            <p className="text-sm">{t('loading_expenses', { defaultValue: 'Chargement des dépenses' })}</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-20 text-foreground/40 italic">
            {t('no_expenses', { defaultValue: 'Aucune dépense enregistrée.' })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {[t('title', { defaultValue: 'Titre' }), t('description', { defaultValue: 'Description' }), t('amount', { defaultValue: 'Montant' }), t('expense_date', { defaultValue: 'Date de la Dépense' }), t('created_at', { defaultValue: 'Créé le' }), ''].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-white/5">
                    <td className="px-5 py-4 font-medium text-foreground">{exp.titre}</td>
                    <td className="px-5 py-4 max-w-[240px] truncate text-foreground/60">{exp.description || '—'}</td>
                    <td className="px-5 py-4 font-bold text-red-400">{Number(exp.montant).toLocaleString()} FCFA</td>
                    <td className="px-5 py-4 text-foreground/60">{new Date(exp.date_depense).toLocaleDateString('fr-FR')}</td>
                    <td className="px-5 py-4 text-[11px] text-foreground/40">{new Date(exp.date_creation).toLocaleString('fr-FR')}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => setSelectedExpense(exp)} className="text-xs text-gold hover:underline">{t('details', { defaultValue: 'Détails' })}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl w-full max-w-md border border-white/10 p-6 space-y-4">
            <h3 className="font-bold text-lg">{t('new_expense', { defaultValue: 'Nouvel enregistrement de dépense' })}</h3>
            <FloatInput
              label={t('expense_title', { defaultValue: 'Titre / Objet *' })}
              placeholder={t('expense_title_placeholder', { defaultValue: 'Ex: Achat café, recharge gaz' })}
              value={form.titre}
              onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
            />
            <div>
              <label className="text-[10px] font-bold text-gold uppercase block mb-1">{t('description_optional', { defaultValue: 'Description (optionnel)' })}</label>
              <textarea
                placeholder={t('additional_details', { defaultValue: 'Détails supplémentaires' })}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold h-20 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FloatInput
                type="number"
                label={t('amount_fcfa_required', { defaultValue: 'Montant (FCFA) *' })}
                placeholder={t('amount', { defaultValue: 'Montant' })}
                value={form.montant}
                onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
              />
              <FloatInput
                type="date"
                label={t('expense_date_required', { defaultValue: 'Date de la Dépense *' })}
                placeholder={t('date', { defaultValue: 'Date' })}
                value={form.date_depense}
                onChange={(e) => setForm((f) => ({ ...f, date_depense: e.target.value }))}
              />
            </div>

            {formError && (
              <p className="text-sm font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl text-center">
                {formError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm">
                {t('cancel', { defaultValue: 'Annuler' })}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gold text-black rounded-xl py-2.5 text-sm font-bold disabled:opacity-50"
              >
                {saving ? t('saving', { defaultValue: 'Enregistrement…' }) : t('save', { defaultValue: 'Enregistrer' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedExpense && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedExpense(null)}>
          <div className="bg-background rounded-2xl w-full max-w-md border border-white/10 p-6 space-y-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-gold">{t('expense', { defaultValue: 'Dépense' })} #{selectedExpense.id}</p>
                <h3 className="font-bold text-lg mt-1">{selectedExpense.titre}</h3>
              </div>
              <button onClick={() => setSelectedExpense(null)} aria-label={t('close', { defaultValue: 'Fermer' })} className="p-1.5 text-foreground/50 hover:text-foreground"><X size={18} /></button>
            </div>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{selectedExpense.description || t('no_description', { defaultValue: 'Aucune description fournie.' })}</p>
            <div className="flex justify-between border-t border-white/10 pt-3 text-sm">
              <span className="text-foreground/50">{t('amount', { defaultValue: 'Montant' })}</span>
              <strong className="text-red-400">{Number(selectedExpense.montant).toLocaleString()} FCFA</strong>
            </div>
            <button onClick={() => setSelectedExpense(null)} className="w-full border border-white/10 rounded-xl py-2.5 text-sm">{t('close', { defaultValue: 'Fermer' })}</button>
          </div>
        </div>
      )}
    </div>
  );
}
