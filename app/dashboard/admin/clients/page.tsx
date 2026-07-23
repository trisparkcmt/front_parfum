'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Eye, Users, Heart, FlaskConical, Loader2, Power, UserCheck,
  Trophy, TrendingUp, Star, Crown, ShoppingBag, ArrowUpRight,
} from 'lucide-react';
import { adminService } from '@/services/apiService';
import { adminService as adminHelpers, type BestClient } from '@/services/adminService';
import { useToastStore } from '@/store/useToastStore';
import { SlideOver } from '@/components/ui/SlideOver';

function isServeuse(user: { roles?: string[]; role?: string }) {
  const roles = user.roles || (user.role ? [user.role] : []);
  return roles.includes('serveuse');
}

type Tab = 'clients' | 'meilleurs';

export default function ClientsPage() {
  const [tab, setTab] = useState<Tab>('clients');

  // ── All clients tab ───────────────────────────────────────────────────────
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [promoting, setPromoting] = useState(false);

  // ── Meilleurs clients tab ─────────────────────────────────────────────────
  const [bestClients, setBestClients] = useState<BestClient[]>([]);
  const [bestLoading, setBestLoading] = useState(false);
  const [filterBy, setFilterBy] = useState<'spent' | 'orders' | 'points'>('spent');
  const [bestPage, setBestPage] = useState(1);
  const [bestTotal, setBestTotal] = useState(0);
  const PAGE_SIZE = 20;

  const { addToast } = useToastStore();

  // ── Fetch all clients ────────────────────────────────────────────────────
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers({ search });
      const list = data.results || data.resultats || (Array.isArray(data) ? data : []);
      setClients(list);
    } catch (error) {
      console.error(error);
      addToast('Erreur lors du chargement des clients', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, addToast]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchClients(); }, 300);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  // ── Fetch best clients ────────────────────────────────────────────────────
  const fetchBestClients = useCallback(async () => {
    setBestLoading(true);
    try {
      const data = await adminHelpers.getBestClients(filterBy, undefined, bestPage);
      if (adminHelpers.isPaginated(data)) {
        setBestClients(data.results);
        setBestTotal(data.count);
      } else {
        setBestClients(data as BestClient[]);
        setBestTotal((data as BestClient[]).length);
      }
    } catch (error) {
      addToast('Erreur lors du chargement des meilleurs clients', 'error');
    } finally {
      setBestLoading(false);
    }
  }, [filterBy, bestPage, addToast]);

  useEffect(() => {
    if (tab === 'meilleurs') {
      fetchBestClients();
    }
  }, [tab, fetchBestClients]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleToggleStatus = async (userId: number) => {
    try {
      await adminService.toggleUserStatus(userId);
      addToast('Statut mis à jour', 'success');
      fetchClients();
      if (selected && selected.id === userId) {
        setSelected((prev: any) => ({ ...prev, is_active: !prev.is_active }));
      }
    } catch {
      addToast('Erreur lors de la modification du statut', 'error');
    }
  };

  const handlePromoteToServeuse = async () => {
    if (!selected || isServeuse(selected)) return;
    const name = `${selected.first_name || ''} ${selected.last_name || ''}`.trim() || selected.email;
    if (!confirm(`Promouvoir ${name} au rang de serveuse ?`)) return;
    try {
      setPromoting(true);
      await adminService.promoteToServeuse(selected.id);
      addToast('Client promu serveuse avec succès', 'success');
      fetchClients();
      setSelected(null);
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la promotion', 'error');
    } finally {
      setPromoting(false);
    }
  };

  const totalPages = Math.ceil(bestTotal / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Gestion et classement des comptes clients</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('clients')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'clients' ? 'bg-gold text-black' : 'border border-white/10 text-foreground/50 hover:bg-white/5'
          }`}
        >
          <Users size={15} /> Tous les clients
        </button>
        <button
          onClick={() => setTab('meilleurs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'meilleurs' ? 'bg-gold text-black' : 'border border-white/10 text-foreground/50 hover:bg-white/5'
          }`}
        >
          <Trophy size={15} /> Meilleurs clients
        </button>
      </div>

      {/* ── TAB: All Clients ──────────────────────────────────────────────── */}
      {tab === 'clients' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Clients', value: clients.length, icon: <Users size={18} />, color: 'text-gold bg-gold/10' },
              { label: 'Actifs', value: clients.filter(c => c.is_active).length, icon: <Users size={18} />, color: 'text-emerald-400 bg-emerald-500/10' },
              { label: 'Favoris enregistrés', value: clients.reduce((s, c) => s + (c.favorites?.length || 0), 0), icon: <Heart size={18} />, color: 'text-red-400 bg-red-500/10' },
              { label: 'Compositions créées', value: clients.reduce((s, c) => s + (c.custom_perfumes?.length || 0), 0), icon: <FlaskConical size={18} />, color: 'text-purple-400 bg-purple-500/10' },
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
                placeholder="Rechercher un client..."
                className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
                <Loader2 className="animate-spin" size={32} />
                <p className="text-sm font-medium">Chargement des données...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      {['Client', 'Contact', 'Téléphone', 'Statut', 'Actions'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-5 py-3.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {clients.map(c => (
                      <tr key={c.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-xs font-bold">
                              {(c.first_name || c.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{c.first_name || ''} {c.last_name || ''}</p>
                              <p className="text-[11px] text-foreground/40">ID: {c.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-foreground">{c.email}</td>
                        <td className="px-5 py-4 text-xs text-foreground">{c.telephone || '—'}</td>
                        <td className="px-5 py-4">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${c.is_active ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                            {c.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setSelected(c)} className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors" title="Détails">
                              <Eye size={14} />
                            </button>
                            <button onClick={() => handleToggleStatus(c.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-red-400 transition-colors" title={c.is_active ? 'Désactiver' : 'Activer'}>
                              <Power size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {clients.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-foreground/40 italic">Aucun client trouvé.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Client detail modal */}
          {selected && (
            <SlideOver
              isOpen={!!selected}
              onClose={() => setSelected(null)}
              title={`${selected.first_name || ''} ${selected.last_name || ''}`}
              description={selected.email}
              size="sm"
              footer={
                <button onClick={() => setSelected(null)} className="w-full border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">
                  Fermer
                </button>
              }
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-xl font-bold">
                  {(selected.first_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-foreground/40">{selected.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: 'Favoris', value: selected.favorites?.length || 0 },
                  { label: 'Compositions', value: selected.custom_perfumes?.length || 0 },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-[11px] text-foreground/40">{s.label}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-foreground/40 mb-4">Téléphone: {selected.telephone || '—'} · Statut: {selected.is_active ? 'Actif' : 'Inactif'}</p>

              {isServeuse(selected) ? (
                <p className="text-xs text-emerald-400 text-center mb-4 font-medium">Déjà serveuse</p>
              ) : (
                <button
                  onClick={handlePromoteToServeuse}
                  disabled={promoting}
                  className="w-full mb-3 flex items-center justify-center gap-2 bg-gold text-black rounded-lg py-2.5 text-sm font-medium hover:bg-gold/80 transition-colors disabled:opacity-50"
                >
                  {promoting ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                  Convertir en serveuse
                </button>
              )}
            </SlideOver>
          )}
        </>
      )}

      {/* ── TAB: Meilleurs Clients ────────────────────────────────────────── */}
      {tab === 'meilleurs' && (
        <>
          {/* Filter controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => { setFilterBy('spent'); setBestPage(1); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterBy === 'spent' ? 'bg-gold text-black' : 'text-foreground/50 hover:text-foreground'}`}
              >
                <TrendingUp size={14} /> Par dépenses
              </button>
              <button
                onClick={() => { setFilterBy('orders'); setBestPage(1); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterBy === 'orders' ? 'bg-gold text-black' : 'text-foreground/50 hover:text-foreground'}`}
              >
                <ShoppingBag size={14} /> Par commandes
              </button>
              <button
                onClick={() => { setFilterBy('points'); setBestPage(1); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterBy === 'points' ? 'bg-gold text-black' : 'text-foreground/50 hover:text-foreground'}`}
              >
                <Star size={14} /> Par points
              </button>
            </div>
            <p className="text-xs text-foreground/40">
              {bestTotal} client{bestTotal !== 1 ? 's' : ''} classés
            </p>
          </div>

          {/* Leaderboard */}
          <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
            {bestLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
                <Loader2 className="animate-spin" size={32} />
                <p className="text-sm font-medium">Calcul du classement...</p>
              </div>
            ) : (
              <>
                {/* Top 3 podium */}
                {bestClients.length >= 3 && (
                  <div className="grid grid-cols-3 gap-3 p-6 border-b border-white/10">
                    {/* 2nd */}
                    <div className="flex flex-col items-center gap-2 pt-6">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                          {(bestClients[1]?.user_details?.first_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                      </div>
                      <p className="text-xs font-semibold text-foreground text-center leading-tight">
                        {bestClients[1]?.user_details?.first_name} {bestClients[1]?.user_details?.last_name}
                      </p>
                      <p className="text-[10px] text-foreground/40 text-center">{bestClients[1]?.points_fidelite ?? 0} pts</p>
                    </div>
                    {/* 1st */}
                    <div className="flex flex-col items-center gap-2">
                      <Crown size={20} className="text-gold" />
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center text-black text-2xl font-bold shadow-sm ring-2 ring-gold/40">
                          {(bestClients[0]?.user_details?.first_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gold text-black text-xs font-bold flex items-center justify-center">1</span>
                      </div>
                      <p className="text-sm font-bold text-gold text-center leading-tight">
                        {bestClients[0]?.user_details?.first_name} {bestClients[0]?.user_details?.last_name}
                      </p>
                      <p className="text-xs text-gold/60 text-center">{bestClients[0]?.points_fidelite ?? 0} pts</p>
                    </div>
                    {/* 3rd */}
                    <div className="flex flex-col items-center gap-2 pt-6">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                          {(bestClients[2]?.user_details?.first_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white text-[10px] font-bold flex items-center justify-center">3</span>
                      </div>
                      <p className="text-xs font-semibold text-foreground text-center leading-tight">
                        {bestClients[2]?.user_details?.first_name} {bestClients[2]?.user_details?.last_name}
                      </p>
                      <p className="text-[10px] text-foreground/40 text-center">{bestClients[2]?.points_fidelite ?? 0} pts</p>
                    </div>
                  </div>
                )}

                {/* Full list */}
                <div className="divide-y divide-white/5">
                  {bestClients.map((client, index) => {
                    const rank = (bestPage - 1) * PAGE_SIZE + index + 1;
                    const rankColors = ['text-gold', 'text-slate-400', 'text-amber-700'];
                    return (
                      <div key={client.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors">
                        {/* Rank */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${rank <= 3 ? rankColors[rank - 1] + ' bg-current/10' : 'text-foreground/30 bg-white/5'}`}>
                          {rank <= 3 ? <Star size={14} /> : rank}
                        </div>
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/40 to-gold-dark/40 flex items-center justify-center text-gold font-bold text-sm shrink-0">
                          {(client.user_details?.first_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {client.user_details?.first_name} {client.user_details?.last_name}
                          </p>
                          <p className="text-[11px] text-foreground/40 truncate">{client.user_details?.email}</p>
                        </div>
                        {/* Points fidélité / Dépenses / Commandes */}
                        <div className="text-right shrink-0">
                          {filterBy === 'points' && (
                            <>
                              <p className="text-sm font-bold text-gold">{(client.points_fidelite ?? 0).toLocaleString('fr-FR')}</p>
                              <p className="text-[10px] text-foreground/40">pts fidélité</p>
                            </>
                          )}
                          {filterBy === 'spent' && client.total_spent !== undefined && (
                            <>
                              <p className="text-sm font-bold text-gold">{(client.total_spent ?? 0).toLocaleString('fr-FR')}</p>
                              <p className="text-[10px] text-foreground/40">FCFA dépensés</p>
                            </>
                          )}
                          {filterBy === 'orders' && client.total_paid_orders !== undefined && (
                            <>
                              <p className="text-sm font-bold text-gold">{(client.total_paid_orders ?? 0).toLocaleString('fr-FR')}</p>
                              <p className="text-[10px] text-foreground/40">commandes payées</p>
                            </>
                          )}
                          {filterBy === 'spent' && client.total_spent === undefined && (
                            <>
                              <p className="text-sm font-bold text-gold">{(client.points_fidelite ?? 0).toLocaleString('fr-FR')}</p>
                              <p className="text-[10px] text-foreground/40">pts fidélité</p>
                            </>
                          )}
                          {filterBy === 'orders' && client.total_paid_orders === undefined && (
                            <>
                              <p className="text-sm font-bold text-gold">{(client.points_fidelite ?? 0).toLocaleString('fr-FR')}</p>
                              <p className="text-[10px] text-foreground/40">pts fidélité</p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {bestClients.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-foreground/30 gap-3">
                      <Trophy size={40} className="text-foreground/10" />
                      <p className="text-sm italic">Aucun classement disponible</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
                    <button
                      onClick={() => setBestPage(p => Math.max(1, p - 1))}
                      disabled={bestPage === 1}
                      className="px-4 py-2 border border-white/10 rounded-lg text-xs font-semibold hover:bg-white/5 disabled:opacity-40 transition-colors"
                    >
                      Précédent
                    </button>
                    <span className="text-xs text-foreground/40">Page {bestPage} sur {totalPages}</span>
                    <button
                      onClick={() => setBestPage(p => Math.min(totalPages, p + 1))}
                      disabled={bestPage === totalPages}
                      className="px-4 py-2 border border-white/10 rounded-lg text-xs font-semibold hover:bg-white/5 disabled:opacity-40 transition-colors"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
