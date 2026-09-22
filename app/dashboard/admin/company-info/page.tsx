'use client';

import { useEffect, useState } from 'react';
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
  Tag,
  Link2,
  Copy,
  Building2,
} from 'lucide-react';
import { shopService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';
import type { CompanyInfo } from '@/types';
import { normalizeCameroonPhone, normalizeSocialProfileUrl } from '@/lib/utils';
import { FormModal } from '@/components/ui/FormModal';
import { EmptyState } from '@/components/ui/EmptyState';

/* -- Inline translations --------------------------------------------------- */
const T = {
  fr: {
    title: 'Infos Entreprise',
    subtitle: 'Coordonnées, adresse et horaires d’ouverture de la boutique',
    edit: 'Modifier',
    edit_modal: 'Modifier les informations',
    edit_subtitle: 'Ces informations sont visibles publiquement sur la boutique.',
    kpi_status: 'Statut',
    kpi_phones: 'Téléphones renseignés',
    kpi_social: 'Réseaux sociaux',
    open_now: 'Ouvert',
    closed_now: 'Fermé',
    section_contact: 'Coordonnées',
    section_social: 'Réseaux sociaux',
    section_hours: 'Jours et horaires',
    field_name: 'Nom de l’entreprise',
    field_location: 'Localisation',
    field_main_phone: 'Téléphone principal',
    field_secondary_phone: 'Téléphone secondaire',
    field_whatsapp: 'WhatsApp',
    field_facebook: 'Facebook',
    field_instagram: 'Instagram',
    not_set: 'Non renseigné',
    apply_to_all: 'Appliquer à tous les jours ouverts',
    note: 'Note',
    cancel: 'Annuler',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    no_data_title: 'Aucune information',
    no_data_desc: 'Aucun enregistrement trouvé — contactez votre développeur si celui-ci devrait déjà exister.',
    toast_load_error: 'Impossible de charger les informations de l’entreprise.',
    toast_save_ok: 'Informations enregistrées avec succès.',
    toast_save_error: 'Erreur lors de l’enregistrement des informations.',
    error_required: 'Le nom, le téléphone principal et les horaires sont requis.',
    error_hours: 'Les jours ouverts doivent avoir une heure d’ouverture et de fermeture.',
    error_whatsapp: 'Le numéro WhatsApp doit contenir 9 chiffres.',
  },
  en: {
    title: 'Company Info',
    subtitle: 'Shop contact details, address and opening hours',
    edit: 'Edit',
    edit_modal: 'Edit company information',
    edit_subtitle: 'This information is publicly visible on the shop.',
    kpi_status: 'Status',
    kpi_phones: 'Phones on file',
    kpi_social: 'Social profiles',
    open_now: 'Open',
    closed_now: 'Closed',
    section_contact: 'Contact details',
    section_social: 'Social profiles',
    section_hours: 'Days and hours',
    field_name: 'Company name',
    field_location: 'Location',
    field_main_phone: 'Primary phone',
    field_secondary_phone: 'Secondary phone',
    field_whatsapp: 'WhatsApp',
    field_facebook: 'Facebook',
    field_instagram: 'Instagram',
    not_set: 'Not set',
    apply_to_all: 'Apply to every open day',
    note: 'Note',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    no_data_title: 'No information',
    no_data_desc: 'No record found — contact your developer if this should already exist.',
    toast_load_error: 'Unable to load company information.',
    toast_save_ok: 'Company information saved successfully.',
    toast_save_error: 'Failed to save company information.',
    error_required: 'Name, primary phone and opening hours are required.',
    error_hours: 'Open days must have an opening and closing time.',
    error_whatsapp: 'WhatsApp number must contain 9 digits.',
  },
} as const;
type TKey = keyof typeof T.fr;

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
    days: typeof normalized;
    isOpen: boolean;
    openingTime: string | null;
    closingTime: string | null;
    end: number;
  }[] = [
    {
      days: [normalized[0]],
      isOpen: normalized[0].ouvert,
      openingTime: normalized[0].heure_ouverture ?? null,
      closingTime: normalized[0].heure_fermeture ?? null,
      end: 0,
    },
  ];

  for (let i = 1; i < normalized.length; i += 1) {
    const current = normalized[i];
    const currentGroup = groups[groups.length - 1];
    const sameSchedule =
      current.ouvert === currentGroup.isOpen &&
      (current.heure_ouverture ?? null) === currentGroup.openingTime &&
      (current.heure_fermeture ?? null) === currentGroup.closingTime;

    if (sameSchedule && i === currentGroup.end + 1) {
      currentGroup.days.push(current);
      currentGroup.end = i;
    } else {
      groups.push({
        days: [current],
        isOpen: current.ouvert,
        openingTime: current.heure_ouverture ?? null,
        closingTime: current.heure_fermeture ?? null,
        end: i,
      });
    }
  }

  return groups.map((group) => {
    const labels = group.days.map((day) => day.label);
    const rangeLabel = labels.length === 1 ? labels[0] : `${labels[0]} – ${labels[labels.length - 1]}`;
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
  const today = days[JS_DAY_TO_WEEK_INDEX[new Date().getDay()]];
  if (!today || !today.ouvert || !today.heure_ouverture || !today.heure_fermeture) return false;
  const now = new Date();
  const [openH, openM] = today.heure_ouverture.split(':').map(Number);
  const [closeH, closeM] = today.heure_fermeture.split(':').map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= openH * 60 + openM && nowMinutes < closeH * 60 + closeM;
}

/* -------------------------------------------------------------------------- */
/*                               SHARED PRIMITIVES                            */
/* -------------------------------------------------------------------------- */

function cx(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

type StatusType = 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'gold' | 'neutral';

function StatusChip({ label, type = 'neutral' }: { label: string; type?: StatusType }) {
  const styles: Record<StatusType, { bg: string; text: string; ring: string; dot: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20', dot: 'bg-emerald-400' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', ring: 'ring-blue-500/20', dot: 'bg-blue-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', ring: 'ring-amber-500/20', dot: 'bg-amber-400' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', ring: 'ring-red-500/20', dot: 'bg-red-400' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', ring: 'ring-purple-500/20', dot: 'bg-purple-400' },
    gold: { bg: 'bg-gold/10', text: 'text-gold', ring: 'ring-gold/20', dot: 'bg-gold' },
    neutral: { bg: 'bg-white/5', text: 'text-foreground/60', ring: 'ring-white/10', dot: 'bg-foreground/40' },
  };
  const style = styles[type] || styles.neutral;
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset', style.bg, style.text, style.ring)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', style.dot)} />
      {label}
    </span>
  );
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'red' | 'blue' | 'neutral';
  children: React.ReactNode;
}

function IconButton({ variant = 'neutral', children, className, ...props }: IconButtonProps) {
  const variants = {
    gold: 'hover:text-gold hover:bg-gold/10',
    red: 'hover:text-red-400 hover:bg-red-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
    neutral: 'hover:text-foreground hover:bg-white/5',
  };
  return (
    <button {...props} className={cx('rounded-md p-1.5 text-foreground/45 transition-colors focus:outline-none', variants[variant], className)}>
      {children}
    </button>
  );
}

function FormSection({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-white/8 pt-6 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gold/75">
          {icon}
          {title}
        </p>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, required, error, children }: { label: React.ReactNode; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-foreground/55">
        {label}
        {required && <span className="ml-0.5 text-gold">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-gold/50';

function InfoRow({
  icon,
  label,
  value,
  href,
  emptyLabel,
  onCopy,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  href?: string | null;
  emptyLabel: string;
  onCopy?: () => void;
}) {
  const hasValue = Boolean(value);
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 text-foreground/45">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{label}</p>
        <p className={cx('mt-0.5 truncate text-xs font-medium', hasValue ? 'text-foreground' : 'italic text-foreground/30')}>
          {hasValue ? value : emptyLabel}
        </p>
      </div>
      {hasValue && (
        <div className="flex flex-shrink-0 items-center gap-0.5">
          {onCopy && (
            <IconButton variant="neutral" onClick={onCopy} title="Copier">
              <Copy size={13} />
            </IconButton>
          )}
          {href && (
            <IconButton variant="gold" onClick={() => window.open(href, '_blank', 'noopener,noreferrer')} title="Ouvrir">
              <ExternalLink size={13} />
            </IconButton>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                MAIN COMPONENT                              */
/* -------------------------------------------------------------------------- */

export default function AdminCompanyInfoPage() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = (k: TKey) => (isEn ? T.en[k] : T.fr[k]);

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<Partial<CompanyInfo>>({});
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { addToast } = useToastStore();

  const fetchCompanyInfo = async () => {
    setLoading(true);
    try {
      const data = await shopService.getCompanyInfos();
      setCompanyInfo(Array.isArray(data) && data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error('Company info fetch failed', error);
      addToast(t('toast_load_error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setShowModal(true);
  };

  const updateForm = (field: keyof Partial<CompanyInfo>, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const updateDay = (index: number, patch: Partial<OpeningDay>) => {
    const currentDays = (formState.jours_ouverture as OpeningDay[]) || createDefaultOpeningDays();
    setFormState((prev) => ({ ...prev, jours_ouverture: currentDays.map((item, idx) => (idx === index ? { ...item, ...patch } : item)) }));
  };

  const applyFirstDayToAll = () => {
    const currentDays = (formState.jours_ouverture as OpeningDay[]) || createDefaultOpeningDays();
    const reference = currentDays.find((day) => day.ouvert);
    if (!reference) return;
    setFormState((prev) => ({
      ...prev,
      jours_ouverture: currentDays.map((day) =>
        day.ouvert ? { ...day, heure_ouverture: reference.heure_ouverture, heure_fermeture: reference.heure_fermeture } : day
      ),
    }));
  };

  const handleCopy = async (value?: string | null) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const handleSave = async () => {
    if (!companyInfo) return;
    setFormError(null);

    if (!formState.nom || !formState.telephone_principal || !formState.jours_ouverture) {
      setFormError(t('error_required'));
      return;
    }

    try {
      const jours = (formState.jours_ouverture as OpeningDay[]).map((day) => {
        if (day.ouvert && (!day.heure_ouverture || !day.heure_fermeture)) throw new Error(t('error_hours'));
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
        setFormError(t('error_whatsapp'));
        return;
      }

      setSaving(true);
      await shopService.updateCompanyInfo(companyInfo.id, {
        nom: formState.nom,
        localisation: formState.localisation,
        telephone_principal: formState.telephone_principal,
        telephone_secondaire: formState.telephone_secondaire,
        whatsapp,
        facebook_url: facebookUrl,
        instagram_url: instagramUrl,
        jours_ouverture: jours,
      });

      addToast(t('toast_save_ok'), 'success');
      await fetchCompanyInfo();
      setShowModal(false);
    } catch (error: any) {
      console.error('Company info save failed', error);
      setFormError(error?.message || t('toast_save_error'));
    } finally {
      setSaving(false);
    }
  };

  const openNow = companyInfo ? isOpenNow(companyInfo.jours_ouverture as OpeningDay[]) : null;
  const days = (formState.jours_ouverture as OpeningDay[]) || createDefaultOpeningDays();
  const phonesFilled = companyInfo
    ? [companyInfo.telephone_principal, companyInfo.telephone_secondaire, companyInfo.whatsapp].filter(Boolean).length
    : 0;
  const socialFilled = companyInfo ? [companyInfo.facebook_url, companyInfo.instagram_url].filter(Boolean).length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-sm text-foreground/40">{t('subtitle')}</p>
        </div>
        {companyInfo && !loading && (
          <button
            onClick={openEdit}
            className="flex items-center gap-2 rounded-lg bg-gold px-3.5 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-90"
          >
            <Edit2 size={15} />
            <span>{t('edit')}</span>
          </button>
        )}
      </div>

      {/* KPI Summary Strip */}
      {!loading && companyInfo && (
        <div className="shadow-black/30 shadow-sm flex items-center rounded-xl border border-white/10 bg-white/[0.02] divide-x divide-white/10 overflow-x-auto">
          <div className="flex-1 min-w-[140px] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('kpi_status')}</p>
            <div className="mt-1.5">
              <StatusChip label={openNow ? t('open_now') : t('closed_now')} type={openNow ? 'emerald' : 'neutral'} />
            </div>
          </div>
          <div className="flex-1 min-w-[140px] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('kpi_phones')}</p>
            <p className="text-xl font-semibold tabular-nums text-foreground mt-0.5">{phonesFilled}/3</p>
          </div>
          <div className="flex-1 min-w-[140px] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('kpi_social')}</p>
            <p className="text-xl font-semibold tabular-nums text-foreground mt-0.5">{socialFilled}/2</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="shadow-black/30 shadow-sm rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5 overflow-hidden">
            {[0, 1, 2, 3, 4].map((key) => (
              <div key={key} className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-white/5" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2 w-20 animate-pulse rounded bg-white/5" />
                  <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
          <div className="shadow-black/30 shadow-sm rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-10 animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        </div>
      )}

      {/* Empty state — no record exists; admin can only edit, not create */}
      {!loading && !companyInfo && (
        <div className="shadow-black/30 shadow-sm rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden min-h-[300px] flex items-center justify-center">
          <EmptyState icon={<Building2 size={48} />} title={t('no_data_title')} description={t('no_data_desc')} />
        </div>
      )}

      {/* Content */}
      {!loading && companyInfo && (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="shadow-black/30 shadow-sm rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="border-b border-white/10 px-4 py-2.5 bg-white/[0.01]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('section_contact')}</p>
            </div>
            <div className="divide-y divide-white/5">
              <InfoRow icon={<Building2 size={14} />} label={t('field_name')} value={companyInfo.nom} emptyLabel={t('not_set')} />
              <InfoRow icon={<MapPin size={14} />} label={t('field_location')} value={companyInfo.localisation} emptyLabel={t('not_set')} />
              <InfoRow
                icon={<Phone size={14} />}
                label={t('field_main_phone')}
                value={companyInfo.telephone_principal}
                href={companyInfo.telephone_principal ? `tel:${companyInfo.telephone_principal}` : undefined}
                onCopy={() => handleCopy(companyInfo.telephone_principal)}
                emptyLabel={t('not_set')}
              />
              <InfoRow
                icon={<Phone size={14} />}
                label={t('field_secondary_phone')}
                value={companyInfo.telephone_secondaire}
                href={companyInfo.telephone_secondaire ? `tel:${companyInfo.telephone_secondaire}` : undefined}
                onCopy={() => handleCopy(companyInfo.telephone_secondaire)}
                emptyLabel={t('not_set')}
              />
              <InfoRow
                icon={<MessageCircle size={14} />}
                label={t('field_whatsapp')}
                value={companyInfo.whatsapp}
                href={companyInfo.whatsapp ? `https://wa.me/237${companyInfo.whatsapp}` : undefined}
                onCopy={() => handleCopy(companyInfo.whatsapp)}
                emptyLabel={t('not_set')}
              />
              <InfoRow icon={<Link2 size={14} />} label={t('field_facebook')} value={companyInfo.facebook_url} href={companyInfo.facebook_url} emptyLabel={t('not_set')} />
              <InfoRow icon={<Link2 size={14} />} label={t('field_instagram')} value={companyInfo.instagram_url} href={companyInfo.instagram_url} emptyLabel={t('not_set')} />
            </div>
          </div>

          <div className="shadow-black/30 shadow-sm rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5 bg-white/[0.01]">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                <Clock size={12} />
                {t('section_hours')}
              </p>
            </div>
            <div className="divide-y divide-white/5">
              {groupOpeningDays(companyInfo.jours_ouverture as OpeningDay[], isEn).map((range, index) => (
                <div key={`${range.rangeLabel}-${index}`} className={cx('flex items-center justify-between gap-4 px-4 py-3', range.isToday && 'bg-gold/5')}>
                  <span className={cx('text-xs', range.isToday ? 'font-semibold text-gold' : 'text-foreground/70')}>{range.rangeLabel}</span>
                  <span className="text-xs font-semibold tabular-nums text-foreground">{range.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal ─────────────────────────────────────────────────────── */}
      <FormModal isOpen={showModal} onClose={() => !saving && setShowModal(false)} title={t('edit_modal')} subtitle={t('edit_subtitle')} size="2xl">
        <div className="p-6 lg:p-8">
          {formError && (
            <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">{isEn ? 'Save error' : 'Erreur lors de la sauvegarde'}</p>
                <p className="mt-1 text-xs text-red-400/80">{formError}</p>
              </div>
              <button onClick={() => setFormError(null)} className="text-red-400/60 hover:text-red-400 transition-colors">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <FormSection title={t('section_contact')} icon={<Tag size={11} />}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('field_name')} required>
                  <input value={formState.nom ?? ''} onChange={(e) => updateForm('nom', e.target.value)} className={inputCls} />
                </Field>
                <Field label={t('field_location')}>
                  <input value={formState.localisation ?? ''} onChange={(e) => updateForm('localisation', e.target.value)} className={inputCls} />
                </Field>
                <Field label={t('field_main_phone')} required>
                  <input value={formState.telephone_principal ?? ''} onChange={(e) => updateForm('telephone_principal', e.target.value)} className={inputCls} />
                </Field>
                <Field label={t('field_secondary_phone')}>
                  <input value={formState.telephone_secondaire ?? ''} onChange={(e) => updateForm('telephone_secondaire', e.target.value)} className={inputCls} />
                </Field>
                <Field label={t('field_whatsapp')}>
                  <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] pl-3 transition-colors focus-within:border-gold/50">
                    <span className="text-sm text-foreground/40">+237</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={9}
                      placeholder="6XXXXXXXX"
                      value={formState.whatsapp ?? ''}
                      onChange={(e) => updateForm('whatsapp', normalizeCameroonPhone(e.target.value).slice(0, 9))}
                      className="w-full bg-transparent px-2 py-2 text-sm text-foreground outline-none"
                    />
                  </div>
                </Field>
              </div>
            </FormSection>

            <FormSection title={t('section_social')} icon={<Link2 size={11} />}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('field_facebook')}>
                  <input
                    placeholder="https://www.facebook.com/votre_nom"
                    value={formState.facebook_url ?? ''}
                    onChange={(e) => updateForm('facebook_url', e.target.value.trim())}
                    className={inputCls}
                  />
                </Field>
                <Field label={t('field_instagram')}>
                  <input
                    placeholder="https://www.instagram.com/votre_nom"
                    value={formState.instagram_url ?? ''}
                    onChange={(e) => updateForm('instagram_url', e.target.value.trim())}
                    className={inputCls}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection
              title={t('section_hours')}
              icon={<Clock size={11} />}
              action={
                <button
                  type="button"
                  onClick={applyFirstDayToAll}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-medium text-foreground/50 transition-colors hover:border-gold/40 hover:text-gold"
                >
                  <Copy size={11} />
                  {t('apply_to_all')}
                </button>
              }
            >
              <div className="space-y-2">
                {days.map((day, index) => (
                  <div key={day.jour} className="grid grid-cols-2 items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.02] p-2.5 md:grid-cols-[92px_40px_1fr_1fr_1fr]">
                    <p className="text-xs font-medium text-foreground/70">{day.jour}</p>
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
                      className={cx('relative h-5 w-9 flex-shrink-0 rounded-full transition-colors', day.ouvert ? 'bg-gold' : 'bg-white/10')}
                    >
                      <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-black transition-all', day.ouvert ? 'left-[18px]' : 'left-0.5')} />
                    </button>
                    <input
                      type="time"
                      value={day.heure_ouverture ?? ''}
                      onChange={(e) => updateDay(index, { heure_ouverture: e.target.value })}
                      disabled={!day.ouvert}
                      className={cx(inputCls, 'col-span-2 py-1.5 disabled:opacity-40 md:col-span-1')}
                    />
                    <input
                      type="time"
                      value={day.heure_fermeture ?? ''}
                      onChange={(e) => updateDay(index, { heure_fermeture: e.target.value })}
                      disabled={!day.ouvert}
                      className={cx(inputCls, 'col-span-2 py-1.5 disabled:opacity-40 md:col-span-1')}
                    />
                    <input
                      type="text"
                      value={day.note ?? ''}
                      placeholder={t('note')}
                      onChange={(e) => updateDay(index, { note: e.target.value })}
                      className={cx(inputCls, 'col-span-2 py-1.5 md:col-span-1')}
                    />
                  </div>
                ))}
              </div>
            </FormSection>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              onClick={() => setShowModal(false)}
              disabled={saving}
              className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>{t('saving')}</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{t('save')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </FormModal>
    </div>
  );
}