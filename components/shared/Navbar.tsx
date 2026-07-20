'use client';

/**
 * @file components/shared/Navbar.tsx
 * @description Primary Navigation Header & User Session Manager.
 *
 * Layout Mechanics:
 * - **Mobile (< lg)**: 3-Column Grid. [Theme/Lang glass pill] on Left | [Gem] centered | [Cart/User glass pill] on Right.
 * - **Desktop (≥ lg)**: Three independent floating glass blocks. [Gem, no bg] on Left -> [Links pill] absolutely centered -> [Utilities pill] on Right.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { CartIcon, ProfileIcon } from '@/components/icons/CustomIcons';
import { Gem, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { PUBLIC_NAV_LINKS } from '@/lib/constants';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartDrawerStore } from '@/store/useCartDrawerStore';
import { Button } from '@/components/ui/Button';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Use proper selectors for auth state to ensure re-renders
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const itemCount = useCartStore((s) => s.getItemCount());
  const openCartDrawer = useCartDrawerStore((s) => s.open);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/delivery') || pathname.startsWith('/partner') || pathname.startsWith('/client');
  if (isDashboard || !mounted) return null;

  // Shared glass pill treatment for every floating block
  const glass = 'rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.25)] supports-[backdrop-filter]:bg-white/[0.06]';

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Navigation-in-progress indicator */}
      <div className={cn(
        'absolute inset-x-0 top-0 h-0.5 bg-gold transition-opacity duration-200',
        isNavigating ? 'opacity-100' : 'opacity-0'
      )} />

      <nav className={cn(
        'transition-all duration-300',
        scrolled ? 'py-3' : 'py-5'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ========================================================================= */}
          {/* MOBILE & TABLET LAYOUT: Active under 'lg' width scale                     */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-3 items-center lg:hidden">
            {/* Left utilities — glass pill */}
            <div className={cn(glass, 'flex items-center gap-0.5 p-1 justify-self-start')}>
              <ThemeToggle />
              <LanguageSelector />
            </div>

            {/* Centralized Identity — no background */}
            <div className="flex items-center justify-center">
              <Link href="/" className="flex items-center gap-2 group">
                <Gem className="h-7 w-7 text-gold group-hover:rotate-12 transition-transform duration-300" />
              </Link>
            </div>

            {/* Right utilities — each control is its own glass pill */}
            <div className="flex items-center gap-1.5 justify-self-end">
              <button onClick={openCartDrawer} className={cn(glass, 'relative p-2 flex items-center hover:bg-white/10 transition-colors')}>
                <CartIcon size={18} className="text-foreground/80" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold text-deep-black text-[9px] font-bold flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>

              {isAuthenticated && user ? (
                <Link
                  href="/dashboard/profile"
                  className={cn(glass, 'p-1 flex items-center hover:bg-white/10 transition-colors')}
                >
                  <div className="h-7 w-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-[10px] font-bold">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                </Link>
              ) : (
                <Link href="/login" className={cn(glass, 'flex items-center px-3 py-1.5')}>
                  <span className="text-xs font-semibold text-gold">{t('login')}</span>
                </Link>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DESKTOP LAYOUT: Three independent floating glass blocks                    */}
          {/* ========================================================================= */}
          <div className="hidden lg:flex items-center justify-between relative">

            {/* Left Block: Brand Logo — no background, no border */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0 z-10">
              <Gem className="h-8 w-8 text-gold group-hover:rotate-12 transition-transform duration-300" />
            </Link>

            {/* Center Block: Navigation Links — absolutely centered glass pill */}
            <div className={cn(
              glass,
              'absolute left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5'
            )}>
              {PUBLIC_NAV_LINKS.map((link) => {
                const labelKey = link.label === 'Accueil' ? 'nav_home' :
                  link.label === 'Accessoires' ? 'nav_accessories' :
                    link.label === 'Parfumerie' ? 'nav_perfumes' :
                      link.label === 'Atelier Numba' ? 'nav_atelier' : '';
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200',
                      isActive
                        ? 'text-gold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-gold'
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="navbar-active-pill"
                        className="absolute inset-0 rounded-full bg-gold/15 border border-gold/20"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative">{labelKey ? t(labelKey) : link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Block: Utilities — each control is its own glass pill */}
            <div className="flex items-center gap-2 z-10">
              <div className={cn(glass, 'p-1.5 flex items-center')}>
                <ThemeToggle />
              </div>

              <div className={cn(glass, 'p-1.5 flex items-center gap-0.5')}>
                <button
                  onClick={() => { openCartDrawer(); }}
                  className="relative p-1.5 flex items-center rounded-full hover:bg-white/10 transition-colors"
                >
                  <CartIcon size={19} className="text-foreground/80" />
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gold text-deep-black text-[10px] font-bold flex items-center justify-center"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </button>

                <Link
                  href="/dashboard/client/favorites"
                  className="p-1.5 flex items-center rounded-full hover:bg-white/10 transition-colors"
                >
                  <Heart size={19} className="text-foreground/80" />
                </Link>
              </div>

              <div className={cn(glass, 'p-1.5 flex items-center')}>
                <LanguageSelector />
              </div>

              {isAuthenticated && user ? (
                <Link
                  href="/dashboard/profile"
                  onClick={() => setIsNavigating(true)}
                  className={cn(glass, 'flex items-center gap-2 pl-1.5 pr-3 py-1.5 hover:bg-white/10 transition-colors group')}
                >
                  <div className="h-8 w-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-xs font-bold group-hover:scale-105 transition-transform">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <span className="text-xs font-medium text-foreground/70 group-hover:text-gold transition-colors">
                    {user.firstName}
                  </span>
                </Link>
              ) : (
                <Link href="/login" onClick={() => setIsNavigating(true)}>
                  <Button variant="secondary" size="sm" className={cn(glass, 'border-gold/30 text-gold hover:bg-gold/10')}>
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