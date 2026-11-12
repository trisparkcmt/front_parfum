'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  ClipboardList,
  Copy,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { adminService } from '@/services/apiService';
import {
  dailyReportService,
  type CloseDailyReportPayload,
  type DailyReport,
  type DailyReportItem,
  type DailyStockEntry,
} from '@/services/dailyReportService';
import { extractApiError } from '@/lib/apiError';
import { useToastStore } from '@/store/useToastStore';

interface DailyReportsProps {
  isAdmin: boolean;
}

interface CashierOption {
  id: number;
  name: string;
  active: boolean;
}

interface ManualArticleRow {
  nom: string;
  quantite: string;
  sous_total: string;
  type: string;
}

interface ManualStockRow {
  nom: string;
  quantite_ajoutee: string;
  type_produit: string;
  date: string;
}

interface ReportFilters {
  date: string;
  date_debut: string;
  date_fin: string;
  caissiere_id: string;
}

const TYPES_PRODUIT = ['parfum', 'essence', 'accessoire', 'autre'];

function todayAsLocalDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function readList<T>(data: T[] | { results?: T[]; resultats?: T[] } | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  return data?.results ?? data?.resultats ?? [];
}

function getCashierOptions(data: unknown): CashierOption[] {
  const rows = readList(data as Array<Record<string, unknown>> | { results?: Array<Record<string, unknown>>; resultats?: Array<Record<string, unknown>> });
  return rows.map((row) => {
    const details = (row.user_details ?? row) as Record<string, unknown>;
    const firstName = String(details.first_name ?? '');
    const lastName = String(details.last_name ?? '');
    return {
      id: Number(details.id ?? row.user_id ?? row.id),
      name: `${firstName} ${lastName}`.trim() || String(details.email ?? `Serveuse #${row.id}`),
      active: row.actif === undefined ? true : Boolean(row.actif),
    };
  }).filter((cashier) => Number.isFinite(cashier.id));
}

function formatAmount(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') return '—';
  const amount = Number(value);
  return Number.isFinite(amount) ? `${amount.toLocaleString('fr-FR')} FCFA` : String(value);
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <h2 className="font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-foreground/60">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/60"
      />
    </label>
  );
}

export default function DailyReports({ isAdmin }: DailyReportsProps) {
  const { addToast } = useToastStore();
  const [reportDate, setReportDate] = useState(todayAsLocalDate);
  const [cashiers, setCashiers] = useState<CashierOption[]>([]);
  const [cashierId, setCashierId] = useState('');
  const [cashierLoading, setCashierLoading] = useState(isAdmin);
  const [preview, setPreview] = useState<DailyReport | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState('');
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>({ date: '', date_debut: '', date_fin: '', caissiere_id: '' });
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>({ date: '', date_debut: '', date_fin: '', caissiere_id: '' });
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [regeneratingPdf, setRegeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState('');
  const [heureArrivee, setHeureArrivee] = useState('');
  const [heureDepart, setHeureDepart] = useState('');
  const [resteEnCaisse, setResteEnCaisse] = useState('');
  const [actionsCommunication, setActionsCommunication] = useState('');
  const [observations, setObservations] = useState('');
  const [manualData, setManualData] = useState<Array<{ key: string; value: string }>>([]);
  const [manualArticles, setManualArticles] = useState<ManualArticleRow[]>([]);
  const [manualStock, setManualStock] = useState<ManualStockRow[]>([]);

  const loadCashiers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setCashierLoading(true);
      const options = getCashierOptions(await adminService.getServeuses());
      setCashiers(options);
      setCashierId((current) => current || String(options.find((cashier) => cashier.active)?.id ?? ''));
    } catch (error) {
      addToast(extractApiError(error, 'Impossible de charger la liste des serveuses.'), 'error');
    } finally {
      setCashierLoading(false);
    }
  }, [addToast, isAdmin]);

  useEffect(() => {
    loadCashiers();
  }, [loadCashiers]);

  const loadPreview = useCallback(async () => {
    if (isAdmin && !cashierId) {
      setPreview(null);
      setPreviewLoading(false);
      setPreviewError('Sélectionnez une caissière pour afficher son aperçu.');
      return;
    }
    try {
      setPreviewLoading(true);
      setPreviewError('');
      const data = await dailyReportService.getPreview({
        date: reportDate,
        ...(isAdmin && cashierId ? { caissiere_id: Number(cashierId) } : {}),
      });
      setPreview(data);
    } catch (error) {
      setPreview(null);
      const message = extractApiError(error, 'Impossible de charger l’aperçu du rapport.');
      setPreviewError(message);
      if (!isAdmin || cashierId) addToast(message, 'error');
    } finally {
      setPreviewLoading(false);
    }
  }, [addToast, cashierId, isAdmin, reportDate]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const loadReports = useCallback(async () => {
    try {
      setReportsLoading(true);
      const result = await dailyReportService.getReports({
        ...(appliedFilters.date ? { date: appliedFilters.date } : {}),
        ...(appliedFilters.date_debut ? { date_debut: appliedFilters.date_debut } : {}),
        ...(appliedFilters.date_fin ? { date_fin: appliedFilters.date_fin } : {}),
        ...(isAdmin && appliedFilters.caissiere_id ? { caissiere_id: Number(appliedFilters.caissiere_id) } : {}),
      });
      setReports(readList(result));
    } catch (error) {
      addToast(extractApiError(error, 'Impossible de charger l’historique des rapports.'), 'error');
    } finally {
      setReportsLoading(false);
    }
  }, [addToast, appliedFilters, isAdmin]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const previewText = useMemo(
    () => preview?.texte_apercu || preview?.apercu_texte_whatsapp || preview?.texte_formate || '',
    [preview]
  );

  const handleCopyPreview = async () => {
    if (!previewText) return;
    try {
      await navigator.clipboard.writeText(previewText);
      setCopied(true);
      addToast('Texte copié dans le presse-papiers.', 'success');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      addToast('Impossible de copier le texte. Vérifiez les permissions du navigateur.', 'error');
    }
  };

  const openReport = async (id: number) => {
    try {
      setDetailLoading(true);
      const report = await dailyReportService.getReport(id);
      setSelectedReport(report);
    } catch (error) {
      addToast(extractApiError(error, 'Impossible de charger ce rapport.'), 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const regeneratePdf = async () => {
    if (!selectedReport) return;
    try {
      setRegeneratingPdf(true);
      const report = await dailyReportService.getReport(selectedReport.id, true);
      setSelectedReport(report);
      addToast('Le PDF du rapport a été actualisé.', 'success');
    } catch (error) {
      addToast(extractApiError(error, 'Impossible de régénérer le PDF.'), 'error');
    } finally {
      setRegeneratingPdf(false);
    }
  };

  const handleCloseDay = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCloseError('');
    if (isAdmin && !cashierId) {
      setCloseError('Sélectionnez une caissière avant de clôturer.');
      return;
    }

    const articleRows = manualArticles.filter((row) => row.nom.trim() || row.quantite || row.sous_total);
    const stockRows = manualStock.filter((row) => row.nom.trim() || row.quantite_ajoutee || row.type_produit);
    const invalidArticle = articleRows.some((row) =>
      !row.nom.trim() || Number(row.quantite) <= 0 || !Number.isFinite(Number(row.quantite)) ||
      Number(row.sous_total) < 0 || !Number.isFinite(Number(row.sous_total)) || !row.type
    );
    const invalidStock = stockRows.some((row) =>
      !row.nom.trim() || Number(row.quantite_ajoutee) <= 0 ||
      !Number.isFinite(Number(row.quantite_ajoutee)) || !row.type_produit
    );
    if (invalidArticle || invalidStock) {
      setCloseError('Complétez les champs des articles et entrées de stock ajoutés manuellement.');
      return;
    }

    const payload: CloseDailyReportPayload = {
      date: reportDate,
      ...(isAdmin ? { caissiere_id: Number(cashierId) } : {}),
      ...(heureArrivee.trim() ? { heure_arrivee: heureArrivee.trim() } : {}),
      ...(heureDepart.trim() ? { heure_depart: heureDepart.trim() } : {}),
      ...(resteEnCaisse.trim() ? { reste_en_caisse: resteEnCaisse.trim() } : {}),
      ...(actionsCommunication.trim() ? { actions_communication: actionsCommunication.trim() } : {}),
      ...(observations.trim() ? { observations: observations.trim() } : {}),
      ...(manualData.some((row) => row.key.trim())
        ? { autres_donnees_manuelles: Object.fromEntries(manualData.filter((row) => row.key.trim()).map((row) => [row.key.trim(), row.value.trim()])) }
        : {}),
      ...(articleRows.length
        ? {
            sorties_articles_ajouts: articleRows.map((row): DailyReportItem => ({
              nom: row.nom.trim(),
              quantite: Number(row.quantite),
              sous_total: Number(row.sous_total),
              type: row.type,
            })),
          }
        : {}),
      ...(stockRows.length
        ? {
            entrees_stock_ajouts: stockRows.map((row): DailyStockEntry => ({
              nom: row.nom.trim(),
              quantite_ajoutee: Number(row.quantite_ajoutee),
              type_produit: row.type_produit,
              ...(row.date ? { date: row.date } : {}),
            })),
          }
        : {}),
    };

    try {
      setClosing(true);
      const report = await dailyReportService.closeDay(payload);
      setSelectedReport(report);
      addToast('La journée a été clôturée et le rapport a été généré.', 'success');
      await Promise.all([loadReports(), loadPreview()]);
    } catch (error) {
      const message = extractApiError(error, 'Impossible de clôturer la journée.');
      setCloseError(message);
      addToast(message, 'error');
    } finally {
      setClosing(false);
    }
  };

  const updateManualData = (index: number, key: 'key' | 'value', value: string) => {
    setManualData((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  };

  const updateManualArticle = (index: number, key: keyof ManualArticleRow, value: string) => {
    setManualArticles((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  };

  const updateManualStock = (index: number, key: keyof ManualStockRow, value: string) => {
    setManualStock((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  };

  const clearFilters = () => {
    const empty = { date: '', date_debut: '', date_fin: '', caissiere_id: '' };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  const pdfUrl = selectedReport?.pdf_url || selectedReport?.fichier_pdf;
  const selectedCashierName = cashiers.find((cashier) => String(cashier.id) === cashierId)?.name;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-gold">
            <ClipboardList size={19} />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Caisse & ventes</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Rapports journaliers</h1>
          <p className="mt-1 text-sm text-foreground/45">
            Aperçu des transactions, clôture de caisse et historique PDF.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { loadPreview(); loadReports(); }}
          disabled={previewLoading || reportsLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw size={15} className={previewLoading || reportsLoading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <div className="space-y-6">
          <SectionCard
            title="Aperçu avant clôture"
            action={(
              <button
                type="button"
                onClick={handleCopyPreview}
                disabled={!previewText}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-foreground/70 transition-colors hover:bg-white/5 disabled:opacity-40"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                Copier WhatsApp
              </button>
            )}
          >
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <TextField label="Date du rapport" type="date" value={reportDate} onChange={setReportDate} />
              {isAdmin && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-foreground/60">Caissière</span>
                  <select
                    value={cashierId}
                    onChange={(event) => setCashierId(event.target.value)}
                    disabled={cashierLoading}
                    className="w-full rounded-xl border border-white/10 bg-[#151515] px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold/60 disabled:opacity-60"
                  >
                    <option value="">Sélectionner une caissière</option>
                    {cashiers.map((cashier) => (
                      <option key={cashier.id} value={cashier.id}>
                        {cashier.name}{cashier.active ? '' : ' (inactive)'}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {previewLoading ? (
              <div className="flex min-h-44 items-center justify-center gap-2 text-sm text-foreground/45">
                <Loader2 className="animate-spin text-gold" size={18} />
                Chargement des ventes et mouvements…
              </div>
            ) : previewError ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">{previewError}</div>
            ) : preview ? (
              <>
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ['Recette', formatAmount(preview.recette_totale)],
                    ['Ventes', preview.nombre_ventes ?? '—'],
                    ['Dépenses', formatAmount(preview.total_depenses)],
                    ['Caissière', preview.caissiere_nom || selectedCashierName || '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-black/15 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">{label}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="max-h-[440px] overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-4">
                  {previewText ? (
                    <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-foreground/80">{previewText}</pre>
                  ) : (
                    <p className="text-sm text-foreground/45">Le serveur n’a pas fourni le texte de prévisualisation.</p>
                  )}
                </div>
              </>
            ) : null}
          </SectionCard>

          <SectionCard title="Ventes, entrées et dépenses du jour">
            {previewLoading ? (
              <div className="flex items-center gap-2 text-sm text-foreground/45"><Loader2 className="animate-spin" size={16} /> Chargement…</div>
            ) : !preview ? (
              <p className="text-sm text-foreground/45">Les données détaillées s’afficheront lorsqu’un aperçu sera disponible.</p>
            ) : (
              <div className="grid gap-5 lg:grid-cols-3">
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/45">Sorties d’articles</h3>
                  <ul className="space-y-2">
                    {(preview.sorties_articles ?? []).map((item, index) => (
                      <li key={`${item.nom}-${index}`} className="flex justify-between gap-3 border-b border-white/5 pb-2 text-xs">
                        <span className="text-foreground/75">{item.nom} <span className="text-foreground/40">× {item.quantite}</span></span>
                        <span className="shrink-0 text-foreground/55">{formatAmount(item.sous_total)}</span>
                      </li>
                    ))}
                    {!preview.sorties_articles?.length && <li className="text-xs text-foreground/35">Aucune vente détaillée.</li>}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/45">Entrées de stock</h3>
                  <ul className="space-y-2">
                    {(preview.entrees_stock ?? []).map((entry, index) => (
                      <li key={`${entry.nom}-${index}`} className="border-b border-white/5 pb-2 text-xs text-foreground/75">
                        {entry.nom} <span className="text-foreground/40">(+{entry.quantite_ajoutee})</span>
                        {entry.date && <span className="ml-1 text-foreground/40">à {entry.date}</span>}
                      </li>
                    ))}
                    {!preview.entrees_stock?.length && <li className="text-xs text-foreground/35">Aucune entrée de stock.</li>}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/45">Dépenses</h3>
                  <ul className="space-y-2">
                    {(preview.depenses ?? []).map((expense) => (
                      <li key={expense.id} className="flex justify-between gap-3 border-b border-white/5 pb-2 text-xs">
                        <span className="text-foreground/75">{expense.titre}</span>
                        <span className="shrink-0 text-red-300">{formatAmount(expense.montant)}</span>
                      </li>
                    ))}
                    {!preview.depenses?.length && <li className="text-xs text-foreground/35">Aucune dépense.</li>}
                  </ul>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Clôturer la journée">
          <form onSubmit={handleCloseDay} className="space-y-5">
            <p className="text-xs leading-5 text-foreground/45">
              Les ventes, dépenses et mouvements enregistrés seront consolidés automatiquement avec vos éventuelles saisies manuelles.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Heure d’arrivée" value={heureArrivee} onChange={setHeureArrivee} placeholder="09h ou 08h30" />
              <TextField label="Heure de départ" value={heureDepart} onChange={setHeureDepart} placeholder="18h" />
            </div>
            <TextField label="Reste en caisse" value={resteEnCaisse} onChange={setResteEnCaisse} placeholder="97.500f" />

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-foreground/70">Autres données manuelles</h3>
                <button type="button" onClick={() => setManualData((rows) => [...rows, { key: '', value: '' }])} className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold/80">
                  <Plus size={13} /> Ajouter
                </button>
              </div>
              {manualData.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input value={row.key} onChange={(event) => updateManualData(index, 'key', event.target.value)} placeholder="Libellé, ex. Reçu cash" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground outline-none focus:border-gold/60" />
                  <input value={row.value} onChange={(event) => updateManualData(index, 'value', event.target.value)} placeholder="Valeur" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground outline-none focus:border-gold/60" />
                  <button type="button" aria-label="Supprimer cette donnée" onClick={() => setManualData((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} className="rounded-lg p-2 text-foreground/35 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            <ManualArticleEditor rows={manualArticles} onAdd={() => setManualArticles((rows) => [...rows, { nom: '', quantite: '', sous_total: '', type: 'parfum' }])} onChange={updateManualArticle} onRemove={(index) => setManualArticles((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} />
            <ManualStockEditor rows={manualStock} onAdd={() => setManualStock((rows) => [...rows, { nom: '', quantite_ajoutee: '', type_produit: 'parfum', date: '' }])} onChange={updateManualStock} onRemove={(index) => setManualStock((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} />

            <TextField label="Actions de communication" value={actionsCommunication} onChange={setActionsCommunication} placeholder="WhatsApp, TikTok…" />
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-foreground/60">Observations</span>
              <textarea value={observations} onChange={(event) => setObservations(event.target.value)} rows={3} className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold/60" />
            </label>
            {closeError && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">{closeError}</p>}
            <button type="submit" disabled={closing || cashierLoading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-50">
              {closing ? <Loader2 className="animate-spin" size={16} /> : <CalendarDays size={16} />}
              {closing ? 'Génération du rapport…' : 'Clôturer et générer le PDF'}
            </button>
          </form>
        </SectionCard>
      </div>

      <SectionCard
        title="Historique des rapports"
        action={<span className="text-xs text-foreground/40">{reports.length} rapport{reports.length > 1 ? 's' : ''}</span>}
      >
        <form
          onSubmit={(event) => { event.preventDefault(); setAppliedFilters(filters); }}
          className="mb-5 grid gap-3 rounded-xl border border-white/10 bg-black/10 p-4 sm:grid-cols-2 xl:grid-cols-5"
        >
          <TextField label="Date précise" type="date" value={filters.date} onChange={(value) => setFilters((current) => ({ ...current, date: value, date_debut: '', date_fin: '' }))} />
          <TextField label="Du" type="date" value={filters.date_debut} onChange={(value) => setFilters((current) => ({ ...current, date_debut: value, date: '' }))} />
          <TextField label="Au" type="date" value={filters.date_fin} onChange={(value) => setFilters((current) => ({ ...current, date_fin: value, date: '' }))} />
          {isAdmin && (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-foreground/60">Caissière</span>
              <select value={filters.caissiere_id} onChange={(event) => setFilters((current) => ({ ...current, caissiere_id: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#151515] px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold/60">
                <option value="">Toutes les caissières</option>
                {cashiers.map((cashier) => <option key={cashier.id} value={cashier.id}>{cashier.name}</option>)}
              </select>
            </label>
          )}
          <div className="flex items-end gap-2">
            <button type="submit" className="flex-1 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-white/15">Filtrer</button>
            <button type="button" onClick={clearFilters} className="rounded-xl border border-white/10 px-3 py-2.5 text-sm text-foreground/60 hover:bg-white/5">Effacer</button>
          </div>
        </form>

        {reportsLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-foreground/45"><Loader2 className="animate-spin text-gold" size={17} /> Chargement de l’historique…</div>
        ) : reports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-foreground/40">Aucun rapport pour ces critères.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                <tr className="border-b border-white/10">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Caissière</th>
                  <th className="px-3 py-3">Ventes</th>
                  <th className="px-3 py-3">Dépenses</th>
                  <th className="px-3 py-3">Caisse restante</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-white/[0.025]">
                    <td className="px-3 py-3 text-foreground/75">{formatDate(report.date)}</td>
                    <td className="px-3 py-3 text-foreground/65">{report.caissiere_nom || `#${report.caissiere}`}</td>
                    <td className="px-3 py-3 font-medium text-foreground">{formatAmount(report.recette_totale)}</td>
                    <td className="px-3 py-3 text-red-300">{formatAmount(report.total_depenses)}</td>
                    <td className="px-3 py-3 text-foreground/65">{report.reste_en_caisse || '—'}</td>
                    <td className="px-3 py-3 text-right">
                      <button type="button" onClick={() => openReport(report.id)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gold hover:bg-gold/10">Détails</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {(selectedReport || detailLoading) && (
        <div role="dialog" aria-modal="true" aria-label="Détail du rapport" className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm" onClick={(event) => { if (event.target === event.currentTarget) setSelectedReport(null); }}>
          <div className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#101010] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#101010] px-5 py-4">
              <div>
                <h2 className="font-semibold text-foreground">Détail du rapport</h2>
                {selectedReport && <p className="mt-0.5 text-xs text-foreground/45">{formatDate(selectedReport.date)} · {selectedReport.caissiere_nom}</p>}
              </div>
              <button type="button" onClick={() => setSelectedReport(null)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-foreground/60 hover:bg-white/5">Fermer</button>
            </div>
            {detailLoading || !selectedReport ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-foreground/45"><Loader2 className="animate-spin text-gold" size={18} /> Chargement…</div>
            ) : (
              <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Summary label="Recette" value={formatAmount(selectedReport.recette_totale)} />
                  <Summary label="Dépenses" value={formatAmount(selectedReport.total_depenses)} />
                  <Summary label="Reste en caisse" value={selectedReport.reste_en_caisse || '—'} />
                  <Summary label="Horaires" value={`${selectedReport.heure_arrivee || '—'} → ${selectedReport.heure_depart || '—'}`} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {pdfUrl && <a href={pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-black hover:bg-gold/90"><Download size={14} /> Ouvrir le PDF</a>}
                  <button type="button" onClick={regeneratePdf} disabled={regeneratingPdf} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-foreground/70 hover:bg-white/5 disabled:opacity-50">
                    {regeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Régénérer le PDF
                  </button>
                  {!pdfUrl && <span className="self-center text-xs text-foreground/40">Aucun lien PDF disponible.</span>}
                </div>
                <ReportList title="Sorties d’articles" items={selectedReport.sorties_articles ?? []} />
                <ReportList title="Entrées de stock" items={selectedReport.entrees_stock ?? []} />
                <ReportList title="Dépenses" items={selectedReport.depenses ?? []} />
                {selectedReport.autres_donnees_manuelles && Object.entries(selectedReport.autres_donnees_manuelles).length > 0 && (
                  <div className="rounded-xl border border-white/10 p-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/45">Autres données</h3>
                    {Object.entries(selectedReport.autres_donnees_manuelles).map(([key, value]) => <p key={key} className="text-sm text-foreground/75">{key} : {value}</p>)}
                  </div>
                )}
                {(selectedReport.actions_communication || selectedReport.observations) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedReport.actions_communication && <Summary label="Communication" value={selectedReport.actions_communication} />}
                    {selectedReport.observations && <Summary label="Observations" value={selectedReport.observations} />}
                  </div>
                )}
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/45">Texte du rapport</h3>
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-foreground/75">{selectedReport.texte_formate || 'Texte indisponible.'}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-foreground/85">{value}</p>
    </div>
  );
}

function ReportList({ title, items }: { title: string; items: Array<DailyReportItem | DailyStockEntry | { id: number; titre: string; montant: number; description: string }> }) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/45">{title}</h3>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={`${'nom' in item ? item.nom : item.titre}-${index}`} className="flex flex-wrap justify-between gap-2 border-b border-white/5 pb-2 text-sm last:border-0 last:pb-0">
              <span className="text-foreground/75">
                {'nom' in item
                  ? `${item.nom} · ${'quantite' in item ? `× ${item.quantite}` : `+${item.quantite_ajoutee}`}`
                  : item.titre}
              </span>
              <span className="text-foreground/50">
                {'sous_total' in item ? formatAmount(item.sous_total) : 'montant' in item ? formatAmount(item.montant) : item.date || ''}
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="text-xs text-foreground/35">Aucune donnée.</p>}
    </div>
  );
}

function ManualArticleEditor({
  rows,
  onAdd,
  onChange,
  onRemove,
}: {
  rows: ManualArticleRow[];
  onAdd: () => void;
  onChange: (index: number, key: keyof ManualArticleRow, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-foreground/70">Articles vendus hors système</h3>
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold/80"><Plus size={13} /> Ajouter</button>
      </div>
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 p-2 sm:grid-cols-[1.3fr_0.7fr_0.9fr_0.9fr_auto]">
          <input value={row.nom} onChange={(event) => onChange(index, 'nom', event.target.value)} placeholder="Nom" className="col-span-2 rounded-lg bg-black/20 px-2.5 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-gold/60 sm:col-span-1" />
          <input type="number" min="1" step="any" value={row.quantite} onChange={(event) => onChange(index, 'quantite', event.target.value)} placeholder="Qté" className="rounded-lg bg-black/20 px-2.5 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-gold/60" />
          <input type="number" min="0" step="any" value={row.sous_total} onChange={(event) => onChange(index, 'sous_total', event.target.value)} placeholder="Sous-total" className="rounded-lg bg-black/20 px-2.5 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-gold/60" />
          <select value={row.type} onChange={(event) => onChange(index, 'type', event.target.value)} className="rounded-lg bg-[#151515] px-2.5 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-gold/60">{TYPES_PRODUIT.map((type) => <option key={type} value={type}>{type}</option>)}</select>
          <button type="button" aria-label="Supprimer cet article" onClick={() => onRemove(index)} className="justify-self-end rounded-lg p-2 text-foreground/35 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  );
}

function ManualStockEditor({
  rows,
  onAdd,
  onChange,
  onRemove,
}: {
  rows: ManualStockRow[];
  onAdd: () => void;
  onChange: (index: number, key: keyof ManualStockRow, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-foreground/70">Entrées de stock oubliées</h3>
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold/80"><Plus size={13} /> Ajouter</button>
      </div>
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 p-2 sm:grid-cols-[1.3fr_0.8fr_1fr_0.9fr_auto]">
          <input value={row.nom} onChange={(event) => onChange(index, 'nom', event.target.value)} placeholder="Nom du produit" className="col-span-2 rounded-lg bg-black/20 px-2.5 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-gold/60 sm:col-span-1" />
          <input type="number" min="0.01" step="any" value={row.quantite_ajoutee} onChange={(event) => onChange(index, 'quantite_ajoutee', event.target.value)} placeholder="Quantité" className="rounded-lg bg-black/20 px-2.5 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-gold/60" />
          <select value={row.type_produit} onChange={(event) => onChange(index, 'type_produit', event.target.value)} className="rounded-lg bg-[#151515] px-2.5 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-gold/60">{TYPES_PRODUIT.map((type) => <option key={type} value={type}>{type}</option>)}</select>
          <input value={row.date} onChange={(event) => onChange(index, 'date', event.target.value)} placeholder="Heure, ex. 10:15" className="rounded-lg bg-black/20 px-2.5 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-gold/60" />
          <button type="button" aria-label="Supprimer cette entrée" onClick={() => onRemove(index)} className="justify-self-end rounded-lg p-2 text-foreground/35 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  );
}
