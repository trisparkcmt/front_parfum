'use client';

/**
 * @file components/shared/Navbar.tsx
 * @description Primary Navigation Header & User Session Manager.
 *
 * This component is the main navigation hub of the application. It provides
 * access to all major sections while managing user session visibility.
 * 
 * **Key Functionalities**:
 * - **Dynamic Role-Based Navigation**: Uses the `getDashboardLink` helper to direct users to their specific dashboard (Admin, Client, Partner, Delivery) based on their account role.
 * - **Session Management**: Subscribes to `useAuthStore` to display user names, roles, and provide a "Déconnexion" (logout) action.
 * - **Live Cart & Favorites Tracking**: Shows real-time counts for items in the shopping cart and wishlist, with direct links to those pages.
 * - **Responsive Design**: Implements a mobile-friendly layout with a collapsible menu for smaller screens.
 * - **Visual Effects**: Features a `glass-morphism` effect with transparency that adapts as the user scrolls.
 * 
 * **Integrations**: Uses `framer-motion` for smooth menu transitions and `lucide-react` for iconography.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Heart, User, Menu, X, ChevronDown,
  LogOut, LayoutDashboard, Gem
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { PUBLIC_NAV_LINKS } from '@/lib/constants';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/delivery') || pathname.startsWith('/partner') || pathname.startsWith('/client');
  if (isDashboard || !mounted) return null;

  const getDashboardLink = () => {
    if (!user) return '/dashboard/client';
    switch (user.role) {
      case 'admin': return '/dashboard/admin/dashboard';
      case 'delivery': return '/dashboard/delivery';
      case 'partner': return '/dashboard/partner';
      default: return '/dashboard/client';
    }
  };

  return (
    <header className={cn(
      "backdrop-blur-lg fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    )}>
      <nav className={cn(
        'transition-all duration-300 border-transparent',
        scrolled ? 'glass-dark py-0 border-b border-[var(--t-nav-border)]' : 'bg-transparent py-2'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Gem className="h-7 w-7 text-gold group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-display text-lg font-bold tracking-tight">
                <span className="text-gold">Accessories</span>{' '}
                <span className="text-foreground">Exclusif</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {PUBLIC_NAV_LINKS.map((link) => {
                const labelKey = link.label === 'Accueil' ? 'nav_home' :
                  link.label === 'Accessoires' ? 'nav_accessories' :
                    link.label === 'Parfumerie' ? 'nav_perfumes' :
                      link.label === 'Atelier Numba' ? 'nav_atelier' : '';

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'px-4 py-2  text-sm font-medium transition-all duration-200',
                      pathname === link.href
                        ? 'text-gold bg-gold/10'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-gold hover:bg-gold/5'
                    )}
                  >
                    {labelKey ? t(labelKey) : link.label}
                  </Link>
                );
              })}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle (Desktop) */}
              <div className="block">
                <ThemeToggle />
              </div>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative p-2.5  hover:bg-[var(--t-hover-bg)] transition-colors"
              >
                <ShoppingBag size={20} className="text-foreground/80" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-gold text-deep-black text-[10px] font-bold flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </Link>

              {/* Favorites */}
              <Link
                href="/dashboard/client/favorites"
                className="hidden sm:flex p-2.5  hover:bg-[var(--t-hover-bg)] transition-colors"
              >
                <Heart size={20} className="text-foreground/80" />
              </Link>
              {/* Language Selector */}
              <div className="hidden sm:block">
                <LanguageSelector />
              </div>

              {/* User */}
              {isAuthenticated && user ? (
                <Link
                  href={user.role === 'admin' ? '/dashboard/admin/profile' : `/dashboard/${user.role}/profile`}
                  className="flex items-center gap-2 p-2 hover:bg-[var(--t-hover-bg)] transition-colors group"
                >
                  <div className="h-8 w-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-xs font-bold group-hover:scale-105 transition-transform">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <span className="hidden sm:block text-xs font-medium text-foreground/70 group-hover:text-gold transition-colors">
                    {user.firstName}
                  </span>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="secondary" size="sm" className="flex border-gold/30 text-gold hover:bg-gold/10">
                    {t('login')}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
