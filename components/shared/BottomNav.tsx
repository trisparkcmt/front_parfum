'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { HomeIcon, CartIcon, DiffuseurIcon, PerfumeIcon, LaptopIcon } from '@/components/icons/CustomIcons';
import { Watch } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useCartDrawerStore } from '@/store/useCartDrawerStore';

type BottomNavLink = {
  href: string;
  icon: typeof HomeIcon | typeof Watch | typeof PerfumeIcon | typeof DiffuseurIcon | typeof LaptopIcon;
  label: string;
  badge?: string | number;
  action?: (() => void) | null;
};

const BottomNav = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const openCartDrawer = useCartDrawerStore((s) => s.open);

  useEffect(() => {
    setMounted(true);
  }, []);

  const links: BottomNavLink[] = [
    { href: '/',                  icon: HomeIcon,      label: t('nav_home', 'Accueil'),        action: null },
    { href: '/shop/accessories',  icon: Watch,         label: t('nav_accessories', 'Accessoires'), action: null },
    { href: '/shop/perfumes',     icon: PerfumeIcon,   label: t('nav_perfumes', 'Parfum'),     action: null },
    { href: '/shop/diffuseurs',   icon: DiffuseurIcon, label: t('nav_diffuseurs', 'Diffuseurs'), action: null },
    { href: '/numba',             icon: LaptopIcon,    label: t('nav_atelier', 'Atelier'),     action: null },
  ];

  // Avoid hydration mismatch: render a stable shell until i18n is ready client-side
  if (!mounted) {
    return (
      <nav
        className="fixed bottom-5 left-4 right-4 z-[100] md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="h-16 rounded-full border border-white/10 bg-deep-black/70 backdrop-blur-2xl" />
      </nav>
    );
  }

  return (
    <nav
      className="fixed bottom-5 left-4 right-4 z-[100] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Glass pill shell */}
      <div
        className="relative flex items-center justify-between gap-1 h-16 px-2
                   rounded-full border border-white/10
                   bg-deep-black/70 backdrop-blur-2xl
                   shadow-[0_8px_32px_rgba(0,0,0,0.55)]
                   before:absolute before:inset-0 before:rounded-full
                   before:bg-gradient-to-b before:from-white/[0.06] before:to-transparent
                   before:pointer-events-none"
      >
        <LayoutGroup id="bottom-nav">
          {links.map(({ href, icon: Icon, label, badge, action }) => {
            const isActive =
              href === '/' ? pathname === '/' : pathname.startsWith(href) && href !== '/cart';

            const inner = (
              <motion.div
                layout
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 34,
                  mass: 0.7,
                }}
                className={`relative flex items-center h-11 rounded-full overflow-hidden
                  ${isActive ? 'px-4 gap-2' : 'w-11 justify-center'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavActivePill"
                    className="absolute inset-0 rounded-full bg-gold/95
                               shadow-[0_2px_14px_rgba(212,175,55,0.35)]"
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 34,
                      mass: 0.7,
                    }}
                  />
                )}

                <span
                  className={`relative shrink-0 transition-colors duration-200 ${
                    isActive ? 'text-black' : 'text-foreground/60'
                  }`}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.1 : 1.8} />
                  {!!badge && (
                    <span
                      className="absolute -top-2 -right-2.5 bg-foreground text-background
                                 font-bold text-[9px] rounded-full w-4 h-4
                                 flex items-center justify-center border border-deep-black"
                    >
                      {badge}
                    </span>
                  )}
                </span>

                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, width: 0, x: -4 }}
                      animate={{ opacity: 1, width: 'auto', x: 0 }}
                      exit={{ opacity: 0, width: 0, x: -4 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="relative whitespace-nowrap text-[11px] font-semibold
                                 uppercase tracking-wider text-black"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            );

            return action ? (
              <button
                key={href}
                onClick={action}
                aria-label={label}
                className="relative z-10 flex items-center justify-center h-full flex-1"
              >
                {inner}
              </button>
            ) : (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className="relative z-10 flex items-center justify-center h-full flex-1"
              >
                {inner}
              </Link>
            );
          })}
        </LayoutGroup>
      </div>
    </nav>
  );
};

export default BottomNav;