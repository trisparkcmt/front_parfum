'use client';

/**
 * @file components/shared/Navbar.tsx
 * @description Primary Navigation Header & User Session Manager.
 * 
 * Layout Mechanics:
 * - **Mobile (< lg)**: 3-Column Grid. [Theme/Lang] on Left | [Gem] centered | [Cart/User] on Right.
 * - **Desktop (≥ lg)**: Standard Flex spacing. [Gem] on Left -> [Links] in Center -> [Utilities] on Right.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Gem } from 'lucide-react';
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
  const [scrolled, setScrolled] = useState(false);

  // Use proper selectors for auth state to ensure re-renders
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const itemCount = useCartStore((s) => s.getItemCount());

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debug logging for auth state
  useEffect(() => {
    console.log('Navbar auth state:', { user, isAuthenticated });
  }, [user, isAuthenticated]);

  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/delivery') || pathname.startsWith('/partner') || pathname.startsWith('/client');
  if (isDashboard || !mounted) return null;

  return (
    <header className={cn(
      "backdrop-blur-lg fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    )}>
      <nav className={cn(
        'transition-all duration-300 border-transparent',
        scrolled ? 'bg-[var(--t-nav-dark-bg)] py-0 border-b border-[var(--t-nav-border)]' : 'bg-transparent py-2'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* ========================================================================= */}
          {/* MOBILE & TABLET LAYOUT: Active under 'lg' width scale                     */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-3 items-center h-16 lg:hidden">
            {/* Left side utilities */}
            <div className="flex items-center gap-1.5 justify-start">
              <ThemeToggle />
              <LanguageSelector />
            </div>

            {/* Centralized Identity */}
            <div className="flex items-center justify-center">
              <Link href="/" className="flex items-center gap-2 group">
                <Gem className="h-7 w-7 text-gold group-hover:rotate-12 transition-transform duration-300" />
              </Link>
            </div>

            {/* Right side interactions */}
            <div className="flex items-center gap-1 justify-end">
              <Link href="/cart" className="relative p-2 hover:bg-[var(--t-hover-bg)] transition-colors">
                <ShoppingBag size={20} className="text-foreground/80" />
                {itemCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-gold text-deep-black text-[9px] font-bold flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>

              {isAuthenticated && user ? (
                <Link
                  href="/dashboard/profile"
                  className="p-1.5 hover:bg-[var(--t-hover-bg)] transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-[10px] font-bold">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                </Link>
              ) : (
                <Link href="/login">
                  <span className="text-xs font-semibold text-gold px-2 py-1">{t('login')}</span>
                </Link>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DESKTOP LAYOUT: Active from 'lg' width break point and upward              */}
          {/* ========================================================================= */}
          <div className="hidden lg:flex items-center justify-between h-20">
            
            {/* Left Side: Brand Logo */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <Gem className="h-7 w-7 text-gold group-hover:rotate-12 transition-transform duration-300" />
            </Link>

            {/* Middle Space: Navigation Links */}
            <div className="flex items-center gap-1 mx-6">
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
                      'px-4 py-2 text-sm font-medium transition-all duration-200',
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

            {/* Right Side: Global Configuration and User Accounts */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <ThemeToggle />
              
              <Link
                href="/cart"
                className="relative p-2.5 hover:bg-[var(--t-hover-bg)] transition-colors"
              >
                <ShoppingBag size={20} className="text-foreground/80" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-gold text-deep-black text-[10px] font-bold flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </Link>

              <Link
                href="/dashboard/client/favorites"
                className="p-2.5 hover:bg-[var(--t-hover-bg)] transition-colors"
              >
                <Heart size={20} className="text-foreground/80" />
              </Link>
              
              <LanguageSelector />

              {isAuthenticated && user ? (
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-2 p-2 hover:bg-[var(--t-hover-bg)] transition-colors group"
                >
                  <div className="h-8 w-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-xs font-bold group-hover:scale-105 transition-transform">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <span className="text-xs font-medium text-foreground/70 group-hover:text-gold transition-colors">
                    {user.firstName}
                  </span>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="secondary" size="sm" className="border-gold/30 text-gold hover:bg-gold/10">
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