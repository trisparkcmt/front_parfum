'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, Search, Moon, Sun, Bell, User, ArrowLeft, ShoppingCart, Package, Sparkles, Gem, Users2, Check } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

type Suggestion = {
  label: string;
  sub?: string;
  href: string;
  icon: React.ReactNode;
};

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrderNotificationStore } from '@/store/useOrderNotificationStore';
import { notificationService } from '@/services/apiService';

import { useThemeStore } from '@/store/useThemeStore';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { theme, toggleTheme, initTheme } = useThemeStore();
  const [search, setSearch] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search autocomplete state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Build static page suggestions matching the query
  const buildStaticSuggestions = useCallback((q: string): Suggestion[] => {
    const lower = q.toLowerCase();
    const pages: { label: string; href: string; icon: React.ReactNode; keywords: string[] }[] = [
      { label: 'Commandes', href: '/dashboard/admin/order', icon: <ShoppingCart size={14} />, keywords: ['commande', 'order', 'cmd'] },
      { label: 'Parfums', href: '/dashboard/admin/perfume', icon: <Sparkles size={14} />, keywords: ['parfum', 'perfume'] },
      { label: 'Accessoires', href: '/dashboard/admin/accessories', icon: <Gem size={14} />, keywords: ['accessoire', 'accessory'] },
      { label: 'Clients', href: '/dashboard/admin/clients', icon: <Users2 size={14} />, keywords: ['client', 'user', 'utilisateur'] },
      { label: 'Codes Promo', href: '/dashboard/admin/promo-codes', icon: <Package size={14} />, keywords: ['promo', 'code', 'réduction'] },
    ];
    return pages
      .filter(p => p.keywords.some(kw => kw.includes(lower) || lower.includes(kw)))
      .map(p => ({ label: p.label, href: p.href, icon: p.icon, sub: 'Page admin' }));
  }, []);

  // Fetch live search suggestions
  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    setSearchLoading(true);
    try {
      const { adminService: adminSvc } = await import('@/services/apiService');
      const { orderService: orderSvc } = await import('@/services/apiService');

      const [usersData, ordersData] = await Promise.allSettled([
        adminSvc.getUsers({ search: q }),
        orderSvc.getOrders({ search: q }),
      ]);

      const results: Suggestion[] = [];

      // Users
      if (usersData.status === 'fulfilled') {
        const users = usersData.value.results ?? usersData.value.resultats ?? (Array.isArray(usersData.value) ? usersData.value : []);
        users.slice(0, 3).forEach((u: any) => {
          const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email;
          results.push({
            label: name,
            sub: u.email ?? u.telephone,
            href: `/dashboard/admin/clients`,
            icon: <User size={14} />,
          });
        });
      }

      // Orders
      if (ordersData.status === 'fulfilled') {
        const orders = ordersData.value.results ?? ordersData.value.resultats ?? (Array.isArray(ordersData.value) ? ordersData.value : []);
        orders.slice(0, 3).forEach((o: any) => {
          results.push({
            label: o.numero_commande,
            sub: `${o.livraison_nom_complet ?? ''} — ${Number(o.total_ttc ?? 0).toLocaleString('fr-FR')} FCFA`,
            href: `/dashboard/admin/order`,
            icon: <ShoppingCart size={14} />,
          });
        });
      }

      // Page suggestions
      results.push(...buildStaticSuggestions(q));

      setSuggestions(results.slice(0, 8));
      setShowSuggestions(results.length > 0);
      setActiveSuggestion(-1);
    } catch {
      setSuggestions(buildStaticSuggestions(q));
      setShowSuggestions(true);
    } finally {
      setSearchLoading(false);
    }
  }, [buildStaticSuggestions]);

  // Debounce search input
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (search.length >= 2) {
      searchDebounceRef.current = setTimeout(() => fetchSuggestions(search), 320);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [search, fetchSuggestions]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(i => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        router.push(suggestions[activeSuggestion].href);
        setSearch('');
        setShowSuggestions(false);
        return;
      }
      const q = search.trim();
      if (!q) return;
      const path = pathname.includes('/accessories')
        ? `/dashboard/admin/accessories?search=${encodeURIComponent(q)}`
        : pathname.includes('/perfume')
        ? `/dashboard/admin/perfume?search=${encodeURIComponent(q)}`
        : `/dashboard/admin/order?search=${encodeURIComponent(q)}`;
      router.push(path);
      setShowSuggestions(false);
    }
  };

  // Determine profile path based on user role
  const getProfilePath = () => {
    return '/dashboard/profile';
  };
  
  const profilePath = getProfilePath();
  
  const fetchNotifications = async () => {
    try {
      // 1. Fetch stock/system alert notifications
      const data = await notificationService.getUnreadNotifications();
      const list = data.results || data.resultats || (Array.isArray(data) ? data : []);
      
      // 2. Fetch pending order notifications
      const pendingOrders = useOrderNotificationStore.getState().pendingOrders;
      
      // Format pending orders as notifications
      const orderNotifs = pendingOrders.map((order: any) => ({
        id: `order-${order.id || order.numero_commande}`,
        isOrder: true,
        numeroCommande: order.numero_commande,
        titre: `Nouvelle commande ${order.numero_commande}`,
        message: `Par ${order.client_nom || 'Client'} - Total: ${order.total_ttc || order.total || 0} FCFA`,
        cree_le: order.cree_le || order.date_creation || new Date().toISOString(),
        est_lu: false,
      }));

      // Combine both lists
      const combined = [...orderNotifs, ...list];
      
      setNotifications(combined.slice(0, 8));
      const count = combined.length;
      setUnreadCount(count);
      
      // Update PWA badging count if supported by device
      if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
        if (count > 0) {
          (navigator as any).setAppBadge(count).catch((err: any) => console.warn('App badge failed:', err));
        } else {
          (navigator as any).clearAppBadge().catch((err: any) => console.warn('App badge clear failed:', err));
        }
      }
    } catch (error) {
      console.error('Header notifications fetch failed:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id, true);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <header className="h-16 bg-background border-b border-white/10 flex items-center px-4 sm:px-6 gap-3 sm:gap-4 shrink-0">
      <div className="flex items-center gap-2 pr-4 border-r border-white/10">
        <button
          onClick={() => router.push(profilePath)}
          className="flex items-center gap-2 text-foreground/60 hover:text-gold transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Retour</span>
        </button>
      </div>

      <button
        onClick={onMenuClick}
        className="text-foreground/60 hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-white/5"
      >
        <Menu size={20} />
      </button>

      {/* Search with autocomplete */}
      <div ref={searchRef} className="hidden sm:block relative flex-1 max-w-md">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/20 transition-all">
          <Search size={16} className={`transition-colors ${searchLoading ? 'text-gold animate-pulse' : 'text-foreground/40'}`} />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            placeholder="Rechercher commandes, clients, pages…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 outline-none"
          />
          {search && (
            <button onClick={() => { setSearch(''); setSuggestions([]); setShowSuggestions(false); }} className="text-foreground/30 hover:text-foreground/60 transition-colors">
              <span className="text-xs">✕</span>
            </button>
          )}
          {!search && <span className="text-xs text-foreground/40 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono flex-shrink-0">⏎</span>}
        </div>

        {/* Dropdown suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-background border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="py-1">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    router.push(s.href);
                    setSearch('');
                    setShowSuggestions(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    idx === activeSuggestion ? 'bg-gold/10 text-gold' : 'hover:bg-white/5 text-foreground'
                  }`}
                >
                  <span className={`flex-shrink-0 ${idx === activeSuggestion ? 'text-gold' : 'text-foreground/40'}`}>{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.label}</p>
                    {s.sub && <p className="text-[10px] text-foreground/40 truncate">{s.sub}</p>}
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-white/10 px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] text-foreground/30">↑↓ naviguer · ↵ sélectionner</span>
              <button
                onClick={() => {
                  const q = search.trim();
                  if (q) router.push(`/dashboard/admin/order?search=${encodeURIComponent(q)}`);
                  setShowSuggestions(false);
                }}
                className="text-[10px] text-gold hover:underline"
              >
                Voir tous les résultats →
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-foreground/60 transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-foreground/60 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-foreground text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-background rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">
                  {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map(n => {
                  const dateObj = new Date(n.cree_le || n.date_creation || Date.now());
                  const timeString = dateObj.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.isOrder) {
                          if (user?.roles?.includes('serveuse')) {
                            router.push('/dashboard/serveuse/orders');
                          } else {
                            router.push('/dashboard/admin/order');
                          }
                        } else {
                          if (user?.roles?.includes('serveuse')) {
                            router.push('/dashboard/serveuse/notifications');
                          } else {
                            router.push('/dashboard/admin/notifications');
                          }
                        }
                        setShowNotifs(false);
                      }}
                      className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer bg-white/[0.02]"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.isOrder ? 'bg-red-500' : 'bg-gold'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground font-medium truncate">{n.titre}</p>
                          <p className="text-[11px] text-foreground/60 line-clamp-2 mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-foreground/30 mt-1">{timeString}</p>
                        </div>
                        {!n.isOrder && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="p-1 rounded hover:bg-white/10 text-foreground/40 hover:text-foreground transition-colors shrink-0"
                            title="Marquer comme lue"
                          >
                            <Check size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {notifications.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs text-foreground/40 italic">
                    Aucune nouvelle notification
                  </div>
                )}
              </div>
              <div className="px-4 py-2 bg-white/5 border-t border-white/10 text-center">
                <Link
                  href={user?.roles?.includes('serveuse') ? '/dashboard/serveuse/notifications' : '/dashboard/admin/notifications'}
                  onClick={() => setShowNotifs(false)}
                  className="text-xs font-semibold text-gold hover:text-gold/80 transition-colors inline-block w-full py-1"
                >
                  Voir toutes les notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Link */}
        <Link 
          href={profilePath}
          className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors group"
          title="Mon Profil"
        >
          <User size={18} className="text-foreground/60 group-hover:text-gold transition-colors" />
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-xs font-bold shadow-lg shadow-gold/20 group-hover:scale-105 transition-transform">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <span className="hidden sm:block text-sm font-medium text-foreground">{user?.firstName || 'Admin'}</span>
        </Link>
      </div>
    </header>
  );
}


