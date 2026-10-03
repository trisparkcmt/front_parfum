'use client';

/**
 * @file components/admin/BoutiqueSidebar.tsx
 * @description Boutique partner dashboard navigation sidebar component.
 */
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useNotificationCountStore } from '@/store/useNotificationCountStore';
import {
  LayoutDashboard, ShoppingCart, BarChart2,
  Package, Gem, X, ChevronDown, Sparkles, Bell, Wallet, Store
} from 'lucide-react';
import { PerfumeIcon, EssenceIcon, DiffuseurIcon, LaptopIcon } from '@/components/icons/CustomIcons';

interface SidebarProps {
  open: boolean;
  setOpen: (v: boolean) => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  badge?: string;
  children?: { label: string; href: string; badge?: string }[];
}

function NavItemComponent({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(
    item.children?.some(c => pathname.startsWith(c.href)) || false
  );

  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.href ? pathname === item.href : false;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
            expanded ? 'text-gold' : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-3">
            <span
              className={`transition-colors ${
                expanded ? 'text-gold' : 'text-foreground/40 group-hover:text-foreground/60'
              }`}
            >
              {item.icon}
            </span>
            {item.label}
          </span>
          <span className={`transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}>
            <ChevronDown size={14} />
          </span>
        </button>
        <div
          className={`overflow-hidden transition-all duration-200 ${
            expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="ml-4 pl-4 border-l border-white/10 mt-1 space-y-0.5">
            {item.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  pathname === child.href
                    ? 'bg-gold/10 text-gold font-medium'
                    : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
                }`}
              >
                {child.label}
                {child.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gold/10 text-gold">
                    {child.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href || '#'}
      onClick={onNavigate}
      className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
        isActive
          ? 'bg-gold/10 text-gold font-medium'
          : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
      }`}
    >
      <span className="flex items-center gap-3">
        <span
          className={`transition-colors ${
            isActive ? 'text-gold' : 'text-foreground/40 group-hover:text-foreground/60'
          }`}
        >
          {item.icon}
        </span>
        {item.label}
      </span>
      {item.badge && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gold/10 text-gold">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="pt-4 pb-1">
      <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-widest px-4 mb-2">
        {label}
      </p>
    </div>
  );
}

export default function BoutiqueSidebar({ open, setOpen }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const isEn = i18n?.language?.startsWith('en');
  const { unreadNotificationCount, pendingActionCount } = useNotificationCountStore();

  const spaceItems: NavItem[] = [
    {
      label: t('boutique_nav_dashboard', { defaultValue: isEn ? 'Dashboard' : 'Tableau de Bord' }),
      icon: <LayoutDashboard size={18} />,
      href: '/dashboard/boutique',
    },
    {
      label: t('boutique_nav_my_products', { defaultValue: isEn ? 'My Products' : 'Mes Produits' }),
      icon: <Package size={18} />,
      href: '/dashboard/boutique/produits',
    },
    {
      label: t('boutique_nav_wallet', { defaultValue: isEn ? 'My Wallet' : 'Mon Portefeuille' }),
      icon: <Wallet size={18} />,
      href: '/dashboard/boutique/wallet',
    },
    {
      label: t('admin_nav_notifications', { defaultValue: 'Notifications' }),
      icon: <Bell size={18} />,
      href: '/dashboard/boutique/notifications',
      badge: unreadNotificationCount > 0 ? String(unreadNotificationCount) : undefined,
    },
  ];

  const shopItems: NavItem[] = [
    {
      label: t('admin_nav_orders', { defaultValue: isEn ? 'Orders' : 'Commandes' }),
      icon: <ShoppingCart size={18} />,
      href: '/dashboard/boutique/order',
      badge: pendingActionCount > 0 ? String(pendingActionCount) : undefined,
    },
    {
      label: t('admin_nav_perfumes', { defaultValue: isEn ? 'Perfumes' : 'Parfums' }),
      icon: <PerfumeIcon size={18} />,
      href: '/dashboard/boutique/perfume',
    },
    {
      label: t('admin_nav_categories', { defaultValue: isEn ? 'Categories' : 'Catégories' }),
      icon: <Package size={18} />,
      href: '/dashboard/boutique/categories',
    },
    {
      label: t('admin_nav_essences', { defaultValue: 'Essences' }),
      icon: <EssenceIcon size={18} />,
      href: '/dashboard/boutique/essences',
    },
    {
      label: isEn ? 'Oil' : 'Huile',
      icon: <EssenceIcon size={18} />,
      href: '/dashboard/boutique/produits-essence',
    },
    {
      label: t('admin_nav_lab', { defaultValue: isEn ? 'Laboratory' : 'Laboratoire' }),
      icon: <LaptopIcon size={18} />,
      href: '/dashboard/boutique/lab',
    },
    {
      label: t('admin_nav_bottles', { defaultValue: isEn ? 'Bottles' : 'Flacons' }),
      icon: <Package size={18} />,
      href: '/dashboard/boutique/flacons',
    },
    {
      label: t('admin_nav_accessories', { defaultValue: isEn ? 'Accessories' : 'Accessoires' }),
      icon: <Gem size={18} />,
      href: '/dashboard/boutique/accessories',
    },
    {
      label: t('admin_nav_diffusers', { defaultValue: isEn ? 'Diffusers' : 'Diffuseurs' }),
      icon: <DiffuseurIcon size={18} />,
      href: '/dashboard/boutique/diffuseurs',
    },
    {
      label: t('admin_nav_compositions', { defaultValue: 'Compositions' }),
      icon: <LaptopIcon size={18} />,
      href: '/dashboard/boutique/compositions',
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 nav:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed nav:static inset-y-0 left-0 z-30 flex flex-col w-[260px] bg-background border-r border-white/10 transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full nav:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <Link
            href="/dashboard/boutique"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-lg shadow-gold/20 group-hover:shadow-gold/40 transition-shadow">
              <Store size={18} className="text-black" />
            </div>
            <span className="font-bold text-foreground text-lg tracking-tight">
              Espace Boutique
            </span>
          </Link>
          <button
            className="nav:hidden text-foreground/40 hover:text-foreground transition-colors"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
          <SectionLabel label={t('boutique_nav_space', { defaultValue: isEn ? 'SPACE' : 'ESPACE' })} />
          {spaceItems.map((item) => (
            <NavItemComponent key={item.label} item={item} onNavigate={() => setOpen(false)} />
          ))}

          <SectionLabel label={t('admin_nav_shop', { defaultValue: isEn ? 'SHOP' : 'BOUTIQUE' })} />
          {shopItems.map((item) => (
            <NavItemComponent key={item.label} item={item} onNavigate={() => setOpen(false)} />
          ))}
        </nav>

        {/* Bottom branding */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
              <Sparkles size={14} className="text-gold" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Accessoires Exclusifs</p>
              <p className="text-[10px] text-foreground/40">
                v1.0 · {t('boutique_panel_title', { defaultValue: isEn ? 'Boutique Panel' : 'Panel Boutique' })}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
