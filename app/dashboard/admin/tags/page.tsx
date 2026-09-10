'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Search, Edit2, Trash2, Tag as TagIcon, X } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import type { TagDefinition } from '@/types';

const T = {
  fr: {
    title: 'Types de tags',
    subtitle: 'Gestion des catégories de tags dynamiques pour parfums, essences et accessoires.',
    search_placeholder: 'Rechercher un tag…',
    add: 'Ajouter un tag',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    loading: 'Chargement des tags…',
    no_results: 'Aucun tag trouvé.',
    col_name: 'Nom',
    col_slug: 'Slug',
    col_actions: 'Actions',
    create_title: 'Nouveau type de tag',
    edit_title: 'Modifier le type de tag',
    field_name: 'Nom du type',
    field_required: 'Le nom est requis.',
    confirm_delete: 'Supprimer ce type de tag ?',
    toast_load_error: 'Erreur lors du chargement des tags',
    toast_create_ok: 'Type de tag créé',
    toast_create_error: 'Erreur lors de la création du type de tag',
    toast_update_ok: 'Type de tag mis à jour',
    toast_update_error: 'Erreur lors de la mise à jour',
    toast_delete_ok: 'Type de tag supprimé',
    toast_delete_error: 'Erreur lors de la suppression',
  },
  en: {
    title: 'Tag types',
    subtitle: 'Manage dynamic tag categories for perfumes, essences and accessories.',
    search_placeholder: 'Search for a tag…',
    add: 'Add tag',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading tags…',
    no_results: 'No tags found.',
    col_name: 'Name',
    col_slug: 'Slug',
    col_actions: 'Actions',
    create_title: 'New tag type',
    edit_title: 'Edit tag type',
    field_name: 'Type name',
    field_required: 'Name is required.',
    confirm_delete: 'Delete this tag type?',
    toast_load_error: 'Error loading tags',
    toast_create_ok: 'Tag type created',
    toast_create_error: 'Error creating tag type',
    toast_update_ok: 'Tag type updated',
    toast_update_error: 'Error updating tag type',
    toast_delete_ok: 'Tag type deleted',
    toast_delete_error: 'Error deleting tag type',
  },
} as const;

const inputClassName =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/35 focus:border-gold/60 focus:bg-white/[0.05]';

export default function AdminTagsPage() {
  const { addToast } = useToastStore();
  const { i18n } = useTranslation();
  const locale = i18n.language?.startsWith('en') ? 'en' : 'fr';
  const text = T[locale];

  const [tags, setTags] = useState<TagDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTag, setEditingTag] = useState<TagDefinition | null>(null);
  const [formName, setFormName] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      const data = await shopService.getTags();
      setTags(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      console.error('loadTags error:', error);
      addToast(text.toast_load_error, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, text.toast_load_error]);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  const filteredTags = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tags;

    return tags.filter((tag) => {
      return (
        tag.nom.toLowerCase().includes(query) ||
        tag.slug.toLowerCase().includes(query)
      );
    });
  }, [search, tags]);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingTag(null);
    setFormName('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (tag: TagDefinition) => {
    setIsEditing(true);
    setEditingTag(tag);
    setFormName(tag.nom);
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingTag(null);
    setFormName('');
    setFormError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError(text.field_required);
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (isEditing && editingTag) {
        await shopService.updateTag(editingTag.slug, { nom: trimmedName });
        addToast(text.toast_update_ok, 'success');
      } else {
        await shopService.createTag({ nom: trimmedName });
        addToast(text.toast_create_ok, 'success');
      }

      closeModal();
      await loadTags();
    } catch (error: any) {
      const msg =
        error?.response?.data?.nom?.[0] ||
        error?.response?.data?.detail ||
        (isEditing ? text.toast_update_error : text.toast_create_error);
      setFormError(msg);
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tag: TagDefinition) => {
    const confirmed = window.confirm(`${text.confirm_delete} (${tag.nom})`);
    if (!confirmed) return;

    try {
      await shopService.deleteTag(tag.slug);
      addToast(text.toast_delete_ok, 'success');
      await loadTags();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || text.toast_delete_error;
      addToast(msg, 'error');
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/80">Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">{text.title}</h1>
          <p className="mt-1 text-sm text-foreground/60">{text.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gold/90"
        >
          <Plus size={16} />
          {text.add}
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={text.search_placeholder}
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-gold/60"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-background/80">
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center gap-3 text-foreground/60">
            <Loader2 className="h-5 w-5 animate-spin" />
            {text.loading}
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center text-center text-foreground/60">
            <div className="space-y-3">
              <TagIcon className="mx-auto h-8 w-8 text-foreground/30" />
              <p>{text.no_results}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/45">
                <tr>
                  <th className="px-4 py-3">{text.col_name}</th>
                  <th className="px-4 py-3">{text.col_slug}</th>
                  <th className="px-4 py-3 text-right">{text.col_actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTags.map((tag) => (
                  <tr key={tag.id} className="border-b border-white/10 last:border-b-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-foreground">{tag.nom}</td>
                    <td className="px-4 py-3 text-foreground/60">{tag.slug}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(tag)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-foreground hover:border-gold/50 hover:text-gold"
                        >
                          <Edit2 size={14} />
                          {text.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tag)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 size={14} />
                          {text.delete}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-foreground">{isEditing ? text.edit_title : text.create_title}</h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-white/10 p-2 text-foreground/50 hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/45">
                  {text.field_name}
                </label>
                <input
                  value={formName}
                  onChange={(event) => {
                    setFormName(event.target.value);
                    if (formError) setFormError('');
                  }}
                  className={inputClassName}
                  placeholder={text.field_name}
                />
                {formError && <p className="text-xs text-red-400">{formError}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-foreground/80 hover:bg-white/[0.06]"
                >
                  {text.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? text.loading : text.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
