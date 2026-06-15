'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Bell, Check, Eye, Search, Filter, RefreshCw, AlertTriangle, 
  ArrowRight, Sparkles, Gem, Droplets, CheckCheck
} from 'lucide-react';
import { notificationService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'unread', 'read'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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

      // Handle paginated response structure if applicable, else fallback
      const results = data.results || data.resultats || (Array.isArray(data) ? data : []);
      setNotifications(results);

      // Simple calculation of total pages from count
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
  }, [fetchStats, notifications]); // Refresh stats when notifications state changes

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alertes & Notifications</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Suivi en temps réel des stocks bas et alertes système</p>
        </div>
        {stats?.non_lues > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 bg-gold/10 text-gold hover:bg-gold/20 border border-gold/20 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <CheckCheck size={16} />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl">
          <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">Total alertes</p>
          <p className="text-2xl font-bold text-foreground mt-1">{stats?.total ?? 0}</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 shadow-xl">
          <p className="text-xs font-semibold text-red-400/60 uppercase tracking-wider">Non lues</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats?.non_lues ?? 0}</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 shadow-xl">
          <p className="text-xs font-semibold text-emerald-400/60 uppercase tracking-wider">Lues</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats?.lues ?? 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">Par type de produit</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {stats?.par_type_produit?.map((item: any) => (
              <span key={item.type_produit} className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                {getTypeLabel(item.type_produit)}: {item.count}
              </span>
            ))}
            {(!stats?.par_type_produit || stats.par_type_produit.length === 0) && (
              <span className="text-[10px] text-foreground/30 italic">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-2 w-full md:max-w-md">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par produit, message..."
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto">
          {/* Status filter */}
          <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 shrink-0">
            <button
              onClick={() => { setStatusFilter('all'); setPage(1); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === 'all' ? 'bg-gold text-black' : 'text-foreground/60 hover:text-foreground'}`}
            >
              Tous
            </button>
            <button
              onClick={() => { setStatusFilter('unread'); setPage(1); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === 'unread' ? 'bg-gold text-black' : 'text-foreground/60 hover:text-foreground'}`}
            >
              Non-lues
            </button>
            <button
              onClick={() => { setStatusFilter('read'); setPage(1); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === 'read' ? 'bg-gold text-black' : 'text-foreground/60 hover:text-foreground'}`}
            >
              Lues
            </button>
          </div>

          {/* Type filter */}
          <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 shrink-0">
            <button
              onClick={() => { setTypeFilter('all'); setPage(1); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${typeFilter === 'all' ? 'bg-gold text-black' : 'text-foreground/60 hover:text-foreground'}`}
            >
              Tous types
            </button>
            <button
              onClick={() => { setTypeFilter('accessoire'); setPage(1); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${typeFilter === 'accessoire' ? 'bg-gold text-black' : 'text-foreground/60 hover:text-foreground'}`}
            >
              Accessoires
            </button>
            <button
              onClick={() => { setTypeFilter('flacon'); setPage(1); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${typeFilter === 'flacon' ? 'bg-gold text-black' : 'text-foreground/60 hover:text-foreground'}`}
            >
              Flacons
            </button>
            <button
              onClick={() => { setTypeFilter('lot_essence'); setPage(1); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${typeFilter === 'lot_essence' ? 'bg-gold text-black' : 'text-foreground/60 hover:text-foreground'}`}
            >
              Lots Essence
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gold gap-3">
            <RefreshCw className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des notifications...</p>
          </div>
        ) : (
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
                  className={`p-4 hover:bg-white/[0.02] transition-all flex items-start gap-4 ${isUnread ? 'bg-white/[0.01]' : 'opacity-60'}`}
                >
                  <div className="mt-1 flex items-center justify-center">
                    {isUnread ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-transparent shrink-0" />
                    )}
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {getTypeIcon(notif.type_produit)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-white/10 text-foreground/80">
                        {getTypeLabel(notif.type_produit)}
                      </span>
                      <span className="text-[10px] text-foreground/30 font-mono">{timeString}</span>
                    </div>

                    <h4 className="text-sm font-semibold text-foreground">{notif.titre || 'Alerte Stock'}</h4>
                    <p className="text-xs text-foreground/60 leading-relaxed">{notif.message || notif.contenu}</p>

                    {/* Stock Context details if available */}
                    {notif.seuil_alerte !== undefined && (
                      <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-amber-400 bg-amber-400/5 px-2 py-1 rounded w-fit border border-amber-400/10">
                        <AlertTriangle size={12} />
                        <span>Stock actuel : {notif.stock_actuel} | Seuil : {notif.seuil_alerte}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isUnread && (
                      <button 
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-foreground/40 hover:text-gold transition-colors"
                        title="Marquer comme lue"
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-foreground/30 gap-3">
                <Bell size={36} className="text-foreground/20" />
                <p className="text-sm italic">Aucune notification trouvée</p>
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
            className="px-4 py-2 border border-white/10 rounded-lg text-xs font-semibold hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            Précédent
          </button>
          <span className="text-xs text-foreground/40">Page {page} sur {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-white/10 rounded-lg text-xs font-semibold hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
