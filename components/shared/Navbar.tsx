'use client';

/**
 * @file components/shared/Navbar.tsx
 * @description Primary Navigation Header & User Session Manager.
 *
 * Layout Mechanics:
 * - **Mobile (<lg)**: Full-width flat bar edge-to-edge, same color as page bg.
 *   [Language + Profile] on Left | [Gem] centered (absolutely) | [ThemeToggle + Cart] on Right.
 * - **Desktop (≥lg)**: Three independent floating glass blocks.
 *   [Gem, no bg] on Left -> [Links pill] absolutely centered -> [Utilities pill] on Right.
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
import { useThemeStore } from '@/store/useThemeStore';
import { Button } from '@/components/ui/Button';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Auth & cart state
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const itemCount = useCartStore((s) => s.getItemCount());
  const openCartDrawer = useCartDrawerStore((s) => s.open);

  // Theme-reactive icon color — avoids CSS dark: variant issues
  const theme = useThemeStore((s) => s.theme);
  const iconColor = theme === 'dark' ? 'text-white' : 'text-black';

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

  // Shared glass pill treatment for desktop floating blocks
  const glass = cn(
    'rounded-full border backdrop-blur-xl backdrop-saturate-150 shadow-md shadow-black/5 transition-colors duration-300',
    scrolled
      ? 'bg-white/90 border-black/15 shadow-lg dark:bg-zinc-900/70 dark:border-white/10'
      : 'bg-white/70 border-white/70 dark:bg-zinc-900/60 dark:border-white/10'
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Navigation-in-progress indicator */}
      <div className={cn(
        'absolute inset-x-0 top-0 h-0.5 bg-gold transition-opacity duration-200',
        isNavigating ? 'opacity-100' : 'opacity-0'
      )} />

      {/* ================================================================= */}
      {/* MOBILE & TABLET LAYOUT: Full-width flat bar, no pill, edge-to-edge */}
      {/* ================================================================= */}
      <div className="flex items-center lg:hidden bg-background border-b border-foreground/10 px-4 py-2.5 relative">

        {/* Left: Language Selector + Profile Icon */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <LanguageSelector />
          {isAuthenticated && user ? (
            <Link
              href="/dashboard/profile"
              onClick={() => setIsNavigating(true)}
              className="flex items-center flex-shrink-0"
              aria-label={t('profile')}
            >
              <div className="flex items-center justify-center text-[10px] font-bold hover:scale-105 transition-transform">
                <ProfileIcon size={18} className={iconColor} />
              </div>
            </Link>
          ) : (
            <Link href="/login" onClick={() => setIsNavigating(true)} className="flex-shrink-0">
              <Button className="text-[0.65rem] rounded-full " variant="secondary" size="sm">{t('login')}</Button>
            </Link>
          )}
        </div>

        {/* Center: Gem Brand Icon — absolutely centered on the bar */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link href="/" className="flex items-center group">
            <Gem className="h-6 w-6 text-gold group-hover:rotate-12 transition-transform duration-300" />
          </Link>
        </div>

        {/* Right: Theme Toggle + Cart */}
        <div className="flex items-center gap-0.5 flex-shrink-0 ml-auto">
          <ThemeToggle />
          <button
            onClick={openCartDrawer}
            className="relative p-1.5 flex items-center hover:bg-foreground/5 rounded-full transition-colors group"
            aria-label={t('cart')}
          >
            <CartIcon size={19} className={cn(iconColor, 'group-hover:text-gold transition-colors')} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold text-deep-black text-[9px] font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* ================================================================= */}
      {/* DESKTOP LAYOUT: Three independent floating glass blocks            */}
      {/* ================================================================= */}
      <nav className={cn(
        'hidden lg:block transition-all duration-300',
        scrolled ? 'py-2.5' : 'py-4'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between relative">

            {/* Left Block: Brand Logo */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0 z-10">
              <Gem className="h-8 w-8 text-gold group-hover:rotate-12 transition-transform duration-300" />
            </Link>

            {/* Center Block: Navigation Links — flex centered glass pill */}
            <div className={cn(glass, 'flex items-center gap-1 p-1.5 mx-auto')}>
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
                      'relative px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200',
                      isActive
                        ? 'text-gold'
                        : 'text-zinc-900 dark:text-zinc-100 hover:text-gold'
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

            {/* Right Block: Utilities */}
            <div className="flex items-center gap-2 z-10">
              <div className={cn(glass, 'p-1.5 flex items-center')}>
                <ThemeToggle />
              </div>

              <div className={cn(glass, 'p-1.5 flex items-center gap-0.5')}>
                <button
                  onClick={() => { openCartDrawer(); }}
                  className="relative p-1.5 flex items-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <CartIcon size={19} className="text-zinc-900 dark:text-zinc-100 group-hover:text-gold transition-colors" />
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
                  className="p-1.5 flex items-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <Heart size={19} className="text-zinc-900 dark:text-zinc-100 hover:text-gold transition-colors" />
                </Link>
              </div>

              <div className={cn(glass, 'p-1.5 flex items-center')}>
                <LanguageSelector />
              </div>

              {isAuthenticated && user ? (
                <Link
                  href="/dashboard/profile"
                  onClick={() => setIsNavigating(true)}
                  className={cn(glass, 'flex items-center justify-center p-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors group')}
                  aria-label={t('profile')}
                >
                  <div className="h-8 w-8 rounded-full bg-foreground/5 border border-foreground/10 dark:bg-white/10 dark:border-white/10 flex items-center justify-center text-foreground/80 group-hover:scale-105 transition-transform">
                    <ProfileIcon size={18} className="text-zinc-900 dark:text-zinc-100 group-hover:text-gold transition-colors" />
                  </div>
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