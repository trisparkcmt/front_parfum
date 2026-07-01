'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, BarChart2,
  Package, Cpu, Gem, X, ChevronDown, Sparkles, Droplets, Bell, DollarSign
} from 'lucide-react';
import { useOrderNotificationStore } from '@/store/useOrderNotificationStore';

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

const menuItems: NavItem[] = [
  { label: 'Tableau de Bord', icon: <LayoutDashboard size={18} />, href: '/dashboard/serveuse/dashboard' },
  { label: 'Dépenses', icon: <DollarSign size={18} />, href: '/dashboard/serveuse/expenses' },
  { label: 'Notifications', icon: <Bell size={18} />, href: '/dashboard/serveuse/notifications' }
];

const boutiqueItems: NavItem[] = [
  { label: 'Commandes', icon: <ShoppingCart size={18} />, href: '/dashboard/serveuse/order' },
  { label: 'Parfums', icon: <Sparkles size={18} />, href: '/dashboard/serveuse/perfume' },
  { label: 'Catégories', icon: <Package size={18} />, href: '/dashboard/serveuse/categories' },
  { label: 'Essences', icon: <Droplets size={18} />, href: '/dashboard/serveuse/essences' },
  { label: 'Produits Essence', icon: <Droplets size={18} />, href: '/dashboard/serveuse/produits-essence' },
  { label: 'Laboratoire', icon: <Cpu size={18} />, href: '/dashboard/serveuse/lab' },
  { label: 'Flacons', icon: <Package size={18} />, href: '/dashboard/serveuse/flacons' },
  { label: 'Accessoires', icon: <Gem size={18} />, href: '/dashboard/serveuse/accessories' },
  { label: 'Compositions', icon: <Cpu size={18} />, href: '/dashboard/serveuse/compositions' },
];

function NavItemComponent({ item }: { item: NavItem }) {
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
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group
            ${expanded ? 'text-gold' : 'text-foreground/60 hover:text-foreground hover:bg-white/5'}`}
        >
          <span className="flex items-center gap-3">
            <span className={`transition-colors ${expanded ? 'text-gold' : 'text-foreground/40 group-hover:text-foreground/60'}`}>
              {item.icon}
            </span>
            {item.label}
          </span>
          <span className={`transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}>
            <ChevronDown size={14} />
          </span>
        </button>
        <div className={`overflow-hidden transition-all duration-200 ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="ml-4 pl-4 border-l border-white/10 mt-1 space-y-0.5">
            {item.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200
                  ${pathname === child.href
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
      className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group
        ${isActive
          ? 'bg-gold/10 text-gold font-medium'
          : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
        }`}
    >
      <span className="flex items-center gap-3">
        <span className={`transition-colors ${isActive ? 'text-gold' : 'text-foreground/40 group-hover:text-foreground/60'}`}>
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
      <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-widest px-4 mb-2">{label}</p>
    </div>
  );
}

export default function ServeuseSidebar({ open, setOpen }: SidebarProps) {
  const { pendingCount } = useOrderNotificationStore();

  // Inject live badge count into the 'Commandes' item
  const boutiqueItemsWithBadge = boutiqueItems.map(item =>
    item.label === 'Commandes' && pendingCount > 0
      ? { ...item, badge: String(pendingCount) }
      : item
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 xl:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed xl:static inset-y-0 left-0 z-30
          flex flex-col w-[260px] bg-background border-r border-white/10
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <Link href="/dashboard/serveuse/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-lg shadow-gold/20 group-hover:shadow-gold/40 transition-shadow">
              <BarChart2 size={18} className="text-black" />
            </div>
            <span className="font-bold text-foreground text-lg tracking-tight">Boutique Serveuse</span>
          </Link> 
          <button className="xl:hidden text-foreground/40 hover:text-foreground transition-colors" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
          <SectionLabel label="ESPACE" />
          {menuItems.map(item => (
            <NavItemComponent key={item.label} item={item} />
          ))}

          <SectionLabel label="BOUTIQUE" />
          {boutiqueItemsWithBadge.map(item => (
            <NavItemComponent key={item.label} item={item} />
          ))}
        </nav>

        {/* Bottom branding */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
              <Sparkles size={14} className="text-gold" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Accessories Exclusif</p>
              <p className="text-[10px] text-foreground/40">v1.0 · Panel Serveuse</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
