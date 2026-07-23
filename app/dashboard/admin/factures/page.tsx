'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Download, Mail, RefreshCw, Loader2, Search,
  CheckCircle, Clock, ArrowUpRight, Link as LinkIcon,
} from 'lucide-react';
import { invoiceService } from '@/services/invoiceService';
import { useToastStore } from '@/store/useToastStore';

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function FacturesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const filtered = search.trim()
    ? invoices.filter(inv => {
        const numeroCommande = inv.commande?.numero_commande || inv.commande;
        return (
          inv.numero_facture?.toLowerCase().includes(search.toLowerCase()) ||
          String(numeroCommande ?? '')?.toLowerCase().includes(search.toLowerCase())
        );
      })
    : invoices;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Factures & Reçus</h1>
          <p className="text-sm text-foreground/40 mt-0.5">
            Gestion de toutes les factures PDF générées
          </p>
        </div>
        <button
          onClick={fetchInvoices}
          className="flex items-center gap-2 border border-white/10 px-4 py-2.5 rounded-xl text-sm text-foreground/60 hover:bg-white/5 transition-all"
        >
          <RefreshCw size={15} />
          Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            label: 'Total factures',
            value: total,
            icon: <FileText size={18} />,
            color: 'text-gold bg-gold/10',
          },
          {
            label: 'Envoyées par email',
            value: invoices.filter(i => i.envoye_par_email).length,
            icon: <Mail size={18} />,
            color: 'text-emerald-400 bg-emerald-500/10',
          },
          {
            label: 'En attente d\'envoi',
            value: invoices.filter(i => !i.envoye_par_email).length,
            icon: <Clock size={18} />,
            color: 'text-amber-400 bg-amber-500/10',
          },
        ].map(k => (
          <div key={k.label} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${k.color}`}>
              {k.icon}
            </div>
            <p className="text-2xl font-bold text-foreground">{k.value}</p>
            <p className="text-xs text-foreground/40 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-sm">
        <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-2 max-w-sm">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par n° facture ou commande..."
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des factures...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {['N° Facture', 'Commande', 'Date émission', 'Montant', 'Email', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-5 py-3.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(inv => (
                  <tr key={inv.numero_facture || inv.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-gold shrink-0" />
                        <span className="font-mono text-xs text-foreground font-semibold">
                          {inv.numero_facture}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono text-foreground/70">
                        {inv.commande?.numero_commande || inv.commande || '—'}
                      </span>
                      {inv.commande?.statut && (
                        <div className="text-[10px] text-foreground/50 mt-1">
                          {inv.commande.statut} · {inv.commande.statut_paiement}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-foreground/60">{fmtDate(inv.date_emission)}</td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-foreground">
                        {inv.montant_total ?? inv.commande?.total_ttc
                          ? `${Number(inv.montant_total ?? inv.commande?.total_ttc).toLocaleString('fr-FR')} FCFA`
                          : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-foreground/50 block">
                        {inv.commande?.client_email || inv.email_envoye_a || '—'}
                      </span>
                      {inv.commande?.client_nom_complet && (
                        <span className="text-[10px] text-foreground/40">
                          {inv.commande.client_nom_complet}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {/* Download PDF */}
                        <button
                          onClick={() => handleDownload(inv)}
                          disabled={downloadingId === inv.numero_facture}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-foreground/40 hover:text-gold transition-colors disabled:opacity-50"
                          title="Télécharger PDF"
                        >
                          {downloadingId === inv.numero_facture
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Download size={14} />}
                        </button>
                        {/* Resend email */}
                        <button
                          onClick={() => handleResend(inv.numero_facture)}
                          disabled={resendingId === inv.numero_facture}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-foreground/40 hover:text-emerald-400 transition-colors disabled:opacity-50"
                          title="Renvoyer par email"
                        >
                          {resendingId === inv.numero_facture
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Mail size={14} />}
                        </button>
                        {/* Direct PDF link */}
                        {inv.fichier_pdf && (
                          <a
                            href={inv.fichier_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-white/10 text-foreground/40 hover:text-blue-400 transition-colors"
                            title="Ouvrir le PDF"
                          >
                            <ArrowUpRight size={14} />
                          </a>
                        )}
                        {inv.commande?.detail_url && (
                          <a
                            href={inv.commande.detail_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-white/10 text-foreground/40 hover:text-emerald-400 transition-colors"
                            title="Voir la commande"
                          >
                            <LinkIcon size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-foreground/30 italic">
                      <div className="flex flex-col items-center gap-3">
                        <FileText size={40} className="text-foreground/10" />
                        <p>Aucune facture trouvée</p>
                      </div>
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
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-white/10 rounded-lg text-xs font-semibold hover:bg-white/5 disabled:opacity-40 transition-colors"
          >
            Précédent
          </button>
          <span className="text-xs text-foreground/40">Page {page} sur {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-white/10 rounded-lg text-xs font-semibold hover:bg-white/5 disabled:opacity-40 transition-colors"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
