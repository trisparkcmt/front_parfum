'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Heart, Watch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HomeIcon, DiffuseurIcon, PerfumeIcon, LaptopIcon, ReelsIcon, CartIcon, ProfileIcon } from '@/components/icons/CustomIcons';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartDrawerStore } from '@/store/useCartDrawerStore';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';

const links = [
  { href: '/', labelKey: 'nav_home', fallback: 'Accueil', icon: HomeIcon },
  { href: '/shop/accessories', labelKey: 'nav_accessories', fallback: 'Accessoires', icon: Watch },
  { href: '/shop/perfumes', labelKey: 'nav_perfumes', fallback: 'Parfumerie', icon: PerfumeIcon },
  { href: '/shop/diffuseurs', labelKey: 'nav_diffuseurs', fallback: 'Diffuseurs', icon: DiffuseurIcon },
  { href: '/reels', labelKey: 'nav_reels', fallback: 'Reels', icon: ReelsIcon },
  { href: '/numba', labelKey: 'nav_numba', fallback: 'Numba', icon: LaptopIcon },
];

export function TabletDock() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const itemCount = useCartStore((state) => state.getItemCount());
  const openCartDrawer = useCartDrawerStore((state) => state.open);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const portalTarget = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return document.body;
  }, []);

  if (!portalTarget) return null;

  return createPortal(
    <nav
      aria-label={t('main_navigation', 'Navigation principale')}
      className="fixed bottom-5 left-1/2 z-[100] hidden w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-deep-black/80 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-2xl tablet:flex nav:hidden"
      style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {links.map(({ href, labelKey, fallback, icon: Icon }) => {
        const label = t(labelKey, fallback);
        const isActive = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            title={label}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            onClick={(event) => {
              if (isActive) {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
              isActive ? 'bg-gold text-black' : 'text-foreground/65 hover:bg-white/10 hover:text-gold'
            }`}
          >
            <Icon size={20} />
            {isActive && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-gold" />}
          </Link>
        );
      })}

      <span aria-hidden="true" className="mx-1 h-7 w-px shrink-0 bg-white/15" />

      <button
        type="button"
        onClick={openCartDrawer}
        title={t('nav_cart', 'Panier')}
        aria-label={t('nav_cart', 'Panier')}
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground/65 transition-colors hover:bg-white/10 hover:text-gold"
      >
        <CartIcon size={21} />
        {itemCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-black">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      <Link
        href="/dashboard/client/favorites"
        title={t('nav_favorites', 'Favoris')}
        aria-label={t('nav_favorites', 'Favoris')}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground/65 transition-colors hover:bg-white/10 hover:text-gold"
      >
        <Heart size={20} />
      </Link>

      <ThemeToggle className="flex h-11 w-11 shrink-0 items-center justify-center p-0 text-foreground/65 hover:bg-white/10" />
      <div className="shrink-0 [&_button]:text-foreground/65 [&_button]:hover:bg-white/10">
        <LanguageSelector />
      </div>

      <Link
        href={isAuthenticated ? '/dashboard/profile' : '/login'}
        title={t(isAuthenticated ? 'nav_profile' : 'nav_login', isAuthenticated ? 'Profil' : 'Connexion')}
        aria-label={t(isAuthenticated ? 'nav_profile' : 'nav_login', isAuthenticated ? 'Profil' : 'Connexion')}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground/65 transition-colors hover:bg-white/10 hover:text-gold"
      >
        <ProfileIcon size={20} />
      </Link>
    </nav>,
    portalTarget
  );
}
