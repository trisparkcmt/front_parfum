'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { formatPrice } from '@/lib/utils';
import { DEFAULT_COMMISSION_PERCENT } from '@/lib/constants';
import {
  Percent, TrendingUp, ShoppingBag,
  Copy, CheckCircle, Palette, ChevronRight, Mail, Phone,
  Wallet, Lock, ArrowDownToLine, ChevronLeft,
} from 'lucide-react';

function PartnerIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M255.366,141.046c-7.4,3.583-14.732,8.548-21.533,15.357c-34.091,34.098-65.081,65.088-65.081,65.088 l0.013,0.02c-0.185,0.186-0.371,0.338-0.557,0.53c-8.824,8.831-9.174,22.909-1.025,32.146c0.323,0.371,0.668,0.736,1.025,1.086 c9.161,9.174,24.036,9.196,33.232,0l35.797-35.797c6.176,2.263,12.248,3.583,18.074,4.243c7.937,0.88,15.392,0.55,22.022-0.385 c16.162-2.29,14.47-1.623,23.844-4.704c9.353-3.068,19.862-9.354,19.862-9.354l6.362,6.355 c0.701,0.681,16.919,16.925,25.192,25.185c1.465,1.471,2.709,2.682,3.542,3.549c0.956,0.997,2.022,1.719,2.682,2.682l41.278,41.279 c11.898-13.35,25.488-33.232,23.81-56.058L320.763,129.14C320.763,129.14,285.062,126.589,255.366,141.046z"/>
      <path d="M261.115,394.362c-9.134-9.147-23.961-9.147-33.101,0l-6.794,6.794c9.119-9.132,9.112-23.926-0.021-33.066 c-9.14-9.126-23.947-9.126-33.087,0.007c9.14-9.133,9.14-23.94,0-33.087c-9.133-9.148-23.947-9.133-33.087,0 c9.14-9.133,9.14-23.947,0-33.095c-9.134-9.132-23.947-9.132-33.088,0.014l-20.46,20.453c-9.14,9.147-9.14,23.947,0,33.094 c9.133,9.134,23.941,9.134,33.08,0c-9.14,9.134-9.14,23.947,0,33.087c9.147,9.133,23.954,9.133,33.094,0 c-9.14,9.133-9.14,23.941,0,33.088c9.14,9.133,23.947,9.133,33.088,0l6.802-6.809c-9.119,9.147-9.113,23.94,0.02,33.081 c9.14,9.132,23.947,9.132,33.088,0l20.467-20.468C270.248,418.302,270.248,403.495,261.115,394.362z"/>
      <path d="M507.987,178.28L387.543,57.822c-5.351-5.337-14.002-5.337-19.339,0l-38.631,38.63 c-5.337,5.337-5.337,13.989,0,19.333l120.458,120.451c5.33,5.35,13.996,5.35,19.326,0l38.63-38.638 C513.338,192.276,513.338,183.624,507.987,178.28z M473.655,204.992c-5.75,5.736-15.048,5.736-20.777,0 c-5.735-5.743-5.735-15.041,0-20.777c5.729-5.736,15.027-5.736,20.777,0C479.391,189.951,479.384,199.249,473.655,204.992z"/>
      <path d="M182.417,99.864l-38.624-38.63c-5.336-5.337-13.995-5.337-19.332,0L4.003,181.691 c-5.337,5.323-5.337,13.989,0,19.319l38.631,38.644c5.33,5.331,14.002,5.331,19.325,0l120.458-120.458 C187.761,113.859,187.761,105.207,182.417,99.864z M59.118,208.403c-5.736,5.729-15.04,5.729-20.777,0 c-5.735-5.742-5.735-15.041,0-20.777c5.736-5.735,15.041-5.735,20.777,0C64.854,193.362,64.854,202.66,59.118,208.403z"/>
      <path d="M397.528,312.809l-7.468-7.482l-72.509-72.509l-4.883,2.166l-5.316,1.919l-0.384,0.117 c-0.936,0.296-9.684,2.971-26.932,5.412c-9.12,1.273-18.156,1.431-26.904,0.434c-3.459-0.385-6.898-0.95-10.296-1.692 l-27.757,27.744c-16.678,16.678-43.836,16.678-60.514,0c-0.585-0.591-1.149-1.19-1.671-1.781l-0.179-0.2 c-10.529-11.939-13.204-28.28-8.252-42.461l10.673-16.609l-0.02-0.02l65.081-65.074c2.647-2.641,5.426-5.103,8.314-7.428 c-20.281-3.982-37.296-2.806-37.296-2.806L88.093,235.679c-1.389,18.988,11.651,39.799,20.928,51.952 c16.692-15.963,43.239-15.756,59.641,0.654c6.107,6.1,9.952,13.617,11.574,21.498c7.895,1.637,15.406,5.475,21.513,11.582 c6.107,6.114,9.952,13.631,11.575,21.519c7.888,1.623,15.412,5.46,21.513,11.568c4.078,4.078,7.152,8.783,9.222,13.817 c11.1-0.137,22.242,4.016,30.688,12.455c16.65,16.636,16.643,43.733,0,60.363l-6.809,6.822l3.411,3.412 c9.148,9.147,23.954,9.147,33.095,0c9.14-9.134,9.14-23.947,0-33.088l6.808,6.83c9.147,9.133,23.947,9.133,33.087,0 c9.14-9.147,9.147-23.954,0-33.101c9.147,9.147,23.947,9.147,33.087,0c9.134-9.126,9.154-23.94,0-33.088 c9.154,9.148,23.954,9.148,33.088,0c9.147-9.132,9.147-23.947,0-33.08L397.528,312.809z"/>
    </svg>
  );
}
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { BackButton } from '@/components/ui/BackButton';
import { usePartnerDashboard, type PartnerHistoryEntry, type PartnerPayout } from '@/hooks/usePartnerDashboard';

function operationLabel(type: string) {
  switch (type) {
    case 'vente': return 'Vente';
    case 'retrait': return 'Retrait';
    case 'bonus': return 'Bonus';
    default: return type;
  }
}

function operationBadgeClass(type: string) {
  switch (type) {
    case 'vente': return 'text-emerald-400 bg-emerald-400/10';
    case 'retrait': return 'text-red-400 bg-red-400/10';
    case 'bonus': return 'text-amber-400 bg-amber-400/10';
    default: return 'text-foreground/60 bg-white/10';
  }
}

function payoutBadgeClass(statut: string) {
  switch (statut) {
    case 'succes': return 'text-emerald-400 bg-emerald-400/10';
    case 'en_cours': return 'text-amber-400 bg-amber-400/10';
    case 'echec': return 'text-red-400 bg-red-400/10';
    default: return 'text-foreground/60 bg-white/10';
  }
}

export default function PartnerDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: dashboardData, loading, error, toNumber } = usePartnerDashboard();
  const [copied, setCopied] = useState(false);
  const [payoutPage, setPayoutPage] = useState(1);
  const [operationPage, setOperationPage] = useState(1);
  const pageSize = 10;

  const rawUser = user as any;

  const firstName = rawUser?.first_name || rawUser?.firstName || '';
  const lastName = rawUser?.last_name || rawUser?.lastName || '';
  const email = rawUser?.email || '';
  const telephone = rawUser?.telephone || '';
  const roles = rawUser?.roles || ['client'];
  const isPartner = roles.includes('prestataire') || roles.includes('partner');

  const partnerCode = dashboardData?.code_promo || '';
  const totalCommission = toNumber(dashboardData?.solde_commission);
  const totalEarnings = toNumber(dashboardData?.total_gains);
  const totalWithdrawals = toNumber(dashboardData?.total_retraits);
  const blockedBalance = toNumber(dashboardData?.solde_bloque);
  const commissionRate = toNumber(dashboardData?.taux_commission) || DEFAULT_COMMISSION_PERCENT;
  const clientDiscount = toNumber(dashboardData?.reduction_client_pourcentage);
  const operationHistory = dashboardData?.historique || dashboardData?.historique_recent || [];
  const recentHistory = dashboardData?.historique_recent || dashboardData?.historique || [];
  const recentPayouts = dashboardData?.payouts_recents || [];
  const payoutPageCount = Math.max(1, Math.ceil(recentPayouts.length / pageSize));
  const operationPageCount = Math.max(1, Math.ceil(recentHistory.length / pageSize));
  const visiblePayouts = recentPayouts.slice((payoutPage - 1) * pageSize, payoutPage * pageSize);
  const visibleOperations = recentHistory.slice((operationPage - 1) * pageSize, operationPage * pageSize);

  const Pagination = ({
    page,
    pageCount,
    onChange,
  }: {
    page: number;
    pageCount: number;
    onChange: (nextPage: number) => void;
  }) => (
    <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-foreground/50">
      <span>{t('page', { defaultValue: 'Page' })} {page} / {pageCount}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label={t('previous', { defaultValue: 'Précédent' })}
          className="rounded-lg border border-white/10 p-1.5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === pageCount}
          aria-label={t('next', { defaultValue: 'Suivant' })}
          className="rounded-lg border border-white/10 p-1.5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );

  const salesHistory = operationHistory.filter(
    (op: PartnerHistoryEntry) => op.type_operation === 'vente'
  );
  const totalOrdersCount = salesHistory.length;
  const convertedClients = new Set(
    salesHistory.map((op: PartnerHistoryEntry) => op.reference_commande).filter(Boolean)
  ).size;

  const handleCopy = () => {
    if (!partnerCode) return;
    navigator.clipboard.writeText(partnerCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="p-6 text-center text-foreground/60">{t('Loading...')}</div>;
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 py-4 sm:py-6">
      <BackButton />

      {error && !dashboardData?.code_promo && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* User Information Profile Quick view */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            {firstName} {lastName}
            <span className="text-[10px] bg-gold/20 text-gold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">
              {isPartner ? 'Prestataire' : 'Client'}
            </span>
          </h2>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-foreground/60">
            {email && <span className="flex items-center gap-1"><Mail size={14} /> {email}</span>}
            {telephone && <span className="flex items-center gap-1"><Phone size={14} /> +{telephone}</span>}
          </div>
        </div>
      </div>

      {/* Commission banner */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-foreground relative overflow-hidden shadow-sm shadow-amber-500/20">
        <div className="absolute top-0 right-0 text-white/10">
          <PartnerIcon className="h-[120px] w-[120px]" />
        </div>
        <div className="relative z-10">
          <p className="text-sm text-foreground/70 mb-1 font-medium">{t('your_commissions')}</p>
          <h1 className="text-3xl font-bold mb-2">{formatPrice(totalCommission)}</h1>
          <p className="text-sm text-foreground/80 mb-4 font-medium">
            {t('earn_commission_desc', { percent: commissionRate })}
            {clientDiscount > 0 && (
              <span className="block mt-1 text-xs opacity-80">
                Réduction client : {clientDiscount}%
              </span>
            )}
          </p>
          {partnerCode && (
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2 flex items-center gap-3 border border-white/10">
                <span className="font-mono font-bold text-lg">{partnerCode}</span>
                <button onClick={handleCopy} className="p-1 rounded hover:bg-white/20 transition-colors">
                  {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">
                {copied ? t('copied') : t('your_promo_code')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('total_sales_label'), value: totalOrdersCount, icon: <ShoppingBag size={18} />, color: 'text-gold bg-gold/10' },
          { label: t('revenue_generated_label'), value: formatPrice(totalEarnings), icon: <TrendingUp size={18} />, color: 'text-emerald-400 bg-emerald-400/10' },
          { label: t('commission_label'), value: formatPrice(totalCommission), icon: <Percent size={18} />, color: 'text-amber-400 bg-amber-400/10' },
          { label: t('converted_clients_label'), value: convertedClients, icon: <Users size={18} />, color: 'text-purple-400 bg-purple-400/10' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-foreground/40 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Balance details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total gains', value: formatPrice(totalEarnings), icon: <Wallet size={18} />, color: 'text-emerald-400 bg-emerald-400/10' },
          { label: 'Total retraits', value: formatPrice(totalWithdrawals), icon: <ArrowDownToLine size={18} />, color: 'text-blue-400 bg-blue-400/10' },
          { label: 'Solde bloqué', value: formatPrice(blockedBalance), icon: <Lock size={18} />, color: 'text-orange-400 bg-orange-400/10' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-foreground/40 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent payouts */}
      {recentPayouts.length > 0 && (
        <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="font-semibold text-foreground">Retraits récents</h2>
            <p className="text-xs text-foreground/40 mt-0.5">Historique de vos demandes de retrait</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {['Référence', 'Date', 'Montant', 'Téléphone', 'Statut'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {visiblePayouts.map((payout: PartnerPayout) => (
                  <tr key={payout.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-gold font-semibold truncate max-w-[140px]">
                      {payout.reference_unique}
                    </td>
                    <td className="px-5 py-4 text-xs text-foreground/40">
                      {new Date(payout.date_creation).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-4 font-bold text-foreground">
                      {formatPrice(parseFloat(payout.montant))}
                    </td>
                    <td className="px-5 py-4 text-xs text-foreground/60">{payout.telephone_destination}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight ${payoutBadgeClass(payout.statut)}`}>
                        {payout.statut.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={payoutPage} pageCount={payoutPageCount} onChange={setPayoutPage} />
        </div>
      )}

      {/* Sales / operations table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">{t('recent_sales')}</h2>
            <p className="text-xs text-foreground/40 mt-0.5">{t('recent_sales_desc')}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                {['ID', t('Date'), t('Statut'), t('Description'), t('Commission')].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {recentHistory.length > 0 ? (
                visibleOperations.map((op) => {
                  const amount = parseFloat(op.montant);
                  const isNegative = amount < 0;
                  return (
                    <tr key={op.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-5 py-4 font-mono text-xs text-gold font-semibold">
                        #{op.reference_commande || `OP-${op.id}`}
                      </td>
                      <td className="px-5 py-4 text-xs text-foreground/40">
                        {new Date(op.date_operation).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight ${operationBadgeClass(op.type_operation)}`}>
                          {operationLabel(op.type_operation)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-foreground font-medium">{op.description || '—'}</td>
                      <td className={`px-5 py-4 font-bold ${isNegative ? 'text-red-400' : 'text-amber-400'}`}>
                        {isNegative ? '' : '+'}{formatPrice(amount)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-foreground/40 font-medium">
                    {t('none_with_code')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={operationPage} pageCount={operationPageCount} onChange={setOperationPage} />
      </div>

    </div>
  );
}
