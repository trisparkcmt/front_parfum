'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Edit2, Plus, Save, X, AlertCircle } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';
import type { CompanyInfo } from '@/types';

const translations = {
  fr: {
    title: 'Infos Entreprise',
    subtitle: 'Gérez les coordonnées, l’adresse et les horaires d’ouverture de la boutique.',
    create: 'Créer un enregistrement',
    edit: 'Modifier',
    save: 'Enregistrer',
    cancel: 'Annuler',
    name: 'Nom de l’entreprise',
    location: 'Localisation',
    mainPhone: 'Téléphone principal',
    secondaryPhone: 'Téléphone secondaire',
    whatsapp: 'WhatsApp',
    facebook: 'Facebook',
    instagram: 'Instagram',
    hours: 'Horaires d’ouverture',
    noData: 'Aucune information disponible. Créez un enregistrement pour commencer.',
    fetchError: 'Impossible de charger les informations de l’entreprise.',
    saveSuccess: 'Informations enregistrées avec succès.',
    saveError: 'Erreur lors de l’enregistrement des informations.',
  },
  en: {
    title: 'Company Info',
    subtitle: 'Manage shop contact details, address and opening hours.',
    create: 'Create record',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    name: 'Company name',
    location: 'Location',
    mainPhone: 'Primary phone',
    secondaryPhone: 'Secondary phone',
    whatsapp: 'WhatsApp',
    facebook: 'Facebook',
    instagram: 'Instagram',
    hours: 'Opening hours',
    noData: 'No company info available. Create a record to get started.',
    fetchError: 'Unable to load company information.',
    saveSuccess: 'Company information saved successfully.',
    saveError: 'Failed to save company information.',
  },
};

const WEEK_DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];

function createDefaultOpeningDays() {
  return WEEK_DAYS.map((jour) => ({
    jour,
    ouvert: jour !== 'Dimanche',
    heure_ouverture: jour !== 'Dimanche' ? '09:00' : null,
    heure_fermeture: jour !== 'Dimanche' ? '18:00' : null,
    note: jour !== 'Dimanche' ? 'Horaires habituels' : 'Fermé',
  }));
}

function groupOpeningDays(days: any[] = [], localeIsEn = false) {
  if (!days.length) return [];

  const normalized = days.map((day, index) => ({
    ...day,
    index,
    label: day.jour,
  }));

  const groups: { start: number; end: number; days: any[]; isOpen: boolean; openingTime: string | null; closingTime: string | null }[] = [];
  let currentGroup = {
    start: 0,
    end: 0,
    days: [normalized[0]],
    isOpen: normalized[0].ouvert,
    openingTime: normalized[0].heure_ouverture ?? null,
    closingTime: normalized[0].heure_fermeture ?? null,
  };

  for (let i = 1; i < normalized.length; i += 1) {
    const current = normalized[i];
    const sameSchedule =
      current.ouvert === currentGroup.isOpen &&
      (current.heure_ouverture ?? null) === currentGroup.openingTime &&
      (current.heure_fermeture ?? null) === currentGroup.closingTime;

    if (sameSchedule && i === currentGroup.end + 1) {
      currentGroup.days.push(current);
      currentGroup.end = i;
      continue;
    }

    groups.push(currentGroup);
    currentGroup = {
      start: i,
      end: i,
      days: [current],
      isOpen: current.ouvert,
      openingTime: current.heure_ouverture ?? null,
      closingTime: current.heure_fermeture ?? null,
    };
  }

  groups.push(currentGroup);

  return groups.map((group) => {
    const labels = group.days.map((day) => day.label);
    const firstLabel = labels[0];
    const lastLabel = labels[labels.length - 1];
    const rangeLabel = labels.length === 1 ? firstLabel : `${firstLabel} – ${lastLabel}`;

    return {
      rangeLabel,
      text: group.isOpen
        ? `${group.openingTime} — ${group.closingTime}`
        : (localeIsEn ? 'Closed' : 'Fermé'),
    };
  });
}

export default function AdminCompanyInfoPage() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const text = useMemo(() => (isEn ? translations.en : translations.fr), [isEn]);

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<Partial<CompanyInfo>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { addToast } = useToastStore();

  const fetchCompanyInfo = async () => {
    setLoading(true);
    try {
      const data = await shopService.getCompanyInfos();
      if (Array.isArray(data) && data.length > 0) {
        setCompanyInfo(data[0]);
      } else {
        setCompanyInfo(null);
      }
    } catch (error) {
      console.error('Company info fetch failed', error);
      addToast(text.fetchError, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const openCreate = () => {
    setFormState({
      nom: '',
      localisation: '',
      telephone_principal: '',
      telephone_secondaire: '',
      whatsapp: '',
      facebook_url: '',
      instagram_url: '',
      jours_ouverture: createDefaultOpeningDays(),
    });
    setFormError(null);
    setIsEditing(false);
    setShowForm(true);
  };

  const openEdit = () => {
    if (!companyInfo) return;
    setFormState({
      nom: companyInfo.nom,
      localisation: companyInfo.localisation || '',
      telephone_principal: companyInfo.telephone_principal,
      telephone_secondaire: companyInfo.telephone_secondaire || '',
      whatsapp: companyInfo.whatsapp || '',
      facebook_url: companyInfo.facebook_url || '',
      instagram_url: companyInfo.instagram_url || '',
      jours_ouverture: companyInfo.jours_ouverture || createDefaultOpeningDays(),
    });
    setFormError(null);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleFieldChange = (field: keyof Partial<CompanyInfo>, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setFormError(null);
    if (!formState.nom || !formState.telephone_principal || !formState.jours_ouverture) {
      setFormError(isEn ? 'Name, primary phone and opening hours are required.' : 'Nom, téléphone principal et horaires sont requis.');
      return;
    }

    try {
      const jours = formState.jours_ouverture.map((day) => {
        if (day.ouvert && (!day.heure_ouverture || !day.heure_fermeture)) {
          throw new Error('Les jours ouverts doivent avoir des heures d ouverture et de fermeture.');
        }
        return {
          jour: day.jour,
          ouvert: day.ouvert,
          heure_ouverture: day.ouvert ? day.heure_ouverture : null,
          heure_fermeture: day.ouvert ? day.heure_fermeture : null,
          note: day.note || '',
        };
      });

      setSaving(true);
      const payload = {
        nom: formState.nom,
        localisation: formState.localisation,
        telephone_principal: formState.telephone_principal,
        telephone_secondaire: formState.telephone_secondaire,
        whatsapp: formState.whatsapp,
        facebook_url: formState.facebook_url,
        instagram_url: formState.instagram_url,
        jours_ouverture: jours,
      };

      if (isEditing && companyInfo) {
        await shopService.updateCompanyInfo(companyInfo.id, payload);
      } else {
        await shopService.createCompanyInfo(payload);
      }

      addToast(text.saveSuccess, 'success');
      setShowForm(false);
      fetchCompanyInfo();
    } catch (error: any) {
      console.error('Company info save failed', error);
      setFormError(error?.message || text.saveError);
    } finally {
      setSaving(false);
    }
  };

  const visibility = showForm ? 'block' : 'hidden';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm shadow-black/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gold/80">{text.title}</p>
            <h1 className="text-3xl font-bold text-foreground">{text.subtitle}</h1>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-gold px-4 py-3 text-sm font-semibold text-black transition hover:bg-gold/90"
          >
            <Plus size={16} />
            {text.create}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-neutral-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {isEn ? 'Loading company information...' : 'Chargement des informations...'}
          </div>
        ) : companyInfo ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4 rounded-3xl border border-white/10 bg-black/[0.03] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">{text.name}</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{companyInfo.nom}</p>
                </div>
                <button
                  type="button"
                  onClick={openEdit}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground transition hover:border-white/20"
                >
                  <Edit2 size={16} />
                  {text.edit}
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">{text.location}</p>
                  <p className="mt-2 text-sm text-foreground">{companyInfo.localisation || '-'}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">{text.mainPhone}</p>
                  <p className="mt-2 text-sm text-foreground">{companyInfo.telephone_principal}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">{text.secondaryPhone}</p>
                  <p className="mt-2 text-sm text-foreground">{companyInfo.telephone_secondaire || '-'}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">{text.whatsapp}</p>
                  <p className="mt-2 text-sm text-foreground">{companyInfo.whatsapp || '-'}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">{text.facebook}</p>
                  <p className="mt-2 text-sm text-foreground">{companyInfo.facebook_url || '-'}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">{text.instagram}</p>
                  <p className="mt-2 text-sm text-foreground">{companyInfo.instagram_url || '-'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-neutral-400">{text.hours}</p>
              <div className="mt-4 space-y-3">
                {groupOpeningDays(companyInfo.jours_ouverture, isEn).map((range, index) => (
                  <div key={`${range.rangeLabel}-${index}`} className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 p-4">
                    <span className="text-sm text-foreground/80">{range.rangeLabel}</span>
                    <span className="text-sm font-semibold text-foreground">
                      {range.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/20 bg-black/5 p-8 text-center text-sm text-neutral-400">
            {text.noData}
          </div>
        )}
      </div>

      <div className={`${visibility} space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6`}> 
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{isEditing ? text.edit : text.create}</h2>
            <p className="text-sm text-neutral-400">{text.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-foreground/60 transition hover:bg-white/5 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400 flex-1">{formError}</p>
            <button
              onClick={() => setFormError(null)}
              className="text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-neutral-300">
            <span>{text.name}</span>
            <input
              value={formState.nom ?? ''}
              onChange={(event) => handleFieldChange('nom', event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold"
            />
          </label>
          <label className="space-y-2 text-sm text-neutral-300">
            <span>{text.location}</span>
            <input
              value={formState.localisation ?? ''}
              onChange={(event) => handleFieldChange('localisation', event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold"
            />
          </label>
          <label className="space-y-2 text-sm text-neutral-300">
            <span>{text.mainPhone}</span>
            <input
              value={formState.telephone_principal ?? ''}
              onChange={(event) => handleFieldChange('telephone_principal', event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold"
            />
          </label>
          <label className="space-y-2 text-sm text-neutral-300">
            <span>{text.secondaryPhone}</span>
            <input
              value={formState.telephone_secondaire ?? ''}
              onChange={(event) => handleFieldChange('telephone_secondaire', event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold"
            />
          </label>
          <label className="space-y-2 text-sm text-neutral-300">
            <span>{text.whatsapp}</span>
            <input
              value={formState.whatsapp ?? ''}
              onChange={(event) => handleFieldChange('whatsapp', event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold"
            />
          </label>
          <label className="space-y-2 text-sm text-neutral-300">
            <span>{text.facebook}</span>
            <input
              value={formState.facebook_url ?? ''}
              onChange={(event) => handleFieldChange('facebook_url', event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold"
            />
          </label>
          <label className="space-y-2 text-sm text-neutral-300 sm:col-span-2">
            <span>{text.instagram}</span>
            <input
              value={formState.instagram_url ?? ''}
              onChange={(event) => handleFieldChange('instagram_url', event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold"
            />
          </label>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{text.hours}</p>
              <p className="text-xs text-neutral-400">{isEn ? 'Configure weekdays and opening times.' : 'Configurez les jours et les horaires d ouverture.'}</p>
            </div>
          </div>
          <div className="space-y-3">
            {(formState.jours_ouverture || createDefaultOpeningDays()).map((day, index) => (
              <div key={day.jour} className="grid gap-3 rounded-2xl border border-white/10 bg-black/5 p-3 md:grid-cols-[1fr_88px_100px_100px_1fr] items-center">
                <div>
                  <p className="font-semibold text-foreground">{day.jour}</p>
                </div>
                <label className="flex items-center gap-2 text-xs text-neutral-400">
                  <input
                    type="checkbox"
                    checked={day.ouvert}
                    onChange={(event) => {
                      const updated = (formState.jours_ouverture || createDefaultOpeningDays()).map((item, idx) =>
                        idx === index
                          ? {
                              ...item,
                              ouvert: event.target.checked,
                              heure_ouverture: event.target.checked ? item.heure_ouverture || '09:00' : null,
                              heure_fermeture: event.target.checked ? item.heure_fermeture || '18:00' : null,
                              note: event.target.checked ? item.note || 'Horaires habituels' : 'Fermé',
                            }
                          : item
                      );
                      setFormState((prev) => ({ ...prev, jours_ouverture: updated }));
                    }}
                    className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                  />
                  {isEn ? 'Open' : 'Ouvert'}
                </label>
                <input
                  type="time"
                  value={day.heure_ouverture ?? ''}
                  onChange={(event) => {
                    const updated = (formState.jours_ouverture || createDefaultOpeningDays()).map((item, idx) =>
                      idx === index
                        ? { ...item, heure_ouverture: event.target.value }
                        : item
                    );
                    setFormState((prev) => ({ ...prev, jours_ouverture: updated }));
                  }}
                  disabled={!day.ouvert}
                  className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
                <input
                  type="time"
                  value={day.heure_fermeture ?? ''}
                  onChange={(event) => {
                    const updated = (formState.jours_ouverture || createDefaultOpeningDays()).map((item, idx) =>
                      idx === index
                        ? { ...item, heure_fermeture: event.target.value }
                        : item
                    );
                    setFormState((prev) => ({ ...prev, jours_ouverture: updated }));
                  }}
                  disabled={!day.ouvert}
                  className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
                <input
                  type="text"
                  value={day.note ?? ''}
                  onChange={(event) => {
                    const updated = (formState.jours_ouverture || createDefaultOpeningDays()).map((item, idx) =>
                      idx === index ? { ...item, note: event.target.value } : item
                    );
                    setFormState((prev) => ({ ...prev, jours_ouverture: updated }));
                  }}
                  placeholder={isEn ? 'Note' : 'Note'}
                  className="w-full rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            disabled={saving}
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-neutral-300 transition hover:border-white/20 disabled:opacity-50"
          >
            {text.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gold px-4 py-3 text-sm font-semibold text-black transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save size={16} />
            {saving ? (isEn ? 'Saving...' : 'Enregistrement...') : text.save}
          </button>
        </div>
      </div>
    </div>
  );
}
