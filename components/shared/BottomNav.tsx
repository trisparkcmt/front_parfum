'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { HomeIcon, CartIcon } from '@/components/icons/CustomIcons';
import { Watch, Droplets, Sparkles } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

const BottomNav = () => {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.getItemCount());

  const links = [
    { href: '/',                  icon: HomeIcon, label: 'Accueil'     },
    { href: '/shop/accessories',  icon: Watch,     label: 'Accessoires' },
    { href: '/shop/perfumes',     icon: Droplets,  label: 'Parfum'      },
    { href: '/numba',             icon: Sparkles,  label: 'Atelier'     },
    { href: '/cart',              icon: CartIcon,  label: 'Panier', badge: itemCount },
  ];

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
          {links.map(({ href, icon: Icon, label, badge }) => {
            const isActive =
              href === '/' ? pathname === '/' : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className="relative z-10 flex items-center justify-center h-full flex-1"
              >
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
                  {/* Sliding gold-glass highlight behind the active tab */}
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
              </Link>
            );
          })}
        </LayoutGroup>
      </div>
    </nav>
  );
};

export default BottomNav;