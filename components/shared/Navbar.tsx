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
import { cn } from '@/lib/utils';
import { PUBLIC_NAV_LINKS } from '@/lib/constants';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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

  const isDashboard = pathname.startsWith('/admin') || pathname.startsWith('/delivery') || pathname.startsWith('/partner') || pathname.startsWith('/client');
  if (isDashboard || !mounted) return null;

  const getDashboardLink = () => {
    if (!user) return '/dashboard/client';
    switch (user.role) {
      case 'admin': return '/dashboard/admin';
      case 'delivery': return '/dashboard/delivery';
      case 'partner': return '/dashboard/partner';
      default: return '/dashboard/client';
    }
  };

  return (
    <header className=" backdrop-blur-lg  fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <nav className={cn(
        'transition-all duration-300 border-transparent',
        scrolled ? 'glass-dark py-0 border-b border-gold-300 ' : 'bg-transparent py-2'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Gem className="h-7 w-7 text-gold group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-display text-lg font-bold tracking-tight">
                <span className="text-gold">Accessories</span>{' '}
                <span className="text-cream">Exclusif</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {PUBLIC_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2  text-sm font-medium transition-all duration-200',
                    pathname === link.href
                      ? 'text-gold bg-gold/10'
                      : 'text-cream/70 hover:text-gold hover:bg-gold/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Cart */}
              <Link
                href="/cart"
                className="relative p-2.5  hover:bg-white/5 transition-colors"
              >
                <ShoppingBag size={20} className="text-cream/80" />
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
                className="hidden sm:flex p-2.5  hover:bg-white/5 transition-colors"
              >
                <Heart size={20} className="text-cream/80" />
              </Link>

              {/* User */}
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-2  hover:bg-white/5 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-xs font-bold">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <ChevronDown size={14} className={cn('text-cream/50 transition-transform', userMenuOpen && 'rotate-180')} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-56  glass-dark border border-white/10 shadow-2xl overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-white/5">
                          <p className="text-sm font-medium text-cream">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-cream/50">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link href={getDashboardLink()} onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-cream/70 hover:text-gold hover:bg-gold/5 transition-colors">
                            <LayoutDashboard size={16} /> Mon Espace
                          </Link>
                          <button onClick={() => { logout(); setUserMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-colors">
                            <LogOut size={16} /> Déconnexion
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/login">
                  <Button variant="gold-outline" size="sm">
                    <User size={16} />
                    Connexion
                  </Button>
                </Link>
              )}

              {/* Mobile hamburger */}
              
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-white/5 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {PUBLIC_NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'block px-4 py-3  text-sm font-medium transition-colors',
                      pathname === link.href
                        ? 'text-gold bg-gold/10'
                        : 'text-cream/70 hover:text-gold hover:bg-gold/5'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
