'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Eye, RefreshCw, Search, Store, Clock, CheckCircle2, Wallet, Percent, X } from 'lucide-react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { resolveImageUrl } from '@/lib/utils';
import AppImage from '@/components/ui/AppImage';
import { AdminTableSkeleton } from '@/components/ui/AdminTableSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';

/* -------------------------------------------------------------------------- */
/* Inline Translations Dictionary                                              */
/* -------------------------------------------------------------------------- */

const T = {
  fr: {
    title: 'Boutiques',
    subtitle: "Demandes d'ouverture, boutiques partenaires et suivi financier",
    refresh: 'Actualiser',
    search_placeholder: 'Rechercher une boutique ou un propriétaire…',
    kpi_pending: 'Demandes en attente',
    kpi_active: 'Boutiques actives',
    kpi_balance: 'Soldes à verser',
    kpi_commissions: 'Commissions plateforme',
    filter_all: 'Toutes',
    filter_pending: 'En attente',
    filter_active: 'Actives',
    filter_other: 'Autres',
    col_shop: 'Boutique',
    col_owner: 'Propriétaire',
    col_commission: 'Commission',
    col_balance: 'Solde disponible',
    col_received: 'Total reçu',
    col_status: 'Statut',
    col_actions: 'Actions',
    status_actif: 'Active',
    status_en_attente: 'En attente',
    status_other: 'Inactive',
    review: 'Examiner',
    details: 'Détails',
    no_address: 'Adresse non renseignée',
    owner_fallback: 'Propriétaire',
    received_on: 'Reçue le',
    balance_short: 'Solde',
    received_short: 'Reçu',
    no_results: 'Aucun résultat',
    empty_title: 'Aucune boutique',
    empty_desc: "Les demandes d'ouverture apparaîtront ici dès qu'un client postule.",
    toast_load_error: 'Erreur lors du chargement des boutiques',
    view_logo: 'Voir le logo de la boutique',
    close: 'Fermer',
    logo_alt: 'Logo de la boutique',
  },
  en: {
    title: 'Boutiques',
    subtitle: 'Opening requests, partner boutiques and financial overview',
    refresh: 'Refresh',
    search_placeholder: 'Search a boutique or an owner…',
    kpi_pending: 'Pending requests',
    kpi_active: 'Active boutiques',
    kpi_balance: 'Balances to pay out',
    kpi_commissions: 'Platform commissions',
    filter_all: 'All',
    filter_pending: 'Pending',
    filter_active: 'Active',
    filter_other: 'Other',
    col_shop: 'Boutique',
    col_owner: 'Owner',
    col_commission: 'Commission',
    col_balance: 'Available balance',
    col_received: 'Total received',
    col_status: 'Status',
    col_actions: 'Actions',
    status_actif: 'Active',
    status_en_attente: 'Pending',
    status_other: 'Inactive',
    review: 'Review',
    details: 'Details',
    no_address: 'No address provided',
    owner_fallback: 'Owner',
    received_on: 'Received on',
    balance_short: 'Balance',
    received_short: 'Received',
    no_results: 'No results found',
    empty_title: 'No boutiques',
    empty_desc: 'Opening requests will show up here as soon as a customer applies.',
    toast_load_error: 'Error loading boutiques',
    view_logo: 'View boutique logo',
    close: 'Close',
    logo_alt: 'Boutique logo',
  },
} as const;

type TKey = keyof typeof T.fr;
type FilterKey = 'all' | 'pending' | 'active' | 'other';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

/* -------------------------------------------------------------------------- */
/* Data helpers                                                                */
/* -------------------------------------------------------------------------- */

interface ShopRow {
  id: number;
  nom: string;
  photo: string | null;
  adresse: string;
  ville: string;
  statut: string;
  ownerName: string;
  email: string;
  phone: string;
  createdAt: string | null;
  commission: number | null;
  solde: number | null;
  recu: number | null;
  commissionsAdmin: number | null;
}

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

const formatFcfa = (v: number | null) =>
  v === null ? '—' : `${new Intl.NumberFormat('fr-FR').format(v)} FCFA`;

const photoOf = (r: any): string | null => r?.photo || r?.photo_url || r?.avatar_url || null;

/** Merge the three API sources (requests, all boutiques, financial) into one row per boutique id. */
function mergeRows(requests: any[], all: any[], financier: any[], ownerFallback: string): ShopRow[] {
  const map = new Map<number, any>();
  [...requests, ...all].forEach((r) => map.set(r.id, { ...map.get(r.id), ...r }));
  financier.forEach((f) => map.set(f.id, { statut: 'actif', ...map.get(f.id), ...f }));

  return Array.from(map.values()).map((r): ShopRow => {
    const owner = r.user_details;
    const ownerName =
      r.proprietaire_nom ||
      `${owner?.first_name || ''} ${owner?.last_name || ''}`.trim() ||
      r.proprietaire ||
      ownerFallback;
    return {
      id: r.id,
      nom: r.nom || '',
      photo: photoOf(r),
      adresse: r.adresse || '',
      ville: r.ville || '',
      statut: String(r.statut || '').toLowerCase(),
      ownerName,
      email: r.proprietaire_email || owner?.email || '',
      phone: r.proprietaire_telephone || r.telephone || owner?.telephone || '',
      createdAt: r.date_creation || null,
      commission: toNum(r.taux_commission),
      solde: toNum(r.solde_disponible),
      recu: toNum(r.solde_total_recu),
      commissionsAdmin: toNum(r.commissions_admin_perdues ?? r.total_commissions_admin),
    };
  });
}

/* -------------------------------------------------------------------------- */
/* UI primitives                                                               */
/* -------------------------------------------------------------------------- */

function TabButton({
  active,
  onClick,
  label,
  count,
  highlight,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-medium transition-colors',
        active ? 'border-gold text-gold' : 'border-transparent text-foreground/45 hover:text-foreground/75'
      )}
    >
      {label}
      <span
        className={cx(
          'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
          highlight && count > 0 ? 'bg-gold text-black' : 'bg-white/10 text-foreground/60'
        )}
      >
        {count}
      </span>
    </button>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone?: 'default' | 'gold' | 'green' | 'red';
}) {
  const toneClass = {
    default: 'text-foreground',
    gold: 'text-gold',
    green: 'text-green-400',
    red: 'text-red-300',
  }[tone];
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
        <Icon size={12} className="text-gold" />
        <span className="truncate">{label}</span>
      </div>
      <p className={cx('mt-2 truncate text-lg font-semibold tabular-nums', toneClass)}>{value}</p>
    </div>
  );
}

function StatusBadge({ statut, t }: { statut: string; t: (k: TKey) => string }) {
  const map: Record<string, { cls: string; label: string }> = {
    actif: { cls: 'bg-green-500/10 text-green-400 ring-green-500/20', label: t('status_actif') },
    en_attente: { cls: 'bg-gold/10 text-gold ring-gold/20', label: t('status_en_attente') },
  };
  const s = map[statut] ?? { cls: 'bg-white/5 text-foreground/50 ring-white/10', label: t('status_other') };
  return (
    <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', s.cls)}>
      {s.label}
    </span>
  );
}

function Logo({
  row,
  size,
  onPreview,
  title,
}: {
  row: ShopRow;
  size: 'sm' | 'md';
  onPreview: (url: string) => void;
  title: string;
}) {
  const dim = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';
  return (
    <button
      type="button"
      disabled={!row.photo}
      onClick={(e) => {
        e.stopPropagation();
        if (row.photo) onPreview(resolveImageUrl(row.photo));
      }}
      title={row.photo ? title : undefined}
      className={cx(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] disabled:cursor-default',
        dim
      )}
    >
      {row.photo ? (
        <AppImage src={resolveImageUrl(row.photo)} alt={row.nom} fill className="object-cover" />
      ) : (
        <span className="text-[10px] font-bold uppercase text-foreground/40">{row.nom.slice(0, 2)}</span>
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                              */
/* -------------------------------------------------------------------------- */

export default function AdminBoutiquesPage() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = useCallback((k: TKey): string => (isEn ? T.en[k] : T.fr[k]), [isEn]);
  const addToast = useToastStore((s) => s.addToast);

  const [rows, setRows] = useState<ShopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('pending');
  const [search, setSearch] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [initialFilterSet, setInitialFilterSet] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [reqRes, allRes, finRes] = await Promise.allSettled([
      adminService.getBoutiqueRequests(),
      adminService.getBoutiquesAdmin(),
      adminService.getBoutiquesFinancier(),
    ]);

    const pick = (r: PromiseSettledResult<any>): any[] => {
      if (r.status !== 'fulfilled') return [];
      const v = r.value;
      return Array.isArray(v) ? v : v?.results || [];
    };

    const failed = [reqRes, allRes, finRes].find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
    if (failed) addToast(failed.reason?.response?.data?.detail || t('toast_load_error'), 'error');

    setRows(mergeRows(pick(reqRes), pick(allRes), pick(finRes), t('owner_fallback')));
    setLoading(false);
  }, [addToast, t]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Land on "Pending" only when there is something to review, otherwise show everything.
  useEffect(() => {
    if (loading || initialFilterSet) return;
    if (!rows.some((r) => r.statut === 'en_attente')) setFilter('all');
    setInitialFilterSet(true);
  }, [loading, rows, initialFilterSet]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((r) => r.statut === 'en_attente').length,
      active: rows.filter((r) => r.statut === 'actif').length,
      other: rows.filter((r) => r.statut !== 'en_attente' && r.statut !== 'actif').length,
    }),
    [rows]
  );

  const totals = useMemo(
    () => ({
      balance: rows.reduce((sum, r) => sum + (r.solde ?? 0), 0),
      commissions: rows.reduce((sum, r) => sum + (r.commissionsAdmin ?? 0), 0),
    }),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (filter === 'pending') return r.statut === 'en_attente';
        if (filter === 'active') return r.statut === 'actif';
        if (filter === 'other') return r.statut !== 'en_attente' && r.statut !== 'actif';
        return true;
      })
      .filter(
        (r) =>
          !q ||
          r.nom.toLowerCase().includes(q) ||
          r.ownerName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.ville.toLowerCase().includes(q)
      );
  }, [rows, filter, search]);

  const go = (id: number) => router.push(`/dashboard/admin/boutiques/${id}`);
  const dateFmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(isEn ? 'en-GB' : 'fr-FR') : '—';
  const addressOf = (r: ShopRow) => [r.adresse, r.ville].filter(Boolean).join(', ') || t('no_address');

  const ActionButton = ({ row }: { row: ShopRow }) =>
    row.statut === 'en_attente' ? (
      <button
        onClick={(e) => {
          e.stopPropagation();
          go(row.id);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[11px] font-semibold text-black transition-colors hover:bg-gold/85"
      >
        <Eye size={12} />
        {t('review')}
      </button>
    ) : (
      <button
        onClick={(e) => {
          e.stopPropagation();
          go(row.id);
        }}
        title={t('details')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-medium text-foreground/70 transition-colors hover:border-gold/40 hover:text-gold"
      >
        <Eye size={12} />
        {t('details')}
      </button>
    );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
            <p className="mt-0.5 text-sm text-foreground/40">{t('subtitle')}</p>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-foreground/70 transition-colors hover:bg-white/[0.06] disabled:opacity-60 sm:w-auto"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{t('refresh')}</span>
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label={t('kpi_pending')} value={String(counts.pending)} icon={Clock} tone={counts.pending > 0 ? 'gold' : 'default'} />
          <Kpi label={t('kpi_active')} value={String(counts.active)} icon={CheckCircle2} />
          <Kpi label={t('kpi_balance')} value={formatFcfa(totals.balance)} icon={Wallet} tone="green" />
          <Kpi label={t('kpi_commissions')} value={formatFcfa(totals.commissions)} icon={Percent} />
        </div>

        {/* Filters + table */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] shadow-sm shadow-black/30">
          <div className="flex overflow-x-auto border-b border-white/10 bg-white/[0.02]">
            <TabButton active={filter === 'pending'} onClick={() => setFilter('pending')} label={t('filter_pending')} count={counts.pending} highlight />
            <TabButton active={filter === 'active'} onClick={() => setFilter('active')} label={t('filter_active')} count={counts.active} />
            {counts.other > 0 && (
              <TabButton active={filter === 'other'} onClick={() => setFilter('other')} label={t('filter_other')} count={counts.other} />
            )}
            <TabButton active={filter === 'all'} onClick={() => setFilter('all')} label={t('filter_all')} count={counts.all} />
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 sm:max-w-sm">
              <Search size={14} className="shrink-0 text-foreground/35" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-foreground/35"
              />
            </div>

            {loading ? (
              <AdminTableSkeleton columns={6} rows={5} />
            ) : rows.length === 0 ? (
              <EmptyState icon={<Store size={48} />} title={t('empty_title')} description={t('empty_desc')} />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-hidden rounded-xl border border-white/10 md:block">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02]">
                        {(['col_shop', 'col_owner', 'col_commission', 'col_balance', 'col_received', 'col_status'] as TKey[]).map((k) => (
                          <th key={k} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                            {t(k)}
                          </th>
                        ))}
                        <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                          {t('col_actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filtered.map((r) => (
                        <tr key={r.id} onClick={() => go(r.id)} className="cursor-pointer transition-colors hover:bg-white/[0.02]">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <Logo row={r} size="md" onPreview={setPreviewImage} title={t('view_logo')} />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">{r.nom}</p>
                                <p className="truncate text-[11px] text-foreground/40">{addressOf(r)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="text-foreground/80">{r.ownerName}</p>
                            <p className="mt-0.5 text-[11px] text-foreground/40">{r.email || r.phone || '—'}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            {r.commission !== null ? (
                              <span className="inline-flex items-center rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-gold ring-1 ring-inset ring-gold/20">
                                {r.commission.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-foreground/25">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-mono tabular-nums text-green-400">{formatFcfa(r.solde)}</td>
                          <td className="px-4 py-2.5 font-mono tabular-nums text-foreground/60">{formatFcfa(r.recu)}</td>
                          <td className="px-4 py-2.5">
                            <StatusBadge statut={r.statut} t={t} />
                            {r.statut === 'en_attente' && (
                              <p className="mt-1 text-[10px] text-foreground/35">
                                {t('received_on')} {dateFmt(r.createdAt)}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <ActionButton row={r} />
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-sm italic text-foreground/30">
                            {t('no_results')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {filtered.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => go(r.id)}
                      className="cursor-pointer space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Logo row={r} size="sm" onPreview={setPreviewImage} title={t('view_logo')} />
                          <div className="min-w-0">
                            <h3 className="truncate text-xs font-semibold text-foreground">{r.nom}</h3>
                            <p className="truncate text-[11px] text-foreground/40">{r.ownerName}</p>
                          </div>
                        </div>
                        <StatusBadge statut={r.statut} t={t} />
                      </div>

                      <div className="space-y-1.5 border-t border-white/5 pt-2 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-foreground/40">{t('col_commission')}</span>
                          <span className="font-medium tabular-nums text-gold">{r.commission !== null ? `${r.commission.toFixed(1)}%` : '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/40">{t('balance_short')}</span>
                          <span className="font-mono tabular-nums text-green-400">{formatFcfa(r.solde)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/40">{t('received_short')}</span>
                          <span className="font-mono tabular-nums text-foreground/70">{formatFcfa(r.recu)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-2">
                        <span className="text-[10px] text-foreground/35">{dateFmt(r.createdAt)}</span>
                        <ActionButton row={r} />
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="py-12 text-center text-sm italic text-foreground/30">{t('no_results')}</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Logo preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-xl border border-white/10 bg-[#0a0a0a] p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/50 p-1.5 text-foreground/70 hover:text-foreground"
              aria-label={t('close')}
            >
              <X size={14} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage} alt={t('logo_alt')} className="max-h-[70vh] w-full rounded-lg object-contain" />
          </div>
        </div>
      )}
    </>
  );
}