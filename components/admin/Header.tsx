'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Moon, Sun, Bell, ChevronDown, LogOut, Settings, User, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';

import Link from 'next/link';

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const notifications = [
    { id: 1, text: 'Nouvelle commande #00126 reçue', time: 'Il y a 5 min', unread: true },
    { id: 2, text: 'Stock bas : Dupe Sauvage (3 restants)', time: 'Il y a 1h', unread: true },
    { id: 3, text: 'Livraison #LIV003 confirmée', time: 'Il y a 3h', unread: false },
    { id: 4, text: 'Nouveau client inscrit : Fatou N.', time: 'Hier', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="h-16 bg-background border-b border-white/10 flex items-center px-4 sm:px-6 gap-3 sm:gap-4 shrink-0">
      <div className="flex items-center gap-2 pr-4 border-r border-white/10">
        <button
          onClick={() => router.push('/dashboard/admin/profile')}
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
                  {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${n.unread ? 'bg-white/[0.02]' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {n.unread && <div className="w-2 h-2 bg-gold rounded-full mt-1.5 shrink-0" />}
                      <div className={n.unread ? '' : 'ml-5'}>
                        <p className={`text-xs ${n.unread ? 'text-foreground font-medium' : 'text-foreground/60'}`}>{n.text}</p>
                        <p className="text-[11px] text-foreground/40 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Link */}
        <Link 
          href="/dashboard/admin/profile"
          className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-xs font-bold shadow-lg shadow-gold/20 group-hover:scale-105 transition-transform">
            {user?.firstName?.charAt(0)}
          </div>
          <span className="hidden sm:block text-sm font-medium text-foreground">{user?.firstName || 'Admin'}</span>
        </Link>
      </div>
    </header>
  );
}


