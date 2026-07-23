'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { formatPrice } from '@/lib/utils';
import { DEFAULT_COMMISSION_PERCENT } from '@/lib/constants';
import {
  Percent, TrendingUp, ShoppingBag, Users,
  Copy, CheckCircle, Palette, ChevronRight, Mail, Phone,
  Wallet, Lock, ArrowDownToLine,
} from 'lucide-react';
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
        <div className="absolute top-0 right-0 opacity-10">
          <Percent size={120} />
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
                {recentPayouts.map((payout: PartnerPayout) => (
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
                recentHistory.map((op) => {
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => router.push('/dashboard/partner/profile')}
          className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm hover:shadow-gold/5 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-foreground mb-3 group-hover:scale-110 transition-transform">
            <Palette size={20} />
          </div>
          <p className="font-semibold text-sm text-foreground">{t('settings_action')}</p>
          <p className="text-xs text-foreground/40 mt-0.5 flex items-center gap-1">
            {t('appearance_desc', { defaultValue: 'Langue, Devise, Apparence' })} <ChevronRight size={12} />
          </p>
        </button>
      </div>
    </div>
  );
}
