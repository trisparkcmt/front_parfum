'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Edit2,
  Save,
  X,
  AlertCircle,
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  Clock,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { shopService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';
import type { CompanyInfo } from '@/types';
import { normalizeCameroonPhone, normalizeSocialProfileUrl } from '@/lib/utils';

const translations = {
  fr: {
    title: 'Infos Entreprise',
    subtitle: 'Gérez les coordonnées, l’adresse et les horaires d’ouverture de la boutique.',
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
    noData: 'Aucune information disponible pour le moment.',
    noDataHint: 'Contactez votre développeur si cet enregistrement devrait déjà exister.',
    fetchError: 'Impossible de charger les informations de l’entreprise.',
    saveSuccess: 'Informations enregistrées avec succès.',
    saveError: 'Erreur lors de l’enregistrement des informations.',
    openNow: 'Ouvert maintenant',
    closedNow: 'Fermé maintenant',
    editTitle: 'Modifier les informations',
    editSubtitle: 'Ces informations sont visibles publiquement sur la boutique.',
    sectionContact: 'Coordonnées',
    sectionSocial: 'Réseaux sociaux',
    sectionHours: 'Jours et horaires',
    applyToAll: 'Appliquer ces horaires à tous les jours ouverts',
    open: 'Ouvert',
    closed: 'Fermé',
    note: 'Note',
    copied: 'Copié',
    notSet: 'Non renseigné',
    requiredHint: 'Champ requis',
    hoursRequiredError: 'Les jours ouverts doivent avoir une heure d’ouverture et de fermeture.',
    requiredFieldsError: 'Le nom, le téléphone principal et les horaires sont requis.',
    whatsappLengthError: 'Le numéro WhatsApp doit contenir 9 chiffres.',
  },
  en: {
    title: 'Company Info',
    subtitle: 'Manage shop contact details, address and opening hours.',
    edit: 'Edit',
    save: 'Save changes',
    cancel: 'Cancel',
    name: 'Company name',
    location: 'Location',
    mainPhone: 'Primary phone',
    secondaryPhone: 'Secondary phone',
    whatsapp: 'WhatsApp',
    facebook: 'Facebook',
    instagram: 'Instagram',
    hours: 'Opening hours',
    noData: 'No company information available yet.',
    noDataHint: 'Contact your developer if this record should already exist.',
    fetchError: 'Unable to load company information.',
    saveSuccess: 'Company information saved successfully.',
    saveError: 'Failed to save company information.',
    openNow: 'Open now',
    closedNow: 'Closed now',
    editTitle: 'Edit company information',
    editSubtitle: 'This information is publicly visible on the shop.',
    sectionContact: 'Contact details',
    sectionSocial: 'Social profiles',
    sectionHours: 'Days and hours',
    applyToAll: 'Apply these hours to every open day',
    open: 'Open',
    closed: 'Closed',
    note: 'Note',
    copied: 'Copied',
    notSet: 'Not set',
    requiredHint: 'Required',
    hoursRequiredError: 'Open days must have an opening and closing time.',
    requiredFieldsError: 'Name, primary phone and opening hours are required.',
    whatsappLengthError: 'WhatsApp number must contain 9 digits.',
  },
};

const WEEK_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// Maps JS Date.getDay() (0 = Sunday) to an index in WEEK_DAYS (0 = Monday)
const JS_DAY_TO_WEEK_INDEX = [6, 0, 1, 2, 3, 4, 5];

type OpeningDay = {
  jour: string;
  ouvert: boolean;
  heure_ouverture: string | null;
  heure_fermeture: string | null;
  note: string;
};

function createDefaultOpeningDays(): OpeningDay[] {
  return WEEK_DAYS.map((jour) => ({
    jour,
    ouvert: jour !== 'Dimanche',
    heure_ouverture: jour !== 'Dimanche' ? '09:00' : null,
    heure_fermeture: jour !== 'Dimanche' ? '18:00' : null,
    note: jour !== 'Dimanche' ? 'Horaires habituels' : 'Fermé',
  }));
}

function groupOpeningDays(days: OpeningDay[] = [], localeIsEn = false) {
  if (!days.length) return [];

  const normalized = days.map((day, index) => ({ ...day, index, label: day.jour }));

  const groups: {
    start: number;
    end: number;
    days: typeof normalized;
    isOpen: boolean;
    openingTime: string | null;
    closingTime: string | null;
  }[] = [];

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
    const isToday = group.days.some((day) => day.index === JS_DAY_TO_WEEK_INDEX[new Date().getDay()]);

    return {
      rangeLabel,
      isToday,
      text: group.isOpen ? `${group.openingTime} — ${group.closingTime}` : localeIsEn ? 'Closed' : 'Fermé',
    };
  });
}

function isOpenNow(days: OpeningDay[] = []) {
  if (!days.length) return null;
  const todayIndex = JS_DAY_TO_WEEK_INDEX[new Date().getDay()];
  const today = days[todayIndex];
  if (!today || !today.ouvert || !today.heure_ouverture || !today.heure_fermeture) return false;

  const now = new Date();
  const [openH, openM] = today.heure_ouverture.split(':').map(Number);
  const [closeH, closeM] = today.heure_fermeture.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

function InfoRow({
  icon,
  label,
  value,
  href,
  emptyLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  href?: string | null;
  emptyLabel: string;
}) {
  const hasValue = Boolean(value);
  const content = (
    <p className={`mt-1 truncate text-sm font-medium ${hasValue ? 'text-foreground' : 'text-neutral-500 italic'}`}>
      {hasValue ? value : emptyLabel}
    </p>
  );

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 transition hover:bg-white/[0.07]">
      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-neutral-400">{label}</p>
        {hasValue && href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-1 truncate text-sm font-medium text-foreground hover:text-gold"
          >
            <span className="truncate">{value}</span>
            <ExternalLink size={12} className="flex-shrink-0 opacity-60" />
          </a>
        ) : (
          content
        )}
      </div>
    </div>
  );
}

export default function AdminCompanyInfoPage() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const text = useMemo(() => (isEn ? translations.en : translations.fr), [isEn]);

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<Partial<CompanyInfo>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { addToast } = useToastStore();

  const fetchCompanyInfo = async () => {
    setLoading(true);
    try {
      const data = await shopService.getCompanyInfos();
      setCompanyInfo(Array.isArray(data) && data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error('Company info fetch failed', error);
      addToast(text.fetchError, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the edit modal on Escape
  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) setIsModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen, saving]);

  const openEdit = () => {
    if (!companyInfo) return;
    setFormState({
      nom: companyInfo.nom,
      localisation: companyInfo.localisation || '',
      telephone_principal: companyInfo.telephone_principal,
      telephone_secondaire: companyInfo.telephone_secondaire || '',
      whatsapp: normalizeCameroonPhone(companyInfo.whatsapp),
      facebook_url: companyInfo.facebook_url || '',
      instagram_url: companyInfo.instagram_url || '',
      jours_ouverture: companyInfo.jours_ouverture?.length ? companyInfo.jours_ouverture : createDefaultOpeningDays(),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFieldChange = (field: keyof Partial<CompanyInfo>, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const updateDay = (index: number, patch: Partial<OpeningDay>) => {
    const currentDays = (formState.jours_ouverture as OpeningDay[]) || createDefaultOpeningDays();
    const updated = currentDays.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
    setFormState((prev) => ({ ...prev, jours_ouverture: updated }));
  };

  const applyFirstDayToAll = () => {
    const currentDays = (formState.jours_ouverture as OpeningDay[]) || createDefaultOpeningDays();
    const reference = currentDays.find((day) => day.ouvert);
    if (!reference) return;
    const updated = currentDays.map((day) =>
      day.ouvert
        ? { ...day, heure_ouverture: reference.heure_ouverture, heure_fermeture: reference.heure_fermeture }
        : day
    );
    setFormState((prev) => ({ ...prev, jours_ouverture: updated }));
  };

  const handleCopy = async (field: string, value?: string | null) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1500);
    } catch {
      // clipboard may be unavailable — silently ignore
    }
  };

  const handleSave = async () => {
    setFormError(null);
    if (!companyInfo) return;

    if (!formState.nom || !formState.telephone_principal || !formState.jours_ouverture) {
      setFormError(text.requiredFieldsError);
      return;
    }

    try {
      const jours = (formState.jours_ouverture as OpeningDay[]).map((day) => {
        if (day.ouvert && (!day.heure_ouverture || !day.heure_fermeture)) {
          throw new Error(text.hoursRequiredError);
        }
        return {
          jour: day.jour,
          ouvert: day.ouvert,
          heure_ouverture: day.ouvert ? day.heure_ouverture : null,
          heure_fermeture: day.ouvert ? day.heure_fermeture : null,
          note: day.note || '',
        };
      });

      const whatsapp = normalizeCameroonPhone(formState.whatsapp);
      const facebookUrl = normalizeSocialProfileUrl('facebook', formState.facebook_url);
      const instagramUrl = normalizeSocialProfileUrl('instagram', formState.instagram_url);

      if (whatsapp && whatsapp.length !== 9) {
        setFormError(text.whatsappLengthError);
        return;
      }

      setSaving(true);
      const payload = {
        nom: formState.nom,
        localisation: formState.localisation,
        telephone_principal: formState.telephone_principal,
        telephone_secondaire: formState.telephone_secondaire,
        whatsapp,
        facebook_url: facebookUrl,
        instagram_url: instagramUrl,
        jours_ouverture: jours,
      };

      await shopService.updateCompanyInfo(companyInfo.id, payload);

      addToast(text.saveSuccess, 'success');
      await fetchCompanyInfo();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Company info save failed', error);
      setFormError(error?.message || text.saveError);
    } finally {
      setSaving(false);
    }
  };

  const openNow = companyInfo ? isOpenNow(companyInfo.jours_ouverture as OpeningDay[]) : null;
  const days = (formState.jours_ouverture as OpeningDay[]) || createDefaultOpeningDays();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm shadow-black/5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gold/80">{text.title}</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">{text.subtitle}</h1>
        </div>
        {companyInfo && !loading && (
          <button
            type="button"
            onClick={openEdit}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gold px-4 py-3 text-sm font-semibold text-black transition hover:bg-gold/90 active:scale-[0.98]"
          >
            <Edit2 size={16} />
            {text.edit}
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="h-5 w-1/3 animate-pulse rounded bg-white/10" />
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((key) => (
                <div key={key} className="h-16 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="h-5 w-1/2 animate-pulse rounded bg-white/10" />
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((key) => (
                <div key={key} className="h-12 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state — no record exists; admin can only edit, not create */}
      {!loading && !companyInfo && (
        <div className="rounded-3xl border border-dashed border-white/20 bg-black/5 p-10 text-center">
          <p className="text-sm font-medium text-foreground">{text.noData}</p>
          <p className="mt-1 text-sm text-neutral-500">{text.noDataHint}</p>
        </div>
      )}

      {/* Content */}
      {!loading && companyInfo && (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div>
              <p className="text-[11px] font-medium text-neutral-400">{text.name}</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{companyInfo.nom}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow
                icon={<MapPin size={16} />}
                label={text.location}
                value={companyInfo.localisation}
                emptyLabel={text.notSet}
              />
              <InfoRow
                icon={<Phone size={16} />}
                label={text.mainPhone}
                value={companyInfo.telephone_principal}
                href={companyInfo.telephone_principal ? `tel:${companyInfo.telephone_principal}` : undefined}
                emptyLabel={text.notSet}
              />
              <InfoRow
                icon={<Phone size={16} />}
                label={text.secondaryPhone}
                value={companyInfo.telephone_secondaire}
                href={companyInfo.telephone_secondaire ? `tel:${companyInfo.telephone_secondaire}` : undefined}
                emptyLabel={text.notSet}
              />
              <InfoRow
                icon={<MessageCircle size={16} />}
                label={text.whatsapp}
                value={companyInfo.whatsapp}
                href={companyInfo.whatsapp ? `https://wa.me/237${companyInfo.whatsapp}` : undefined}
                emptyLabel={text.notSet}
              />
              <InfoRow
                icon={<ExternalLink size={16} />}
                label={text.facebook}
                value={companyInfo.facebook_url}
                href={companyInfo.facebook_url}
                emptyLabel={text.notSet}
              />
              <InfoRow
                icon={<ExternalLink size={16} />}
                label={text.instagram}
                value={companyInfo.instagram_url}
                href={companyInfo.instagram_url}
                emptyLabel={text.notSet}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clock size={16} className="text-gold" />
                {text.hours}
              </p>
              {openNow !== null && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    openNow ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-neutral-400'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${openNow ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
                  {openNow ? text.openNow : text.closedNow}
                </span>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {groupOpeningDays(companyInfo.jours_ouverture as OpeningDay[], isEn).map((range, index) => (
                <div
                  key={`${range.rangeLabel}-${index}`}
                  className={`flex items-center justify-between gap-4 rounded-2xl p-3 ${
                    range.isToday ? 'bg-gold/10 ring-1 ring-gold/30' : 'bg-white/5'
                  }`}
                >
                  <span className={`text-sm ${range.isToday ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
                    {range.rangeLabel}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{range.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !saving && setIsModalOpen(false)}
          />
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#141414] shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{text.editTitle}</h2>
                <p className="mt-1 text-sm text-neutral-400">{text.editSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
                className="flex-shrink-0 rounded-full border border-white/10 p-2 text-foreground/60 transition hover:bg-white/5 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {formError && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
                  <p className="flex-1 text-xs text-red-400">{formError}</p>
                  <button onClick={() => setFormError(null)} className="flex-shrink-0 text-red-400/60 hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              )}

              <section className="space-y-3">
                <p className="text-xs font-semibold text-neutral-400">{text.sectionContact}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm text-neutral-300">
                    <span>
                      {text.name} <span className="text-red-400">*</span>
                    </span>
                    <input
                      value={formState.nom ?? ''}
                      onChange={(event) => handleFieldChange('nom', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold"
                    />
                  </label>
                  <label className="space-y-1.5 text-sm text-neutral-300">
                    <span>{text.location}</span>
                    <input
                      value={formState.localisation ?? ''}
                      onChange={(event) => handleFieldChange('localisation', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold"
                    />
                  </label>
                  <label className="space-y-1.5 text-sm text-neutral-300">
                    <span>
                      {text.mainPhone} <span className="text-red-400">*</span>
                    </span>
                    <input
                      value={formState.telephone_principal ?? ''}
                      onChange={(event) => handleFieldChange('telephone_principal', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold"
                    />
                  </label>
                  <label className="space-y-1.5 text-sm text-neutral-300">
                    <span>{text.secondaryPhone}</span>
                    <input
                      value={formState.telephone_secondaire ?? ''}
                      onChange={(event) => handleFieldChange('telephone_secondaire', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold"
                    />
                  </label>
                  <label className="space-y-1.5 text-sm text-neutral-300">
                    <span>{text.whatsapp}</span>
                    <div className="flex items-center rounded-2xl border border-white/10 bg-black/20 pl-4 transition focus-within:border-gold">
                      <span className="text-sm text-neutral-500">+237</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={9}
                        value={formState.whatsapp ?? ''}
                        placeholder="6XXXXXXXX"
                        onChange={(event) =>
                          handleFieldChange('whatsapp', normalizeCameroonPhone(event.target.value).slice(0, 9))
                        }
                        className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none"
                      />
                    </div>
                  </label>
                </div>
              </section>

              <section className="space-y-3">
                <p className="text-xs font-semibold text-neutral-400">{text.sectionSocial}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm text-neutral-300">
                    <span>{text.facebook}</span>
                    <input
                      value={formState.facebook_url ?? ''}
                      placeholder="https://www.facebook.com/votre_nom"
                      onChange={(event) => handleFieldChange('facebook_url', event.target.value.trim())}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold"
                    />
                  </label>
                  <label className="space-y-1.5 text-sm text-neutral-300">
                    <span>{text.instagram}</span>
                    <input
                      value={formState.instagram_url ?? ''}
                      placeholder="https://www.instagram.com/votre_nom"
                      onChange={(event) => handleFieldChange('instagram_url', event.target.value.trim())}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold"
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-neutral-400">{text.sectionHours}</p>
                  <button
                    type="button"
                    onClick={applyFirstDayToAll}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-medium text-neutral-300 transition hover:border-gold/50 hover:text-gold"
                  >
                    <Copy size={12} />
                    {text.applyToAll}
                  </button>
                </div>

                <div className="space-y-2">
                  {days.map((day, index) => (
                    <div
                      key={day.jour}
                      className="grid grid-cols-2 items-center gap-3 rounded-2xl border border-white/10 bg-black/10 p-3 md:grid-cols-[100px_auto_1fr_1fr_1fr]"
                    >
                      <p className="text-sm font-medium text-foreground">{day.jour}</p>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={day.ouvert}
                        onClick={() =>
                          updateDay(index, {
                            ouvert: !day.ouvert,
                            heure_ouverture: !day.ouvert ? day.heure_ouverture || '09:00' : null,
                            heure_fermeture: !day.ouvert ? day.heure_fermeture || '18:00' : null,
                            note: !day.ouvert ? day.note || 'Horaires habituels' : 'Fermé',
                          })
                        }
                        className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${
                          day.ouvert ? 'bg-gold' : 'bg-white/10'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-black transition ${
                            day.ouvert ? 'left-[22px]' : 'left-0.5'
                          }`}
                        />
                      </button>

                      <input
                        type="time"
                        value={day.heure_ouverture ?? ''}
                        onChange={(event) => updateDay(index, { heure_ouverture: event.target.value })}
                        disabled={!day.ouvert}
                        className="col-span-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground outline-none focus:border-gold disabled:opacity-40 md:col-span-1"
                      />
                      <input
                        type="time"
                        value={day.heure_fermeture ?? ''}
                        onChange={(event) => updateDay(index, { heure_fermeture: event.target.value })}
                        disabled={!day.ouvert}
                        className="col-span-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground outline-none focus:border-gold disabled:opacity-40 md:col-span-1"
                      />
                      <input
                        type="text"
                        value={day.note ?? ''}
                        onChange={(event) => updateDay(index, { note: event.target.value })}
                        placeholder={text.note}
                        className="col-span-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground outline-none focus:border-gold md:col-span-1"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 p-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? (isEn ? 'Saving...' : 'Enregistrement...') : text.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}