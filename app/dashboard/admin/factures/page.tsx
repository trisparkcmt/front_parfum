'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Download, Mail, RefreshCw, Loader2, Search,
  ArrowUpRight, Link as LinkIcon, Filter, X, Check, Clock
} from 'lucide-react';
import { invoiceService } from '@/services/invoiceService';
import { useToastStore } from '@/store/useToastStore';

// --- Shared Primitives ---

function cx(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

type StatusType = 'emerald' | 'blue' | 'amber' | 'red' | 'purple';

function StatusChip({
  status,
  label,
}: {
  status: StatusType;
  label: string;
}) {
  const styles: Record<StatusType, { text: string; bg: string; ring: string; dot: string }> = {
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      ring: 'ring-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    blue: {
      text: 'text-blue-400',
      bg: 'bg-blue-500/10',
      ring: 'ring-blue-500/20',
      dot: 'bg-blue-400',
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      ring: 'ring-amber-500/20',
      dot: 'bg-amber-400',
    },
    red: {
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      ring: 'ring-red-500/20',
      dot: 'bg-red-400',
    },
    purple: {
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
      ring: 'ring-purple-500/20',
      dot: 'bg-purple-400',
    },
  };

  const current = styles[status] || styles.blue;

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        current.text,
        current.bg,
        current.ring
      )}
    >
      <span className={cx('h-1.5 w-1.5 rounded-full shrink-0', current.dot)} />
      {label}
    </span>
  );
}

function IconButton({
  icon: Icon,
  onClick,
  title,
  href,
  tint = 'neutral',
  disabled = false,
  loading = false,
}: {
  icon: any;
  onClick?: () => void;
  title?: string;
  href?: string;
  tint?: 'gold' | 'red' | 'blue' | 'emerald' | 'neutral';
  disabled?: boolean;
  loading?: boolean;
}) {
  const tintStyles = {
    gold: 'hover:text-gold hover:bg-gold/10',
    red: 'hover:text-red-400 hover:bg-red-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
    emerald: 'hover:text-emerald-400 hover:bg-emerald-500/10',
    neutral: 'hover:text-foreground hover:bg-white/10',
  };

  const className = cx(
    'rounded-md p-1.5 text-foreground/45 transition-colors disabled:opacity-40 inline-flex items-center justify-center',
    tintStyles[tint]
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        title={title}
      >
        <Icon size={14} />
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      title={title}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
    </button>
  );
}

// --- Helper Functions ---

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// --- Main Page Component ---

export default function FacturesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'pending'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { addToast } = useToastStore();

  const PAGE_SIZE = 20;

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoiceService.listAllInvoices(page, PAGE_SIZE);
      const results = data.results || data.resultats || (Array.isArray(data) ? data : []);
      setInvoices(results);
      setTotal(data.count || results.length);
    } catch {
      addToast('Erreur lors du chargement des factures', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, addToast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleResend = async (numeroFacture: string) => {
    setResendingId(numeroFacture);
    try {
      await invoiceService.resendInvoiceByEmail(numeroFacture);
      addToast('Facture renvoyée par e-mail avec succès', 'success');
    } catch {
      addToast('Erreur lors du renvoi de la facture', 'error');
    } finally {
      setResendingId(null);
    }
  };

  const getInvoiceOrderNumber = (inv: any) => {
    if (!inv) return undefined;
    if (inv.commande?.numero_commande) return inv.commande.numero_commande;
    if (typeof inv.commande === 'string') return inv.commande;
    return inv.numero_facture;
  };

  const handleDownload = async (inv: any) => {
    const num = getInvoiceOrderNumber(inv);
    if (!num) return;
    setDownloadingId(inv.numero_facture);
    try {
      await invoiceService.downloadInvoiceFile(num, `${inv.numero_facture}.pdf`);
      addToast('Facture téléchargée', 'success');
    } catch {
      addToast('Impossible de télécharger cette facture', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const numeroCommande = inv.commande?.numero_commande || inv.commande;
      const matchesSearch = !search.trim()
        ? true
        : inv.numero_facture?.toLowerCase().includes(search.toLowerCase()) ||
          String(numeroCommande ?? '')?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'sent'
          ? inv.envoye_par_email
          : !inv.envoye_par_email;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    return count;
  }, [statusFilter]);

  const sentCount = useMemo(
    () => invoices.filter((i) => i.envoye_par_email).length,
    [invoices]
  );
  const pendingCount = useMemo(
    () => invoices.filter((i) => !i.envoye_par_email).length,
    [invoices]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Factures & Reçus</h1>
          <p className="text-sm text-foreground/40 mt-0.5">
            Gestion de toutes les factures PDF générées
          </p>
        </div>
        <button
          onClick={fetchInvoices}
          className="border border-white/10 text-foreground/60 hover:bg-white/5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* KPI Bordered Strip */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/8">
        <div className="p-4 flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
            Total factures
          </span>
          <span className="text-xl font-semibold tabular-nums text-foreground mt-1">
            {total}
          </span>
        </div>

        <div className="p-4 flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
            Envoyées par email
          </span>
          <span className="text-xl font-semibold tabular-nums text-emerald-400 mt-1">
            {sentCount}
          </span>
        </div>

        <div className="p-4 flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
            En attente d'envoi
          </span>
          <span className="text-xl font-semibold tabular-nums text-amber-400 mt-1">
            {pendingCount}
          </span>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par n° facture ou commande..."
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
              showFilters || activeFiltersCount > 0
                ? 'bg-white/10 text-foreground'
                : 'text-foreground/60 hover:bg-white/5'
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
              <span className="text-xs text-foreground/50">Statut d'envoi:</span>
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'all', label: 'Tous' },
                    { id: 'sent', label: 'Envoyés' },
                    { id: 'pending', label: 'En attente' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={cx(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                      statusFilter === f.id
                        ? 'bg-white/10 text-foreground'
                        : 'text-foreground/45 hover:text-foreground hover:bg-white/5'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => setStatusFilter('all')}
                className="text-[11px] text-foreground/40 hover:text-foreground underline ml-auto"
              >
                Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-foreground/40 gap-2 text-xs">
            <Loader2 className="animate-spin text-gold" size={16} />
            <span>Chargement des factures...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                  <th className="pl-4 py-3">N° Facture</th>
                  <th className="px-3 py-3">Commande</th>
                  <th className="px-3 py-3">Statut Email</th>
                  <th className="px-3 py-3">Date émission</th>
                  <th className="px-3 py-3">Montant</th>
                  <th className="px-3 py-3">Client / Email</th>
                  <th className="pr-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filtered.map((inv) => (
                  <tr
                    key={inv.numero_facture || inv.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="pl-4 py-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
                        <FileText size={13} className="text-gold shrink-0" />
                        <span>{inv.numero_facture}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-mono text-foreground/70">
                        {inv.commande?.numero_commande || inv.commande || '—'}
                      </span>
                      {inv.commande?.statut && (
                        <div className="text-[10px] text-foreground/40 mt-0.5">
                          {inv.commande.statut} · {inv.commande.statut_paiement}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {inv.envoye_par_email ? (
                        <StatusChip status="emerald" label="Envoyé" />
                      ) : (
                        <StatusChip status="amber" label="En attente" />
                      )}
                    </td>
                    <td className="px-3 py-3 text-foreground/60 tabular-nums">
                      {fmtDate(inv.date_emission)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-foreground tabular-nums">
                      {inv.montant_total ?? inv.commande?.total_ttc
                        ? `${Number(
                            inv.montant_total ?? inv.commande?.total_ttc
                          ).toLocaleString('fr-FR')} FCFA`
                        : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-foreground/60 block truncate max-w-[180px]">
                        {inv.commande?.client_email || inv.email_envoye_a || '—'}
                      </span>
                      {inv.commande?.client_nom_complet && (
                        <span className="text-[10px] text-foreground/35 block">
                          {inv.commande.client_nom_complet}
                        </span>
                      )}
                    </td>
                    <td className="pr-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton
                          icon={Download}
                          onClick={() => handleDownload(inv)}
                          title="Télécharger PDF"
                          tint="gold"
                          loading={downloadingId === inv.numero_facture}
                        />
                        <IconButton
                          icon={Mail}
                          onClick={() => handleResend(inv.numero_facture)}
                          title="Renvoyer par email"
                          tint="emerald"
                          loading={resendingId === inv.numero_facture}
                        />
                        {inv.fichier_pdf && (
                          <IconButton
                            icon={ArrowUpRight}
                            href={inv.fichier_pdf}
                            title="Ouvrir le PDF"
                            tint="blue"
                          />
                        )}
                        {inv.commande?.detail_url && (
                          <IconButton
                            icon={LinkIcon}
                            href={inv.commande.detail_url}
                            title="Voir la commande"
                            tint="neutral"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-sm italic text-foreground/30"
                    >
                      Aucune facture trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-white/10 rounded-lg text-xs font-medium text-foreground/60 hover:bg-white/5 disabled:opacity-40 transition-colors"
          >
            Précédent
          </button>
          <span className="text-xs text-foreground/40 tabular-nums">
            Page {page} sur {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-white/10 rounded-lg text-xs font-medium text-foreground/60 hover:bg-white/5 disabled:opacity-40 transition-colors"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}