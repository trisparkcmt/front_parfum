'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Eye, Users, Heart, FlaskConical, Loader2, Power, UserCheck,
  Trophy, TrendingUp, Star, Crown, ShoppingBag, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { adminService } from '@/services/apiService';
import { adminService as adminHelpers, type BestClient } from '@/services/adminService';
import { useToastStore } from '@/store/useToastStore';
import { SlideOver } from '@/components/ui/SlideOver';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function initials(name?: string) {
  return (name || 'U').charAt(0).toUpperCase();
}

function isServeuse(user: { roles?: string[]; role?: string }) {
  const roles = user.roles || (user.role ? [user.role] : []);
  return roles.includes('serveuse');
}

type Tab = 'clients' | 'meilleurs';

const RANK_STYLES = [
  { ring: 'ring-gold/40', bg: 'bg-gold/15', text: 'text-gold', badge: 'bg-gold text-black' },
  { ring: 'ring-slate-400/40', bg: 'bg-slate-400/15', text: 'text-slate-300', badge: 'bg-slate-400 text-black' },
  { ring: 'ring-amber-700/40', bg: 'bg-amber-700/15', text: 'text-amber-500', badge: 'bg-amber-700 text-white' },
];

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

  const kpi = [
    { label: 'Total clients', value: clients.length, icon: <Users size={15} />, color: 'text-gold' },
    { label: 'Actifs', value: clients.filter(c => c.is_active).length, icon: <Users size={15} />, color: 'text-emerald-400' },
    { label: 'Favoris enregistrés', value: clients.reduce((s, c) => s + (c.favorites?.length || 0), 0), icon: <Heart size={15} />, color: 'text-red-400' },
    { label: 'Compositions créées', value: clients.reduce((s, c) => s + (c.custom_perfumes?.length || 0), 0), icon: <FlaskConical size={15} />, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">

      {/* Header --------------------------------------------------------- */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Clients</h1>
        <p className="mt-0.5 text-sm text-foreground/40">Gestion et classement des comptes clients</p>
      </div>

      {/* Tabs --------------------------------------------------------------- */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setTab('clients')}
          className={cx(
            'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
            tab === 'clients' ? 'bg-gold text-black' : 'border border-white/10 text-foreground/50 hover:bg-white/6'
          )}
        >
          <Users size={14} /> Tous les clients
        </button>
        <button
          onClick={() => setTab('meilleurs')}
          className={cx(
            'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
            tab === 'meilleurs' ? 'bg-gold text-black' : 'border border-white/10 text-foreground/50 hover:bg-white/6'
          )}
        >
          <Trophy size={14} /> Meilleurs clients
        </button>
      </div>

      {/* ── TAB: All Clients ──────────────────────────────────────────────── */}
      {tab === 'clients' && (
        <>
          {/* KPIs */}
          <div className="flex divide-x divide-white/8 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
            {kpi.map(k => (
              <div key={k.label} className="flex-1 px-5 py-4">
                <p className={cx('mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35')}>
                  <span className={k.color}>{k.icon}</span>{k.label}
                </p>
                <p className="text-xl font-semibold tabular-nums text-foreground">{k.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="flex max-w-sm items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <Search size={14} className="shrink-0 text-foreground/35" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un client…"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
            />
          </div>

          {/* Table */}
          <div className="min-h-[300px] overflow-hidden rounded-xl border border-white/10">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2.5 py-20 text-foreground/40">
                <Loader2 className="animate-spin text-gold" size={28} />
                <p className="text-xs">Chargement des données…</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      {['Client', 'Contact', 'Téléphone', 'Statut', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {clients.map(c => (
                      <tr key={c.id} className="transition-colors hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-semibold text-gold">
                              {initials(c.first_name || c.email)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-foreground">{c.first_name || ''} {c.last_name || ''}</p>
                              <p className="text-[10px] text-foreground/35">ID {c.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground/70">{c.email}</td>
                        <td className="px-4 py-3 text-xs text-foreground/70">{c.telephone || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={cx(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
                            c.is_active ? 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20' : 'text-red-400 bg-red-500/10 ring-red-500/20'
                          )}>
                            <span className={cx('h-1.5 w-1.5 rounded-full', c.is_active ? 'bg-emerald-400' : 'bg-red-400')} />
                            {c.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setSelected(c)} title="Détails" className="rounded-md p-1.5 text-foreground/45 transition-colors hover:bg-gold/10 hover:text-gold">
                              <Eye size={14} />
                            </button>
                            <button onClick={() => handleToggleStatus(c.id)} title={c.is_active ? 'Désactiver' : 'Activer'} className="rounded-md p-1.5 text-foreground/45 transition-colors hover:bg-red-500/10 hover:text-red-400">
                              <Power size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {clients.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-sm italic text-foreground/30">Aucun client trouvé.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Client detail panel */}
          {selected && (
            <SlideOver
              isOpen={!!selected}
              onClose={() => setSelected(null)}
              title={`${selected.first_name || ''} ${selected.last_name || ''}`}
              description={selected.email}
              size="sm"
              footer={
                <button onClick={() => setSelected(null)} className="w-full rounded-lg border border-white/10 py-2.5 text-sm text-foreground/60 transition-colors hover:bg-white/6">
                  Fermer
                </button>
              }
            >
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/15 text-lg font-semibold text-gold">
                    {initials(selected.first_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{selected.first_name} {selected.last_name}</p>
                    <p className="truncate text-xs text-foreground/40">{selected.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Favoris', value: selected.favorites?.length || 0 },
                    { label: 'Compositions', value: selected.custom_perfumes?.length || 0 },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
                      <p className="text-lg font-semibold text-foreground">{s.value}</p>
                      <p className="text-[10px] text-foreground/40">{s.label}</p>
                    </div>
                  ))}
                </div>

                <dl className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-foreground/40">Téléphone</dt>
                    <dd className="font-medium text-foreground/80">{selected.telephone || '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/40">Statut</dt>
                    <dd className="font-medium text-foreground/80">{selected.is_active ? 'Actif' : 'Inactif'}</dd>
                  </div>
                </dl>

                {isServeuse(selected) ? (
                  <p className="text-center text-xs font-medium text-emerald-400">Déjà serveuse</p>
                ) : (
                  <button
                    onClick={handlePromoteToServeuse}
                    disabled={promoting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold/85 disabled:opacity-50"
                  >
                    {promoting ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />}
                    Convertir en serveuse
                  </button>
                )}
              </div>
            </SlideOver>
          )}
        </>
      )}

      {/* ── TAB: Meilleurs Clients ────────────────────────────────────────── */}
      {tab === 'meilleurs' && (
        <>
          {/* Filter controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
              <button
                onClick={() => { setFilterBy('spent'); setBestPage(1); }}
                className={cx(
                  'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors',
                  filterBy === 'spent' ? 'bg-gold text-black' : 'text-foreground/50 hover:text-foreground/80'
                )}
              >
                <TrendingUp size={13} /> Par dépenses
              </button>
              <button
                onClick={() => { setFilterBy('orders'); setBestPage(1); }}
                className={cx(
                  'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors',
                  filterBy === 'orders' ? 'bg-gold text-black' : 'text-foreground/50 hover:text-foreground/80'
                )}
              >
                <ShoppingBag size={13} /> Par commandes
              </button>
              <button
                onClick={() => { setFilterBy('points'); setBestPage(1); }}
                className={cx(
                  'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors',
                  filterBy === 'points' ? 'bg-gold text-black' : 'text-foreground/50 hover:text-foreground/80'
                )}
              >
                <Star size={13} /> Par points
              </button>
            </div>
            <p className="text-xs text-foreground/40">{bestTotal} client{bestTotal !== 1 ? 's' : ''} classés</p>
          </div>

          {/* Leaderboard */}
          <div className="overflow-hidden rounded-xl border border-white/10">
            {bestLoading ? (
              <div className="flex flex-col items-center justify-center gap-2.5 py-20 text-foreground/40">
                <Loader2 className="animate-spin text-gold" size={28} />
                <p className="text-xs">Calcul du classement…</p>
              </div>
            ) : (
              <>
                {/* Top 3 podium */}
                {bestClients.length >= 3 && (
                  <div className="grid grid-cols-3 gap-3 border-b border-white/10 bg-white/[0.02] p-6">
                    {/* 2nd */}
                    <Podium
                      rank={2}
                      name={`${bestClients[1]?.user_details?.first_name ?? ''} ${bestClients[1]?.user_details?.last_name ?? ''}`}
                      sub={`${(bestClients[1]?.points_fidelite ?? 0).toLocaleString('fr-FR')} pts`}
                    />
                    {/* 1st */}
                    <Podium
                      rank={1}
                      name={`${bestClients[0]?.user_details?.first_name ?? ''} ${bestClients[0]?.user_details?.last_name ?? ''}`}
                      sub={`${(bestClients[0]?.points_fidelite ?? 0).toLocaleString('fr-FR')} pts`}
                      lead
                    />
                    {/* 3rd */}
                    <Podium
                      rank={3}
                      name={`${bestClients[2]?.user_details?.first_name ?? ''} ${bestClients[2]?.user_details?.last_name ?? ''}`}
                      sub={`${(bestClients[2]?.points_fidelite ?? 0).toLocaleString('fr-FR')} pts`}
                    />
                  </div>
                )}

                {/* Full list */}
                <div className="divide-y divide-white/5">
                  {bestClients.map((client, index) => {
                    const rank = (bestPage - 1) * PAGE_SIZE + index + 1;
                    const style = rank <= 3 ? RANK_STYLES[rank - 1] : null;
                    return (
                      <div key={client.id} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/[0.02]">
                        <div className={cx(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold',
                          style ? cx(style.bg, style.text) : 'bg-white/6 text-foreground/35'
                        )}>
                          {style ? <Star size={13} /> : rank}
                        </div>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm font-semibold text-gold">
                          {initials(client.user_details?.first_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {client.user_details?.first_name} {client.user_details?.last_name}
                          </p>
                          <p className="truncate text-[11px] text-foreground/40">{client.user_details?.email}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          {filterBy === 'points' && <RankMetric value={client.points_fidelite} label="pts fidélité" />}
                          {filterBy === 'spent' && client.total_spent !== undefined && <RankMetric value={client.total_spent} label="FCFA dépensés" />}
                          {filterBy === 'orders' && client.total_paid_orders !== undefined && <RankMetric value={client.total_paid_orders} label="commandes payées" />}
                          {filterBy === 'spent' && client.total_spent === undefined && <RankMetric value={client.points_fidelite} label="pts fidélité" />}
                          {filterBy === 'orders' && client.total_paid_orders === undefined && <RankMetric value={client.points_fidelite} label="pts fidélité" />}
                        </div>
                      </div>
                    );
                  })}
                  {bestClients.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-foreground/30">
                      <Trophy size={34} className="text-foreground/10" />
                      <p className="text-sm italic">Aucun classement disponible</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
                    <button
                      onClick={() => setBestPage(p => Math.max(1, p - 1))}
                      disabled={bestPage === 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-foreground/60 transition-colors hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronLeft size={13} /> Précédent
                    </button>
                    <span className="text-xs text-foreground/40">Page {bestPage} / {totalPages}</span>
                    <button
                      onClick={() => setBestPage(p => Math.min(totalPages, p + 1))}
                      disabled={bestPage === totalPages}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-foreground/60 transition-colors hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Suivant <ChevronRight size={13} />
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

// ─────────────────────────────────────────────────────────────────────────

function Podium({ rank, name, sub, lead }: { rank: 1 | 2 | 3; name: string; sub: string; lead?: boolean }) {
  const style = RANK_STYLES[rank - 1];
  return (
    <div className={cx('flex flex-col items-center gap-2', !lead && 'pt-6')}>
      {lead && <Crown size={18} className="text-gold" />}
      <div className="relative">
        <div className={cx(
          'flex items-center justify-center rounded-full font-bold ring-2',
          lead ? 'h-14 w-14 text-xl' : 'h-11 w-11 text-base',
          style.bg, style.text, style.ring
        )}>
          {name.trim() ? name.trim().charAt(0).toUpperCase() : 'U'}
        </div>
        <span className={cx(
          'absolute -bottom-1 -right-1 flex items-center justify-center rounded-full text-[10px] font-bold',
          lead ? 'h-5 w-5' : 'h-4 w-4',
          style.badge
        )}>
          {rank}
        </span>
      </div>
      <p className={cx('text-center leading-tight', lead ? 'text-sm font-bold text-gold' : 'text-xs font-semibold text-foreground')}>
        {name}
      </p>
      <p className={cx('text-center', lead ? 'text-xs text-gold/60' : 'text-[10px] text-foreground/40')}>{sub}</p>
    </div>
  );
}

function RankMetric({ value, label }: { value?: number; label: string }) {
  return (
    <>
      <p className="text-sm font-semibold text-gold">{(value ?? 0).toLocaleString('fr-FR')}</p>
      <p className="text-[10px] text-foreground/40">{label}</p>
    </>
  );
}