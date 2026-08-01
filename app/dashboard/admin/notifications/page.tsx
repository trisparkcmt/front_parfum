'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Bell, Check, Search, Filter, Loader2, AlertTriangle, 
  Sparkles, Gem, Droplets, CheckCheck
} from 'lucide-react';
import { notificationService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';

// Helper utilities / UI primitives
const cx = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

function StatusChip({ status }: { status: 'unread' | 'read' }) {
  const isUnread = status === 'unread';
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        isUnread
          ? 'text-amber-400 bg-amber-500/10 ring-amber-500/20'
          : 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20'
      )}
    >
      <span
        className={cx(
          'h-1.5 w-1.5 rounded-full',
          isUnread ? 'bg-amber-400' : 'bg-emerald-400'
        )}
      />
      {isUnread ? 'Non lue' : 'Lue'}
    </span>
  );
}

function IconButton({
  icon: Icon,
  onClick,
  title,
  variant = 'gold',
}: {
  icon: any;
  onClick?: () => void;
  title?: string;
  variant?: 'gold' | 'red' | 'blue';
}) {
  const hoverColor =
    variant === 'red'
      ? 'hover:text-red-400 hover:bg-red-500/10'
      : variant === 'blue'
      ? 'hover:text-blue-400 hover:bg-blue-500/10'
      : 'hover:text-gold hover:bg-gold/10';

  return (
    <button
      onClick={onClick}
      title={title}
      className={cx(
        'rounded-md p-1.5 text-foreground/45 transition-colors',
        hoverColor
      )}
    >
      <Icon size={16} />
    </button>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const { addToast } = useToastStore();

  const fetchStats = useCallback(async () => {
    try {
      const data = await notificationService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      const estLuParam = 
        statusFilter === 'unread' ? 'false' : 
        statusFilter === 'read' ? 'true' : 
        undefined;

      const typeParam = typeFilter !== 'all' ? typeFilter : undefined;

      const data = await notificationService.getNotifications({
        search: search || undefined,
        type_produit: typeParam,
        est_lu: estLuParam,
        page: page
      });

      const results = data.results || data.resultats || (Array.isArray(data) ? data : []);
      setNotifications(results);

      const count = data.count || results.length;
      setTotalPages(Math.max(1, Math.ceil(count / 10)));
    } catch (error) {
      addToast('Erreur lors du chargement des notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, page, addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchNotifications]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, notifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id, true);
      addToast('Notification marquée comme lue', 'success');
      fetchNotifications();
    } catch (error) {
      addToast('Erreur lors de la mise à jour de la notification', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      addToast('Toutes les notifications ont été marquées comme lues', 'success');
      fetchNotifications();
    } catch (error) {
      addToast('Erreur lors du marquage des notifications', 'error');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accessoire':
        return <Gem className="text-gold" size={16} />;
      case 'flacon':
        return <Droplets className="text-blue-400" size={16} />;
      case 'lot_essence':
        return <Sparkles className="text-emerald-400" size={16} />;
      default:
        return <Bell className="text-purple-400" size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'accessoire':
        return 'Accessoire';
      case 'flacon':
        return 'Flacon';
      case 'lot_essence':
        return 'Lot d\'essence';
      default:
        return type;
    }
  };

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Alertes & Notifications</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Suivi en temps réel des stocks bas et alertes système</p>
        </div>
        {stats?.non_lues > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 bg-gold text-black px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gold/90 transition-colors"
          >
            <CheckCheck size={14} />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* KPIs Strip */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Total alertes</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-1">{stats?.total ?? 0}</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Non lues</p>
          <p className="text-xl font-semibold tabular-nums text-amber-400 mt-1">{stats?.non_lues ?? 0}</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Lues</p>
          <p className="text-xl font-semibold tabular-nums text-emerald-400 mt-1">{stats?.lues ?? 0}</p>
        </div>
        <div className="p-4 flex flex-col justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Par type de produit</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {stats?.par_type_produit?.map((item: any) => (
              <span key={item.type_produit} className="text-[10px] font-medium bg-white/5 px-2 py-0.5 rounded-md border border-white/10 text-foreground/70">
                {getTypeLabel(item.type_produit)}: {item.count}
              </span>
            ))}
            {(!stats?.par_type_produit || stats.par_type_produit.length === 0) && (
              <span className="text-[10px] text-foreground/30 italic">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-2 flex-1 bg-white/[0.02]">
            <Search size={15} className="text-foreground/40 shrink-0" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher par produit, message..."
              className="text-sm bg-transparent outline-none w-full text-foreground placeholder:text-foreground/40"
            />
          </div>

          {/* Toggle Filter Panel */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cx(
              'flex items-center gap-2 border border-white/10 px-3 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0',
              showFilters || activeFiltersCount > 0
                ? 'bg-white/10 text-foreground'
                : 'text-foreground/60 hover:bg-white/[0.06]'
            )}
          >
            <Filter size={14} />
            <span>Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="bg-gold text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col md:flex-row gap-6">
            {/* Status Filter Dropdown / Group */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 block">
                Statut
              </label>
              <div className="flex items-center gap-1.5">
                {[
                  { key: 'all', label: 'Tous' },
                  { key: 'unread', label: 'Non-lues' },
                  { key: 'read', label: 'Lues' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => { setStatusFilter(item.key); setPage(1); }}
                    className={cx(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border',
                      statusFilter === item.key
                        ? 'border-gold text-gold bg-gold/5'
                        : 'border-white/10 text-foreground/60 hover:bg-white/5'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter Dropdown / Group */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 block">
                Type de produit
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { key: 'all', label: 'Tous types' },
                  { key: 'accessoire', label: 'Accessoires' },
                  { key: 'flacon', label: 'Flacons' },
                  { key: 'lot_essence', label: 'Lots Essence' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => { setTypeFilter(item.key); setPage(1); }}
                    className={cx(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border',
                      typeFilter === item.key
                        ? 'border-gold text-gold bg-gold/5'
                        : 'border-white/10 text-foreground/60 hover:bg-white/5'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications Table Panel */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2">
            <Loader2 className="animate-spin text-gold" size={18} />
            <span className="text-xs text-foreground/40">Chargement des notifications...</span>
          </div>
        ) : (
          <div>
            <div className="divide-y divide-white/5">
              {notifications.map((notif) => {
                const isUnread = !notif.est_lu;
                const dateObj = new Date(notif.cree_le || notif.date_creation || Date.now());
                const timeString = dateObj.toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div 
                    key={notif.id}
                    className={cx(
                      'p-4 hover:bg-white/[0.02] transition-colors flex items-start gap-4',
                      !isUnread && 'opacity-60'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      {getTypeIcon(notif.type_produit)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold tracking-wider uppercase text-foreground/40">
                          {getTypeLabel(notif.type_produit)}
                        </span>
                        <span className="text-[10px] text-foreground/30 font-mono">•</span>
                        <span className="text-[10px] text-foreground/30 font-mono">{timeString}</span>
                        <div className="ml-auto">
                          <StatusChip status={isUnread ? 'unread' : 'read'} />
                        </div>
                      </div>

                      <h4 className="text-sm font-semibold text-foreground">{notif.titre || 'Alerte Stock'}</h4>
                      <p className="text-xs text-foreground/60 leading-relaxed">{notif.message || notif.contenu}</p>

                      {/* Stock Context details */}
                      {notif.seuil_alerte !== undefined && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg w-fit border border-amber-500/20">
                          <AlertTriangle size={12} />
                          <span>Stock actuel : {notif.stock_actuel} | Seuil : {notif.seuil_alerte}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 self-center">
                      {isUnread && (
                        <IconButton
                          icon={Check}
                          onClick={() => handleMarkAsRead(notif.id)}
                          title="Marquer comme lue"
                          variant="gold"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {notifications.length === 0 && (
              <div className="py-20 text-center">
                <span className="text-sm italic text-foreground/30">Aucune notification trouvée</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-white/10 rounded-lg text-xs font-semibold text-foreground/60 hover:bg-white/[0.06] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            Précédent
          </button>
          <span className="text-xs text-foreground/40">Page {page} sur {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-white/10 rounded-lg text-xs font-semibold text-foreground/60 hover:bg-white/[0.06] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}