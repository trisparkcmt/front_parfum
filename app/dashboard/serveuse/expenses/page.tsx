'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Search, RefreshCw, Trash2, Edit2 } from 'lucide-react';
import { api } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
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
      addToast('Erreur lors du chargement des dépenses', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, dateFilter, addToast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      titre: '',
      description: '',
      montant: '',
      date_depense: new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (exp: Expense) => {
    setEditing(exp);
    setForm({
      titre: exp.titre,
      description: exp.description || '',
      montant: String(Number(exp.montant)),
      date_depense: exp.date_depense,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.titre || !form.montant) {
      setFormError('Le titre et le montant sont requis');
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
      if (editing) {
        await api.patch(`utilisateur/depenses/${editing.id}/`, payload);
        addToast('Dépense mise à jour', 'success');
      } else {
        await api.post('utilisateur/depenses/', payload);
        addToast('Dépense enregistrée', 'success');
      }
      setShowModal(false);
      fetchExpenses();
    } catch (err: any) {
      setFormError(err.response?.data ? JSON.stringify(err.response.data) : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous supprimer cette dépense ?')) return;
    try {
      await api.delete(`utilisateur/depenses/${id}/`);
      addToast('Dépense supprimée', 'success');
      fetchExpenses();
    } catch {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dépenses Journalières</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Enregistrez vos dépenses quotidiennes de la boutique</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchExpenses()}
            className="flex items-center gap-2 border border-white/10 px-4 py-2.5 rounded-xl text-sm text-foreground/60 hover:bg-white/5"
          >
            <RefreshCw size={15} />
            Actualiser
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80"
          >
            <Plus size={16} /> Enregistrer une dépense
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex-1 min-w-[200px]">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre"
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
            <p className="text-sm">Chargement des dépenses</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-20 text-foreground/40 italic">
            Aucune dépense enregistrée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {['Titre', 'Description', 'Montant', 'Date de la Dépense', 'Créé le', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-white/5">
                    <td className="px-5 py-4 font-medium text-foreground">{exp.titre}</td>
                    <td className="px-5 py-4 text-foreground/60">{exp.description || '—'}</td>
                    <td className="px-5 py-4 font-bold text-red-400">{Number(exp.montant).toLocaleString()} FCFA</td>
                    <td className="px-5 py-4 text-foreground/60">{new Date(exp.date_depense).toLocaleDateString('fr-FR')}</td>
                    <td className="px-5 py-4 text-[11px] text-foreground/40">{new Date(exp.date_creation).toLocaleString('fr-FR')}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg hover:bg-white/10 text-foreground/40 hover:text-gold">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
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
            <h3 className="font-bold text-lg">{editing ? 'Modifier' : 'Nouveau'} Enregistrement de Dépense</h3>
            <FloatInput
              label="Titre / Objet *"
              placeholder="Ex: Achat café, recharge gaz"
              value={form.titre}
              onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
            />
            <div>
              <label className="text-[10px] font-bold text-gold uppercase block mb-1">Description (optionnel)</label>
              <textarea
                placeholder="Détails supplémentaires"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold h-20 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FloatInput
                type="number"
                label="Montant (FCFA) *"
                placeholder="Montant"
                value={form.montant}
                onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
              />
              <FloatInput
                type="date"
                label="Date de la Dépense *"
                placeholder="Date"
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
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gold text-black rounded-xl py-2.5 text-sm font-bold disabled:opacity-50"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
