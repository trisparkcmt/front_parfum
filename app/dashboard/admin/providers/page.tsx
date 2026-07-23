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
  User,
  CreditCard,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Coins,
  Award,
  Send,
  Percent,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { SlideOver } from '@/components/ui/SlideOver';
import { localAuth } from '@/lib/localAuth';

// Type definitions for Type-Safety and ESLint compliance
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
  statut: string; // 'actif' | 'suspendu' | 'en_attente'
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

  // Detail view dashboard states
  const [data, setData] = useState<ProviderDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const { addToast } = useToastStore();

  // Detail view active tab ('operations' | 'payouts')
  const [activeTab, setActiveTab] = useState<'operations' | 'payouts'>('operations');

  // Edit states (updating existing provider)
  const [updateComm, setUpdateComm] = useState('');
  const [updateDisc, setUpdateDisc] = useState('');
  const [updateStatut, setUpdateStatut] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Approval/Validation states (approving pending requests)
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
        // Resolve microtask to avoid react-hooks/set-state-in-effect synchronous updates
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
        // Resolve microtask to avoid react-hooks/set-state-in-effect synchronous updates
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
      
      // Update local object status
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
      // Local device biometric / PIN verification check
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
        // Fallback or warning if device doesn't support platform biometrics/PIN lock
        const confirmAnyway = window.confirm(
          "Attention : l'authentification locale par biométrie/PIN n'est pas disponible sur cet appareil. Voulez-vous tout de même forcer le virement ?"
        );
        if (!confirmAnyway) return;
        setIsInitiatingPayout(true);
      }

      // Generate a unique external reference for idempotency
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

  // 6. Copy link handler
  const handleCopyLink = (code: string) => {
    const text = `exclusif.cm/?ref=${code}`;
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    addToast('Lien de parrainage copié !', 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // 7. Calculate dynamic 30 days revenue from operations history
  const calculateLast30DaysRevenue = () => {
    if (!data?.historique_recent) return 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return data.historique_recent
      .filter((op: OperationLog) => op.type_operation === 'credit' && new Date(op.date_operation) >= thirtyDaysAgo)
      .reduce((sum: number, op: OperationLog) => sum + parseFloat(String(op.montant || 0)), 0);
  };

  // 8. Filter providers locally based on search query
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

  // Render provider details dashboard view
  if (selectedProvider) {
    const user = selectedProvider.user_details || { id: 0, email: '', telephone: '', first_name: '', last_name: '', role: '' };
    const initials = `${(user.first_name || 'P').charAt(0)}${(user.last_name || '').charAt(0)}`.toUpperCase();

    return (
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSelectedProvider(null);
                setData(null);
                setPayoutAmount('');
                setPayoutPhone('');
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-foreground/60 hover:text-foreground transition-all duration-200"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-gold/10">
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground leading-tight">
                  {user.first_name || ''} {user.last_name || 'Partenaire'}
                </h1>
                <p className="text-xs text-foreground/40 font-mono mt-0.5">{user.email || 'Email non fourni'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {data?.code_promo && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full font-mono text-xs text-gold">
                <Award size={13} />
                <span>{data.code_promo}</span>
              </div>
            )}
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
              data?.statut === 'actif'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : data?.statut === 'suspendu'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {data?.statut || selectedProvider.statut}
            </span>
          </div>
        </div>

        {/* Loading detail state */}
        {loadingDashboard ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement du dashboard partenaire...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                icon={<TrendingUp className="text-emerald-400" size={20} />}
                label="Total Gains Historiques"
                value={`${parseFloat(String(data?.total_gains || 0)).toLocaleString()} FCFA`}
                sub="Total des commissions"
              />
              <MetricCard
                icon={<ArrowUpRight className="text-sky-400" size={20} />}
                label="Total Retraits Effectués"
                value={`${parseFloat(String(data?.total_retraits || 0)).toLocaleString()} FCFA`}
                sub="Commissions retirées"
              />
              <MetricCard
                icon={<Calendar className="text-gold" size={20} />}
                label="Revenus (30 Derniers Jours)"
                value={`${calculateLast30DaysRevenue().toLocaleString()} FCFA`}
                sub="Commissions créditées"
              />
              <MetricCard
                icon={<DollarSign className="text-amber-400" size={20} />}
                label="Solde Actuel"
                value={`${parseFloat(String(data?.solde_commission || 0)).toLocaleString()} FCFA`}
                sub="Prêt pour virement"
              />
              <MetricCard
                icon={<ShieldCheck className="text-purple-400" size={20} />}
                label="Solde Bloqué"
                value={`${parseFloat(String(data?.solde_bloque || 0)).toLocaleString()} FCFA`}
                sub="En attente de déblocage"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Logs / Transactions */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-md shadow-sm">
                  {/* Tabs header */}
                  <div className="flex border-b border-white/10 bg-white/5">
                    <button
                      onClick={() => setActiveTab('operations')}
                      className={`flex-1 py-4 text-center text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center justify-center gap-2 ${
                        activeTab === 'operations'
                          ? 'border-gold text-gold bg-white/5'
                          : 'border-transparent text-foreground/40 hover:text-foreground/80'
                      }`}
                    >
                      <History size={14} />
                      Historique des Opérations
                    </button>
                    <button
                      onClick={() => setActiveTab('payouts')}
                      className={`flex-1 py-4 text-center text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center justify-center gap-2 ${
                        activeTab === 'payouts'
                          ? 'border-gold text-gold bg-white/5'
                          : 'border-transparent text-foreground/40 hover:text-foreground/80'
                      }`}
                    >
                      <CreditCard size={14} />
                      Transactions Monetbil
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="p-6">
                    {activeTab === 'operations' ? (
                      <div className="space-y-4">
                        {data?.historique_recent && data.historique_recent.length > 0 ? (
                          data.historique_recent.map((log: OperationLog) => (
                            <div
                              key={log.id}
                              className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-200"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl border ${
                                  log.type_operation === 'credit'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                                    : 'bg-red-500/10 text-red-400 border-red-500/10'
                                }`}>
                                  {log.type_operation === 'credit' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground/80">{log.description}</p>
                                  {log.reference_commande && (
                                    <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold font-mono bg-white/5 border border-white/5 text-foreground/40 rounded uppercase">
                                      COMMANDE: {log.reference_commande}
                                    </span>
                                  )}
                                  <p className="text-[10px] text-foreground/30 mt-1 uppercase font-medium">
                                    {new Date(log.date_operation).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                              </div>
                              <p className={`font-bold text-sm ${log.type_operation === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {log.type_operation === 'credit' ? '+' : '-'}{parseFloat(log.montant).toLocaleString()} FCFA
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-foreground/40 italic text-sm">
                            Aucune opération récente enregistrée.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {data?.payouts_recents && data.payouts_recents.length > 0 ? (
                          data.payouts_recents.map((payout: PayoutTransaction) => (
                            <div
                              key={payout.id}
                              className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-200"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl border ${
                                  payout.statut === 'succes'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                                    : payout.statut === 'echec'
                                    ? 'bg-red-500/10 text-red-400 border-red-500/10'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/10'
                                }`}>
                                  <Coins size={18} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground/80">
                                      Virement Mobile Money
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                                      payout.statut === 'succes'
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : payout.statut === 'echec'
                                        ? 'bg-red-500/10 text-red-400'
                                        : 'bg-amber-500/10 text-amber-400'
                                    }`}>
                                      {payout.statut === 'succes' ? 'réussi' : payout.statut === 'echec' ? 'échoué' : 'en cours'}
                                    </span>
                                    {payout.statut !== 'succes' && payout.statut !== 'echec' && (
                                      <button
                                        disabled={verifyingPayoutId === payout.id}
                                        onClick={() => verifyTransaction(payout.id)}
                                        className="ml-2 px-2.5 py-1 rounded-lg bg-gold/20 hover:bg-gold/30 border border-gold/30 text-gold text-[10px] font-semibold transition-all duration-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Vérifier le statut de la transaction"
                                      >
                                        {verifyingPayoutId === payout.id ? (
                                          <Loader2 size={12} className="animate-spin" />
                                        ) : (
                                          <RefreshCw size={12} />
                                        )}
                                        <span>Vérifier</span>
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-foreground/40 font-mono mt-1">REF: {payout.reference_unique}</p>
                                  <p className="text-[10px] text-foreground/40 mt-0.5">Dest: {payout.telephone_destination}</p>
                                  {payout.motif_echec && (
                                    <p className="text-xs text-red-400 mt-1 font-medium bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                                      Motif: {payout.motif_echec}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-foreground/30 mt-1 uppercase font-medium">
                                    Créé le {new Date(payout.date_creation).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'long',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                              </div>
                              <p className="font-bold text-sm text-foreground/80">
                                {parseFloat(payout.montant).toLocaleString()} FCFA
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-foreground/40 italic text-sm">
                            Aucune transaction de payout enregistrée.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Settings & Payout Form */}
              <div className="space-y-6">
                {/* Edit Config Rules */}
                <div className="bg-white/5 rounded-3xl border border-white/10 p-6 backdrop-blur-md shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <Target className="text-gold" size={20} />
                    <h3 className="font-bold text-base text-foreground">Paramètres Financiers</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase mb-2 block tracking-widest">
                        Taux Commission (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={updateComm}
                          onChange={e => setUpdateComm(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm focus:border-gold outline-none transition-all text-foreground"
                          placeholder="Ex: 12.5"
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
                          value={updateDisc}
                          onChange={e => setUpdateDisc(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm focus:border-gold outline-none transition-all text-foreground"
                          placeholder="Ex: 5"
                        />
                        <Percent className="absolute right-3.5 top-3.5 text-foreground/30" size={14} />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase mb-2 block tracking-widest">
                        Statut du Compte
                      </label>
                      <select
                        value={updateStatut}
                        onChange={e => setUpdateStatut(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none transition-all text-foreground cursor-pointer"
                      >
                        <option value="actif" className="bg-background">Actif</option>
                        <option value="suspendu" className="bg-background">Suspendu</option>
                        <option value="en_attente" className="bg-background">En attente</option>
                      </select>
                    </div>

                    <button
                      onClick={handleUpdate}
                      disabled={isSaving}
                      className="w-full bg-gold text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gold/80 transition-all active:scale-[0.98] disabled:opacity-50 text-xs uppercase tracking-wider mt-2"
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                      Enregistrer
                    </button>
                  </div>
                </div>

                {/* Mobile Money Payout Trigger */}
                <div className="bg-white/5 rounded-3xl border border-gold/20 p-6 backdrop-blur-md shadow-sm shadow-gold/5">
                  <div className="flex items-center gap-3 mb-5">
                    <Coins className="text-gold" size={20} />
                    <h3 className="font-bold text-base text-foreground">Virement de Commission</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gold/5 border border-gold/10 p-3.5 rounded-2xl">
                      <p className="text-[10px] text-gold/60 uppercase font-bold tracking-wider mb-1">Disponible</p>
                      <p className="text-lg font-bold text-foreground">
                        {parseFloat(String(data?.solde_commission || 0)).toLocaleString()} FCFA
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase mb-2 block tracking-widest">
                        Montant à Virer (FCFA)
                      </label>
                      <input
                        type="number"
                        value={payoutAmount}
                        onChange={e => setPayoutAmount(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none transition-all text-foreground"
                        placeholder="Montant en FCFA"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase mb-2 block tracking-widest">
                        Téléphone destination (Optionnel)
                      </label>
                      <input
                        type="text"
                        value={payoutPhone}
                        onChange={e => setPayoutPhone(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none transition-all text-foreground"
                        placeholder="2376XXXXXXXX"
                      />
                    </div>

                    <button
                      onClick={handleInitiatePayout}
                      disabled={isInitiatingPayout || !payoutAmount || parseFloat(payoutAmount) <= 0}
                      className="w-full bg-white text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gold hover:text-black transition-all active:scale-[0.98] disabled:opacity-30 text-xs uppercase tracking-wider"
                    >
                      {isInitiatingPayout ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                      Déclencher le virement
                    </button>
                  </div>
                </div>

                {/* Promo Sharing link */}
                <div className="bg-white/5 rounded-3xl border border-white/10 p-6 backdrop-blur-md shadow-sm">
                  <p className="text-[10px] font-bold text-foreground/40 uppercase mb-3.5 tracking-widest">
                    Outils de parrainage
                  </p>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-3">
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-foreground/40 font-semibold uppercase">Lien Exclusif</p>
                      <p className="text-xs font-mono truncate text-gold mt-0.5">
                        exclusif.cm/?ref={data?.code_promo}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (data?.code_promo) {
                          handleCopyLink(data.code_promo);
                        }
                      }}
                      className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-gold hover:text-gold-light transition-all flex-shrink-0"
                      title="Copier le lien"
                    >
                      {copiedCode === data?.code_promo ? <Check size={14} /> : <Copy size={14} />}
                    </button>
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
    <div className="space-y-6 animate-fade-in-up">
      {/* Header & KPI Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prestataires</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Gestion des comptes et des règles de commissionnement</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIItem
          icon={<User size={18} className="text-gold" />}
          label="Total Partenaires"
          value={providers.length}
          color="bg-gold/10 border-gold/10"
        />
        <KPIItem
          icon={<CheckCircle2 size={18} className="text-emerald-400" />}
          label="Actifs"
          value={providers.filter(p => p.statut === 'actif').length}
          color="bg-emerald-500/10 border-emerald-500/10"
        />
        <KPIItem
          icon={<XCircle size={18} className="text-red-400" />}
          label="Suspendus"
          value={providers.filter(p => p.statut === 'suspendu').length}
          color="bg-red-500/10 border-red-500/10"
        />
        <KPIItem
          icon={<AlertCircle size={18} className="text-amber-400" />}
          label="En Attente"
          value={providers.filter(p => p.statut === 'en_attente').length}
          color="bg-amber-500/10 border-amber-500/10 animate-pulse"
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 backdrop-blur-md">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 max-w-sm flex-1">
          <Search size={16} className="text-foreground/40" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email, promo..."
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <Filter size={14} className="text-foreground/40" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs bg-transparent outline-none border-none text-foreground/80 font-bold tracking-wider uppercase cursor-pointer"
            >
              <option value="all" className="bg-background">Tous les statuts</option>
              <option value="actif" className="bg-background">Actifs</option>
              <option value="suspendu" className="bg-background">Suspendus</option>
              <option value="en_attente" className="bg-background">En attente</option>
            </select>
          </div>
          
          <button 
            onClick={() => {
              fetchProviders();
            }}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-foreground/60 hover:text-foreground transition-all duration-200"
            title="Rafraîchir la liste"
          >
            <RefreshCw size={14} className={loadingList ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Providers Grid/Table */}
      <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-sm backdrop-blur-md min-h-[300px]">
        {loadingList ? (
          <div className="flex flex-col items-center justify-center py-24 text-gold gap-3">
            <Loader2 className="animate-spin" size={36} />
            <p className="text-sm font-semibold">Récupération des prestataires...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 border-b border-white/10 text-foreground/40">
                <tr>
                  <th className="px-6 py-4.5 font-bold text-xs uppercase tracking-wider">Partenaire</th>
                  <th className="px-6 py-4.5 font-bold text-xs uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4.5 font-bold text-xs uppercase tracking-wider">Commission (%)</th>
                  <th className="px-6 py-4.5 font-bold text-xs uppercase tracking-wider">Réduction (%)</th>
                  <th className="px-6 py-4.5 font-bold text-xs uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4.5 font-bold text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProviders.map((provider: Provider) => {
                  const user = provider.user_details || { id: 0, email: '', telephone: '', first_name: '', last_name: '', role: '' };
                  const initials = `${(user.first_name || 'P').charAt(0)}${(user.last_name || '').charAt(0)}`.toUpperCase();
                  
                  return (
                    <tr key={provider.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold/20 to-gold-dark/40 border border-gold/10 flex items-center justify-center text-gold font-bold text-xs">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground/80 group-hover:text-foreground transition-colors leading-normal">
                              {user.first_name || ''} {user.last_name || 'Partenaire'}
                            </p>
                            {provider.code_promo ? (
                              <span className="inline-block px-2 py-0.5 text-[9px] font-bold font-mono bg-gold/10 border border-gold/10 text-gold rounded uppercase mt-1">
                                {provider.code_promo}
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 text-[9px] font-bold bg-white/5 text-foreground/30 rounded uppercase mt-1">
                                Pas de code
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-foreground/80 font-mono leading-none">{user.email || '—'}</p>
                        <p className="text-[10px] text-foreground/40 mt-1">{user.telephone || '—'}</p>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-foreground/75">
                        {parseFloat(provider.taux_commission || '0').toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-foreground/75">
                        {parseFloat(provider.reduction_client_pourcentage || '0').toFixed(1)}%
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                          provider.statut === 'actif'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : provider.statut === 'suspendu'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {provider.statut === 'en_attente' ? 'en attente' : provider.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {provider.statut === 'en_attente' && (
                            <button
                              onClick={() => {
                                setApprovingProvider(provider);
                                setValidateComm('10');
                                setValidateDisc('5');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-gold text-black font-bold text-xs uppercase tracking-wider hover:bg-gold/80 active:scale-95 transition-all flex items-center gap-1.5"
                              title="Valider la postulation"
                            >
                              <CheckCircle size={12} />
                              Valider
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedProvider(provider)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-foreground/60 hover:text-gold border border-white/5 group-hover:border-gold/20 transition-all duration-200"
                            title="Consulter le dashboard"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProviders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-foreground/40 italic text-sm">
                      Aucun prestataire trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Validation modal for pending provider applications */}
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
                {isValidating ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
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

// KPI widget item component
function KPIItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color?: string }) {
  return (
    <div className={`bg-white/5 rounded-3xl border border-white/10 p-5 shadow-lg flex items-center gap-4 ${color}`}>
      <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider mt-1.5">{label}</p>
      </div>
    </div>
  );
}

// Stats Metric Card widget
function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/5 rounded-3xl border border-white/10 p-5.5 shadow-md flex flex-col justify-between backdrop-blur-md hover:border-gold/20 transition-all duration-300">
      <div>
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 mb-4">
          {icon}
        </div>
        <p className="text-xl font-bold text-foreground leading-none">{value}</p>
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider leading-none">{label}</p>
        {sub && <p className="text-[10px] text-foreground/25 italic mt-1">{sub}</p>}
      </div>
    </div>
  );
}