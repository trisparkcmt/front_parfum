'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Moon, Sun, Bell, ChevronDown, LogOut, Settings, User, ArrowLeft, Check } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrderNotificationStore } from '@/store/useOrderNotificationStore';
import { notificationService } from '@/services/apiService';

import Link from 'next/link';

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  
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

      {/* Search */}
      <div className="hidden sm:flex items-center gap-2 flex-1 max-w-md bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/20 transition-all">
        <Search size={16} className="text-foreground/40" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 outline-none"
        />
        <span className="text-xs text-foreground/40 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">⌘K</span>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-foreground/60 transition-colors"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
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


