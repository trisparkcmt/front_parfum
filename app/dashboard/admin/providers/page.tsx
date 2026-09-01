'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  Loader2,
  ArrowLeft,
  Calendar,
  Target,
  ShieldCheck,
  History,
  Save,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Eye,
  CreditCard,
  Copy,
  Check,
  Coins,
  Award,
  Send,
  Percent,
  CheckCircle,
  RefreshCw,
  X
} from 'lucide-react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { SlideOver } from '@/components/ui/SlideOver';
import { localAuth } from '@/lib/localAuth';
import { CustomSelect } from '@/components/ui/CustomSelect';

// Helper utilities
function cx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Shared StatusChip Component
function StatusChip({ status }: { status: string }) {
  const normalized = (status || '').toLowerCase();
  
  let style = 'bg-white/5 text-foreground/40 ring-white/10';
  let dotStyle = 'bg-foreground/40';
  let label = status;

  if (normalized === 'actif' || normalized === 'succes') {
    style = 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20';
    dotStyle = 'bg-emerald-400';
    label = normalized === 'succes' ? 'réussi' : 'actif';
  } else if (normalized === 'suspendu' || normalized === 'echec') {
    style = 'bg-red-500/10 text-red-400 ring-red-500/20';
    dotStyle = 'bg-red-400';
    label = normalized === 'echec' ? 'échoué' : 'suspendu';
  } else if (normalized === 'en_attente' || normalized === 'en cours') {
    style = 'bg-amber-500/10 text-amber-400 ring-amber-500/20';
    dotStyle = 'bg-amber-400';
    label = 'en attente';
  }

  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset", style)}>
      <span className={cx("h-1.5 w-1.5 rounded-full", dotStyle)} />
      <span className="capitalize">{label}</span>
    </span>
  );
}

// Shared IconButton Primitive
function IconButton({
  onClick,
  icon: Icon,
  variant = 'gold',
  title,
  disabled
}: {
  onClick: () => void;
  icon: any;
  variant?: 'gold' | 'red' | 'blue';
  title?: string;
  disabled?: boolean;
}) {
  const hoverStyles = {
    gold: 'hover:text-gold hover:bg-gold/10',
    red: 'hover:text-red-400 hover:bg-red-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cx(
        "rounded-md p-1.5 text-foreground/45 transition-colors disabled:opacity-40",
        hoverStyles[variant]
      )}
    >
      <Icon size={14} />
    </button>
  );
}

// Type definitions for Type-Safety
interface ProviderUserDetails {
  id: number;
  email: string;
  telephone: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Provider {
  id: string;
  user_details?: ProviderUserDetails;
  solde_commission?: string;
  taux_commission?: string;
  reduction_client_pourcentage?: string;
  code_promo?: string;
  statut: string;
  date_creation?: string;
}

interface PayoutTransaction {
  id: number;
  prestataire: number;
  montant: string;
  telephone_destination: string;
  reference_unique: string;
  statut: string;
  motif_echec: string | null;
  date_creation: string;
  date_finalisation: string | null;
}

interface OperationLog {
  id: number;
  type_operation: 'credit' | 'retrait';
  montant: string;
  reference_commande?: string;
  date_operation: string;
  description: string;
}

interface ProviderDashboardData {
  id: number;
  solde_commission: string;
  taux_commission: string;
  reduction_client_pourcentage: string;
  code_promo: string;
  statut: string;
  total_gains: string;
  total_retraits: string;
  solde_bloque: string;
  payouts_recents: PayoutTransaction[];
  historique_recent: OperationLog[];
}

export default function ProviderDashboardPage() {
  // Navigation & view states
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  
  // List view states
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [providerPage, setProviderPage] = useState(1);
  const [operationPage, setOperationPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const pageSize = 10;

  // Detail view dashboard states
  const [data, setData] = useState<ProviderDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const { addToast } = useToastStore();

  // Detail view active tab ('operations' | 'payouts')
  const [activeTab, setActiveTab] = useState<'operations' | 'payouts'>('operations');

  // Edit states
  const [updateComm, setUpdateComm] = useState('');
  const [updateDisc, setUpdateDisc] = useState('');
  const [updateStatut, setUpdateStatut] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Approval/Validation states
  const [approvingProvider, setApprovingProvider] = useState<Provider | null>(null);
  const [validateComm, setValidateComm] = useState('10');
  const [validateDisc, setValidateDisc] = useState('5');
  const [isValidating, setIsValidating] = useState(false);

  // Payout states
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [isInitiatingPayout, setIsInitiatingPayout] = useState(false);
  const [verifyingPayoutId, setVerifyingPayoutId] = useState<number | null>(null);

  // Copy indicator state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // 1. Fetch provider list
  const fetchProviders = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await adminService.getProviders({
        statut: statusFilter !== 'all' ? statusFilter : undefined,
      });
      const list = Array.isArray(res) ? res : res.results || res.resultats || [];
      setProviders(list);
    } catch (error) {
      console.error('Error fetching providers:', error);
      addToast('Erreur lors de la récupération des prestataires', 'error');
    } finally {
      setLoadingList(false);
    }
  }, [statusFilter, addToast]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!selectedProvider) {
        await Promise.resolve();
        if (active) {
          fetchProviders();
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [selectedProvider, fetchProviders]);

  // 2. Fetch specific provider dashboard data
  const fetchDashboard = useCallback(async (providerId: string) => {
    try {
      setLoadingDashboard(true);
      const res = await adminService.getProviderDashboard(providerId);
      setData(res);
      setUpdateComm(String(res.taux_commission || '0'));
      setUpdateDisc(String(res.reduction_client_pourcentage || '0'));
      setUpdateStatut(String(res.statut || 'actif'));
    } catch (error) {
      console.error('Error fetching provider dashboard:', error);
      addToast('Erreur lors du chargement des statistiques du prestataire', 'error');
    } finally {
      setLoadingDashboard(false);
    }
  }, [addToast]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (selectedProvider) {
        await Promise.resolve();
        if (active) {
          fetchDashboard(selectedProvider.id);
          setPayoutPhone(selectedProvider.user_details?.telephone || '');
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [selectedProvider, fetchDashboard]);

  // 3. Update financial settings for an active/suspended provider
  const handleUpdate = async () => {
    if (!selectedProvider) return;
    try {
      setIsSaving(true);
      await adminService.updateProvider(Number(selectedProvider.id), {
        taux_commission: parseFloat(updateComm),
        reduction_client_pourcentage: parseFloat(updateDisc),
        statut: updateStatut,
      });
      addToast('Règles financières mises à jour', 'success');
      
      setSelectedProvider((prev: Provider | null) => prev ? { ...prev, statut: updateStatut } : null);
      fetchDashboard(selectedProvider.id);
    } catch (error) {
      console.error('Update failed:', error);
      addToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Validate and activate a pending provider application
  const handleValidateProvider = async () => {
    if (!approvingProvider) return;
    const comm = parseFloat(validateComm);
    const disc = parseFloat(validateDisc);
    
    if (isNaN(comm) || comm < 0 || isNaN(disc) || disc < 0) {
      addToast('Veuillez entrer des taux valides', 'error');
      return;
    }

    try {
      setIsValidating(true);
      await adminService.validateProvider(Number(approvingProvider.id), {
        taux_commission: comm,
        reduction_client_pourcentage: disc,
      });
      addToast('Le prestataire a été approuvé et activé avec succès', 'success');
      setApprovingProvider(null);
      fetchProviders();
    } catch (error) {
      console.error('Validation failed:', error);
      addToast('Erreur lors de la validation du prestataire', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  // 5. Initiate a Monetbil Mobile Money payout order
  const handleInitiatePayout = async () => {
    if (!selectedProvider || !payoutAmount) return;
    const amount = parseFloat(payoutAmount);
    
    if (isNaN(amount) || amount <= 0) {
      addToast('Veuillez entrer un montant valide', 'error');
      return;
    }
    
    const availableBalance = parseFloat(String(data?.solde_commission || 0));
    if (amount > availableBalance) {
      addToast('Le montant saisi dépasse le solde disponible', 'error');
      return;
    }

    try {
      const isAuthSupported = await localAuth.isSupported();
      if (isAuthSupported) {
        if (!localAuth.isDeviceRegistered()) {
          const confirmSetup = window.confirm(
            "Pour des raisons de sécurité, veuillez lier cet appareil pour les virements en utilisant votre méthode de déverrouillage habituelle (Face ID, Touch ID, code PIN ou mot de passe de l'appareil)."
          );
          if (!confirmSetup) return;

          setIsInitiatingPayout(true);
          await localAuth.registerDevice(selectedProvider.user_details?.email || 'admin@exclusif.cm');
          addToast("Appareil lié avec succès !", "success");
        } else {
          setIsInitiatingPayout(true);
        }

        addToast("Veuillez confirmer l'identité via votre appareil...", "info");
        const authenticated = await localAuth.verifyUser();
        if (!authenticated) {
          addToast("Validation de sécurité requise pour le virement.", "error");
          setIsInitiatingPayout(false);
          return;
        }
      } else {
        const confirmAnyway = window.confirm(
          "Attention : l'authentification locale par biométrie/PIN n'est pas disponible sur cet appareil. Voulez-vous tout de même forcer le virement ?"
        );
        if (!confirmAnyway) return;
        setIsInitiatingPayout(true);
      }

      const randomPart = Math.random().toString(36).substring(2, 6) + '-' + Math.floor(1000 + Math.random() * 9000);
      const todayStr = new Date().toISOString().split('T')[0];
      const extRef = `payout-${todayStr}-uuid-${randomPart}`;

      await adminService.initiateProviderPayout(Number(selectedProvider.id), {
        montant: amount.toFixed(2),
        ...(payoutPhone ? { telephone: payoutPhone } : {}),
        external_reference: extRef
      });
      addToast(`Ordre de virement de ${amount.toLocaleString()} FCFA initié via Monetbil`, 'success');
      setPayoutAmount('');
      fetchDashboard(selectedProvider.id);
    } catch (error: any) {
      console.error('Payout failed:', error);
      const err = error as { response?: { data?: { detail?: string } } };
      const errMsg = err.response?.data?.detail || error.message || 'Erreur lors du déclenchement du virement';
      addToast(errMsg, 'error');
    } finally {
      setIsInitiatingPayout(false);
    }
  };

  // Verify transaction status
  const verifyTransaction = async (payoutId: number) => {
    try {
      setVerifyingPayoutId(payoutId);
      const res = await adminService.verifyPayout(payoutId);
      const newStatus = res.statut || res.status || 'succes';
      
      setData(prev => prev ? {
        ...prev,
        payouts_recents: prev.payouts_recents.map(p => 
          p.id === payoutId 
            ? { 
                ...p, 
                statut: newStatus,
                ...(res.motif_echec !== undefined ? { motif_echec: res.motif_echec } : {})
              } 
            : p
        )
      } : null);

      addToast(`Statut de la transaction vérifié : ${newStatus === 'succes' ? 'Réussi' : newStatus === 'echec' ? 'Échoué' : newStatus}`, 'success');
    } catch (error: any) {
      console.error('Erreur de vérification:', error);
      const errMsg = error?.response?.data?.detail || error?.message || 'Erreur lors de la vérification de la transaction';
      addToast(errMsg, 'error');
    } finally {
      setVerifyingPayoutId(null);
    }
  };

  // Copy link handler
  const handleCopyLink = (code: string) => {
    const text = `exclusif.cm/?ref=${code}`;
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    addToast('Lien de parrainage copié !', 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Calculate dynamic 30 days revenue
  const calculateLast30DaysRevenue = () => {
    if (!data?.historique_recent) return 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return data.historique_recent
      .filter((op: OperationLog) => op.type_operation === 'credit' && new Date(op.date_operation) >= thirtyDaysAgo)
      .reduce((sum: number, op: OperationLog) => sum + parseFloat(String(op.montant || 0)), 0);
  };

  // Filter providers locally
  const filteredProviders = providers.filter((p: Provider) => {
    const userDetails = p.user_details || { id: 0, email: '', telephone: '', first_name: '', last_name: '', role: '' };
    const firstName = (userDetails.first_name || '').toLowerCase();
    const lastName = (userDetails.last_name || '').toLowerCase();
    const email = (userDetails.email || '').toLowerCase();
    const phone = (userDetails.telephone || '').toLowerCase();
    const code = (p.code_promo || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    return (
      firstName.includes(query) ||
      lastName.includes(query) ||
      email.includes(query) ||
      phone.includes(query) ||
      code.includes(query)
    );
  });
  const providerPageCount = Math.max(1, Math.ceil(filteredProviders.length / pageSize));
  const visibleProviders = filteredProviders.slice((providerPage - 1) * pageSize, providerPage * pageSize);
  const operations = data?.historique_recent || [];
  const payouts = data?.payouts_recents || [];
  const operationPageCount = Math.max(1, Math.ceil(operations.length / pageSize));
  const payoutPageCount = Math.max(1, Math.ceil(payouts.length / pageSize));
  const visibleOperations = operations.slice((operationPage - 1) * pageSize, operationPage * pageSize);
  const visiblePayouts = payouts.slice((payoutPage - 1) * pageSize, payoutPage * pageSize);

  // Render provider details dashboard view
  if (selectedProvider) {
    const user = selectedProvider.user_details || { id: 0, email: '', telephone: '', first_name: '', last_name: '', role: '' };

    return (
      <div className="space-y-6">
        {/* Header Read-Only Detail Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedProvider(null);
                setData(null);
                setPayoutAmount('');
                setPayoutPhone('');
              }}
              className="rounded-lg border border-white/10 p-2 text-foreground/60 hover:bg-white/6 hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-foreground/40 uppercase font-semibold tracking-wider">Partenaire</span>
                <StatusChip status={data?.statut || selectedProvider.statut} />
              </div>
              <h1 className="text-xl font-semibold text-foreground mt-0.5">
                {user.first_name || ''} {user.last_name || 'Partenaire'}
              </h1>
              <p className="text-sm text-foreground/40">
                {user.email || 'Email non fourni'} {user.telephone ? `• ${user.telephone}` : ''}
              </p>
            </div>
          </div>

          {data?.code_promo && (
            <div className="flex items-center gap-2 self-start sm:self-auto bg-white/[0.02] border border-white/10 px-3 py-1.5 rounded-lg text-xs font-mono text-gold">
              <Award size={14} />
              <span>Code: {data.code_promo}</span>
            </div>
          )}
        </div>

        {/* Loading detail state */}
        {loadingDashboard ? (
          <div className="flex items-center justify-center gap-2 py-20 text-xs text-foreground/40">
            <Loader2 size={16} className="animate-spin text-gold" />
            <span>Chargement des statistiques...</span>
          </div>
        ) : (
          <>
            {/* KPI Stat Strip */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-white/10 gap-y-4 lg:gap-y-0">
                <div className="px-3 first:pl-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Total Gains</p>
                  <p className="text-xl font-semibold tabular-nums text-foreground mt-1">
                    {parseFloat(String(data?.total_gains || 0)).toLocaleString()} <span className="text-xs text-foreground/40 font-normal">FCFA</span>
                  </p>
                </div>
                <div className="px-3 pt-4 lg:pt-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Total Retraits</p>
                  <p className="text-xl font-semibold tabular-nums text-foreground mt-1">
                    {parseFloat(String(data?.total_retraits || 0)).toLocaleString()} <span className="text-xs text-foreground/40 font-normal">FCFA</span>
                  </p>
                </div>
                <div className="px-3 pt-4 lg:pt-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Revenus 30J</p>
                  <p className="text-xl font-semibold tabular-nums text-foreground mt-1">
                    {calculateLast30DaysRevenue().toLocaleString()} <span className="text-xs text-foreground/40 font-normal">FCFA</span>
                  </p>
                </div>
                <div className="px-3 pt-4 lg:pt-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Solde Actuel</p>
                  <p className="text-xl font-semibold tabular-nums text-gold mt-1">
                    {parseFloat(String(data?.solde_commission || 0)).toLocaleString()} <span className="text-xs text-foreground/40 font-normal">FCFA</span>
                  </p>
                </div>
                <div className="px-3 pt-4 lg:pt-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Solde Bloqué</p>
                  <p className="text-xl font-semibold tabular-nums text-purple-400 mt-1">
                    {parseFloat(String(data?.solde_bloque || 0)).toLocaleString()} <span className="text-xs text-foreground/40 font-normal">FCFA</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Logs / Transactions */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                  {/* Quiet Tabs */}
                  <div className="flex border-b border-white/10 px-4">
                    <button
                      onClick={() => setActiveTab('operations')}
                      className={`py-3 px-2 text-xs font-medium transition-colors border-b-2 flex items-center gap-2 -mb-px ${
                        activeTab === 'operations'
                          ? 'border-gold text-gold font-semibold'
                          : 'border-transparent text-foreground/45 hover:text-foreground'
                      }`}
                    >
                      <History size={14} />
                      Historique des Opérations
                    </button>
                    <button
                      onClick={() => setActiveTab('payouts')}
                      className={`py-3 px-2 text-xs font-medium transition-colors border-b-2 flex items-center gap-2 -mb-px ml-4 ${
                        activeTab === 'payouts'
                          ? 'border-gold text-gold font-semibold'
                          : 'border-transparent text-foreground/45 hover:text-foreground'
                      }`}
                    >
                      <CreditCard size={14} />
                      Transactions Monetbil
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="p-4">
                    {activeTab === 'operations' ? (
                      <div className="space-y-2">
                        {operations.length > 0 ? (
                          visibleOperations.map((log: OperationLog) => (
                            <div
                              key={log.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-md ${
                                  log.type_operation === 'credit'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {log.type_operation === 'credit' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-foreground">{log.description}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {log.reference_commande && (
                                      <span className="font-mono text-[10px] text-foreground/40">
                                        CMD: {log.reference_commande}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-foreground/35">
                                      {new Date(log.date_operation).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className={`font-medium text-xs tabular-nums ${log.type_operation === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {log.type_operation === 'credit' ? '+' : '-'}{parseFloat(log.montant).toLocaleString()} FCFA
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center text-foreground/30 italic text-xs">
                            Aucune opération récente enregistrée.
                          </div>
                        )}
                        {operations.length > pageSize && <div className="flex justify-end gap-2 pt-2"><button disabled={operationPage === 1} onClick={() => setOperationPage((page) => page - 1)} className="px-2 py-1 text-xs border border-white/10 rounded disabled:opacity-30">Précédent</button><span className="text-xs text-foreground/40 self-center">{operationPage}/{operationPageCount}</span><button disabled={operationPage === operationPageCount} onClick={() => setOperationPage((page) => page + 1)} className="px-2 py-1 text-xs border border-white/10 rounded disabled:opacity-30">Suivant</button></div>}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {payouts.length > 0 ? (
                          visiblePayouts.map((payout: PayoutTransaction) => (
                            <div
                              key={payout.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-md bg-white/5 text-foreground/60">
                                  <Coins size={14} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-foreground">
                                      Virement Mobile Money
                                    </span>
                                    <StatusChip status={payout.statut} />
                                    {payout.statut !== 'succes' && payout.statut !== 'echec' && (
                                      <button
                                        type="button"
                                        disabled={verifyingPayoutId === payout.id}
                                        onClick={() => verifyTransaction(payout.id)}
                                        className="px-2 py-0.5 rounded-md border border-white/10 text-[10px] font-medium text-gold hover:bg-white/6 transition-colors flex items-center gap-1 disabled:opacity-50"
                                      >
                                        <RefreshCw size={10} className={verifyingPayoutId === payout.id ? 'animate-spin' : ''} />
                                        <span>Vérifier</span>
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-[10px] font-mono text-foreground/40 mt-0.5">
                                    REF: {payout.reference_unique} • Dest: {payout.telephone_destination}
                                  </p>
                                  {payout.motif_echec && (
                                    <p className="text-[11px] text-red-400 mt-0.5">
                                      Motif: {payout.motif_echec}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-foreground/35 mt-0.5">
                                    {new Date(payout.date_creation).toLocaleDateString('fr-FR', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                              </div>
                              <p className="font-medium text-xs text-foreground tabular-nums">
                                {parseFloat(payout.montant).toLocaleString()} FCFA
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center text-foreground/30 italic text-xs">
                            Aucune transaction de payout enregistrée.
                          </div>
                        )}
                        {payouts.length > pageSize && <div className="flex justify-end gap-2 pt-2"><button disabled={payoutPage === 1} onClick={() => setPayoutPage((page) => page - 1)} className="px-2 py-1 text-xs border border-white/10 rounded disabled:opacity-30">Précédent</button><span className="text-xs text-foreground/40 self-center">{payoutPage}/{payoutPageCount}</span><button disabled={payoutPage === payoutPageCount} onClick={() => setPayoutPage((page) => page + 1)} className="px-2 py-1 text-xs border border-white/10 rounded disabled:opacity-30">Suivant</button></div>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Settings & Payout Form */}
              <div className="space-y-4">
                {/* Edit Config Rules */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="text-gold" size={16} />
                    <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">Paramètres Financiers</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-1 block">
                        Taux Commission (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={updateComm}
                          onChange={e => setUpdateComm(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs text-foreground outline-none focus:border-gold transition-colors"
                          placeholder="Ex: 12.5"
                        />
                        <Percent className="absolute right-2.5 top-2.5 text-foreground/30" size={13} />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-1 block">
                        Réduction Client (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={updateDisc}
                          onChange={e => setUpdateDisc(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs text-foreground outline-none focus:border-gold transition-colors"
                          placeholder="Ex: 5"
                        />
                        <Percent className="absolute right-2.5 top-2.5 text-foreground/30" size={13} />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-1 block">
                        Statut du Compte
                      </label>
                      <CustomSelect
                        value={updateStatut}
                        onChange={setUpdateStatut}
                        options={[
                          { value: 'actif', label: 'Actif' },
                          { value: 'suspendu', label: 'Suspendu' },
                          { value: 'en_attente', label: 'En attente' },
                        ]}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleUpdate}
                      disabled={isSaving}
                      className="w-full bg-gold text-black font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 hover:bg-gold/90 transition-colors disabled:opacity-50 mt-1"
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                      Enregistrer
                    </button>
                  </div>
                </div>

                {/* Mobile Money Payout Trigger */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Coins className="text-gold" size={16} />
                    <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">Virement de Commission</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white/5 border border-white/10 p-2.5 rounded-lg">
                      <p className="text-[10px] text-foreground/40 uppercase font-semibold tracking-wider">Disponible</p>
                      <p className="text-base font-semibold tabular-nums text-gold mt-0.5">
                        {parseFloat(String(data?.solde_commission || 0)).toLocaleString()} FCFA
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-1 block">
                        Montant (FCFA)
                      </label>
                      <input
                        type="number"
                        value={payoutAmount}
                        onChange={e => setPayoutAmount(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold transition-colors"
                        placeholder="Montant en FCFA"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-1 block">
                        Téléphone destination
                      </label>
                      <input
                        type="text"
                        value={payoutPhone}
                        onChange={e => setPayoutPhone(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold transition-colors"
                        placeholder="2376XXXXXXXX"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleInitiatePayout}
                      disabled={isInitiatingPayout || !payoutAmount || parseFloat(payoutAmount) <= 0}
                      className="w-full border border-white/10 text-foreground/60 hover:bg-white/6 hover:text-foreground font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                    >
                      {isInitiatingPayout ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                      Déclencher le virement
                    </button>
                  </div>
                </div>

                {/* Promo Sharing link */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-2">
                    Lien de parrainage
                  </p>
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between gap-2">
                    <p className="text-xs font-mono truncate text-gold">
                      exclusif.cm/?ref={data?.code_promo}
                    </p>
                    <IconButton
                      onClick={() => {
                        if (data?.code_promo) {
                          handleCopyLink(data.code_promo);
                        }
                      }}
                      icon={copiedCode === data?.code_promo ? Check : Copy}
                      variant="gold"
                      title="Copier le lien"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Render provider lists view (default)
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Prestataires</h1>
          <p className="text-sm text-foreground/40 mt-0.5">
            Gestion des comptes prestataires et des règles de commissionnement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchProviders}
            className="flex items-center gap-2 border border-white/10 px-3 py-2 rounded-lg text-xs font-medium text-foreground/60 hover:bg-white/6 transition-colors"
          >
            <RefreshCw size={14} className={loadingList ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/10 gap-y-4 lg:gap-y-0">
          <div className="px-3 first:pl-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Total Partenaires</p>
            <p className="text-xl font-semibold tabular-nums text-foreground mt-1">{providers.length}</p>
          </div>
          <div className="px-3 pt-4 lg:pt-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Actifs</p>
            <p className="text-xl font-semibold tabular-nums text-emerald-400 mt-1">
              {providers.filter(p => p.statut === 'actif').length}
            </p>
          </div>
          <div className="px-3 pt-4 lg:pt-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Suspendus</p>
            <p className="text-xl font-semibold tabular-nums text-red-400 mt-1">
              {providers.filter(p => p.statut === 'suspendu').length}
            </p>
          </div>
          <div className="px-3 pt-4 lg:pt-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">En Attente</p>
            <p className="text-xl font-semibold tabular-nums text-amber-400 mt-1">
              {providers.filter(p => p.statut === 'en_attente').length}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar / Search & Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, email, code promo..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-foreground/40 outline-none focus:border-gold transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFiltersPanel(v => !v)}
            className={cx(
              "flex items-center gap-2 border px-3 py-2 rounded-lg text-xs font-medium transition-colors",
              showFiltersPanel || statusFilter !== 'all'
                ? "border-gold/30 text-gold bg-gold/5"
                : "border-white/10 text-foreground/60 hover:bg-white/6"
            )}
          >
            <Filter size={14} />
            <span>Filtres</span>
            {statusFilter !== 'all' && (
              <span className="h-4 w-4 rounded-full bg-gold text-black font-semibold text-[10px] flex items-center justify-center">
                1
              </span>
            )}
          </button>
        </div>

        {/* Expandable Filter Panel */}
        {showFiltersPanel && (
          <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Statut:</span>
              <div className="flex items-center gap-1">
                {[
                  { id: 'all', label: 'Tous' },
                  { id: 'actif', label: 'Actifs' },
                  { id: 'suspendu', label: 'Suspendus' },
                  { id: 'en_attente', label: 'En attente' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStatusFilter(item.id)}
                    className={cx(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                      statusFilter === item.id
                        ? "bg-gold text-black font-semibold"
                        : "text-foreground/60 hover:bg-white/5"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {statusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="text-xs text-foreground/40 hover:text-foreground transition-colors flex items-center gap-1"
              >
                <X size={12} /> Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {loadingList ? (
          <div className="flex items-center justify-center gap-2 py-20 text-xs text-foreground/40">
            <Loader2 size={16} className="animate-spin text-gold" />
            <span>Chargement des prestataires...</span>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="text-center py-12 text-sm italic text-foreground/30">
            Aucun prestataire trouvé.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/[0.02] border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                <tr>
                  <th className="px-4 py-3">Partenaire</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Commission</th>
                  <th className="px-4 py-3">Réduction</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visibleProviders.map((provider: Provider) => {
                  const user = provider.user_details || { id: 0, email: '', telephone: '', first_name: '', last_name: '', role: '' };
                  
                  return (
                    <tr key={provider.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div>
                            <p className="font-semibold text-foreground">
                              {user.first_name || ''} {user.last_name || 'Partenaire'}
                            </p>
                            {provider.code_promo ? (
                              <span className="font-mono text-[10px] text-gold bg-gold/10 px-1.5 py-0.5 rounded border border-gold/20 inline-block mt-0.5">
                                {provider.code_promo}
                              </span>
                            ) : (
                              <span className="text-[10px] text-foreground/30 italic block mt-0.5">
                                Sans code
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground/70">
                        <p className="font-mono text-[11px]">{user.email || '—'}</p>
                        <p className="text-[10px] text-foreground/40 mt-0.5">{user.telephone || '—'}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground tabular-nums">
                        {parseFloat(provider.taux_commission || '0').toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground tabular-nums">
                        {parseFloat(provider.reduction_client_pourcentage || '0').toFixed(1)}%
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip status={provider.statut} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {provider.statut === 'en_attente' && (
                            <button
                              type="button"
                              onClick={() => {
                                setApprovingProvider(provider);
                                setValidateComm('10');
                                setValidateDisc('5');
                              }}
                              className="rounded-md px-2.5 py-1 text-[11px] font-semibold bg-gold text-black hover:bg-gold/90 transition-colors"
                              title="Valider la postulation"
                            >
                              Valider
                            </button>
                          )}
                          <IconButton
                            onClick={() => setSelectedProvider(provider)}
                            icon={Eye}
                            variant="gold"
                            title="Consulter le dashboard"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filteredProviders.length > pageSize && <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3"><button disabled={providerPage === 1} onClick={() => setProviderPage((page) => page - 1)} className="px-2 py-1 text-xs border border-white/10 rounded disabled:opacity-30">Précédent</button><span className="text-xs text-foreground/40">{providerPage}/{providerPageCount}</span><button disabled={providerPage === providerPageCount} onClick={() => setProviderPage((page) => page + 1)} className="px-2 py-1 text-xs border border-white/10 rounded disabled:opacity-30">Suivant</button></div>}
      </div>

      {/* Validation modal - Form left untouched */}
      {approvingProvider && (
        <SlideOver
          isOpen={!!approvingProvider}
          onClose={() => setApprovingProvider(null)}
          title="Valider le Partenaire"
          description={`Approuver ${(approvingProvider.user_details?.first_name || 'le prestataire')}`}
          size="sm"
          footer={
            <div className="flex items-center gap-3">
              <button
                onClick={() => setApprovingProvider(null)}
                disabled={isValidating}
                className="flex-1 border border-white/10 rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-foreground/60 hover:bg-white/5 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleValidateProvider}
                disabled={isValidating}
                className="flex-1 bg-gold text-black rounded-xl py-3 text-xs font-bold uppercase tracking-wider hover:bg-gold/80 transition-all flex items-center justify-center gap-1.5"
              >
                {isValidating ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                Approuver
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-foreground/40 uppercase mb-2 block tracking-widest">
                Taux Commission (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={validateComm}
                  onChange={e => setValidateComm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm focus:border-gold outline-none transition-all text-foreground font-mono"
                  placeholder="Ex: 10"
                />
                <Percent className="absolute right-3.5 top-3.5 text-foreground/30" size={14} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-foreground/40 uppercase mb-2 block tracking-widest">
                Réduction Client (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={validateDisc}
                  onChange={e => setValidateDisc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm focus:border-gold outline-none transition-all text-foreground font-mono"
                  placeholder="Ex: 5"
                />
                <Percent className="absolute right-3.5 top-3.5 text-foreground/30" size={14} />
              </div>
            </div>
          </div>
        </SlideOver>
      )}
    </div>
  );
}