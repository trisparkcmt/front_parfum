'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Watch, Droplets, Sparkles } from 'lucide-react';

const links = [
  { href: '/',                  icon: Home,     label: 'Accueil'      },
  { href: '/shop/accessories',  icon: Watch,    label: 'Accessoires'  },
  { href: '/shop/perfumes',     icon: Droplets, label: 'Parfum'       },
  { href: '/numba',             icon: Sparkles, label: 'Atelier'      },
];

const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-5 left-4 right-4 bg-[var(--t-nav-bg)]/95 backdrop-blur-xl border border-[var(--t-nav-border)]/50 z-[100] md:hidden shadow-2xl rounded-3xl"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0px)' }}
    >
      <div className="flex justify-around items-center h-18 px-1 py-2">
        {links.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 transition-all duration-200 hover:scale-110 ${
                isActive
                  ? 'text-gold scale-110'
                  : 'text-foreground/70 hover:text-gold active:text-gold'
              }`}
            >
              <div className="relative">
                <Icon size={22} />
                
              </div>
              <span
                className={`text-[10px] font-medium uppercase tracking-wider ${
                  isActive ? 'font-bold' : ''
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

