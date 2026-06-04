'use client';


import React, { useState, useEffect, useCallback, use } from 'react';
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
  ArrowDownLeft
} from 'lucide-react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import Link from 'next/link';

export default function ProviderDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastStore();

  // Form states for financial rules adjustment
  const [updateComm, setUpdateComm] = useState('');
  const [updateDisc, setUpdateDisc] = useState('');
  const [updateStatut, setUpdateStatut] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      // Consomme GET /api/v1/auth/prestataire/dashboard/?prestataire_id={id}
      // @ts-ignore
      const res = await adminService.getProviderDashboard(id);
      setData(res);
      setUpdateComm(String(res.taux_commission || '0'));
      setUpdateDisc(String(res.reduction_client_pourcentage || '0'));
      setUpdateStatut(String(res.statut || 'actif'));
    } catch (error) {
      addToast('Erreur lors de la récupération des statistiques', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleUpdate = async () => {
    try {
      setIsSaving(true);
      // @ts-ignore
      await adminService.updateProvider(id, {
        taux_commission: parseFloat(updateComm),
        reduction_client_pourcentage: parseFloat(updateDisc),
        statut: updateStatut,
      });
      addToast('Paramètres mis à jour avec succès', 'success');
      fetchDashboard();
    } catch (error: any) {
      addToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Calcul dynamique : Revenus des 30 derniers jours à partir de l'historique
  const calculateLast30DaysRevenue = () => {
    if (!data?.historique_recent) return 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return data.historique_recent
      .filter((op: any) => op.type_operation === 'credit' && new Date(op.date_operation) >= thirtyDaysAgo)
      .reduce((sum: number, op: any) => sum + parseFloat(String(op.montant || 0)), 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gold">
        <Loader2 className="animate-spin" size={40} />
        <p className="mt-4 font-medium">Chargement du dashboard partenaire...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/providers" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} className="text-foreground/60" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard Partenaire</h1>
            <p className="text-sm text-foreground/40 font-mono">CODE: {data?.code_promo}</p>
          </div>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${data?.statut === 'actif' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {data?.statut}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<TrendingUp className="text-emerald-400" />}
          label="Total Gains Historiques"
          value={`${parseFloat(String(data?.total_gains || 0)).toLocaleString()} FCFA`}
          sub="Depuis le début"
        />
        <MetricCard
          icon={<Calendar className="text-gold" />}
          label="Revenus (30j)"
          value={`${calculateLast30DaysRevenue().toLocaleString()} FCFA`}
          sub="Calcul dynamique"
        />
        <MetricCard
          icon={<DollarSign className="text-amber-400" />}
          label="Solde Disponible"
          value={`${parseFloat(String(data?.solde_commission || 0)).toLocaleString()} FCFA`}
          sub="Prêt au retrait"
        />
        <MetricCard
          icon={<ShieldCheck className="text-purple-400" />}
          label="Solde Bloqué"
          value={`${parseFloat(String(data?.solde_bloque || 0)).toLocaleString()} FCFA`}
          sub="Transactions en cours"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Logs & History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <History className="text-gold" size={20} />
              <h3 className="font-bold text-lg">Opérations Récentes</h3>
            </div>
            <div className="space-y-4">
              {data?.historique_recent?.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${log.type_operation === 'credit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {log.type_operation === 'credit' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{log.description}</p>
                      <p className="text-[10px] text-foreground/40 uppercase">{new Date(log.date_operation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${log.type_operation === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {log.type_operation === 'credit' ? '+' : '-'}{parseFloat(log.montant).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Config Financial Rules */}
        <div className="space-y-6">
          <div className="bg-white/5 rounded-3xl border border-gold/20 p-6 shadow-2xl shadow-gold/5">
            <div className="flex items-center gap-3 mb-6">
              <Target className="text-gold" size={20} />
              <h3 className="font-bold text-lg">Règles Financières</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase mb-2 block tracking-widest">Taux Commission (%)</label>
                <input
                  type="number"
                  value={updateComm}
                  onChange={e => setUpdateComm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase mb-2 block tracking-widest">Réduction Client (%)</label>
                <input
                  type="number"
                  value={updateDisc}
                  onChange={e => setUpdateDisc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase mb-2 block tracking-widest">Statut Compte</label>
                <select
                  value={updateStatut}
                  onChange={e => setUpdateStatut(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none transition-all"
                >
                  <option value="actif" className="bg-background">Actif</option>
                  <option value="suspendu" className="bg-background">Suspendu</option>
                </select>
              </div>

              <button
                onClick={handleUpdate}
                disabled={isSaving}
                className="w-full bg-gold text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gold/80 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Enregistrer les modifications
              </button>
            </div>
          </div>

          {/* Promo Code Info */}
          <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
            <p className="text-[10px] font-bold text-foreground/40 uppercase mb-4 tracking-widest">Outils de promotion</p>
            <div className="p-4 bg-gold/5 border border-gold/10 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gold/60 font-medium">Lien de parrainage</p>
                <p className="text-xs font-mono truncate max-w-[150px]">exclusif.cm/?ref={data?.code_promo}</p>
              </div>
              <button className="text-[10px] font-bold text-gold underline">Copier</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub?: string }) {
  return (
    <div className="bg-white/5 rounded-3xl border border-white/10 p-5 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
      <p className="text-[11px] font-semibold text-foreground/40 uppercase tracking-wider mt-2">{label}</p>
      {sub && <p className="text-[10px] text-foreground/20 italic mt-0.5">{sub}</p>}
    </div>
  );
}