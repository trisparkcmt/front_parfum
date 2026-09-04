'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface NavigationLinkProps {
  href: string;
  label: string;
  icon?: ReactNode;
  badge?: number | string;
  /** Show badge as dot instead of count */
  badgeDot?: boolean;
  /** Custom active class */
  activeClass?: string;
  /** Custom inactive class */
  inactiveClass?: string;
  /** Highlight exact match only */
  exactMatch?: boolean;
  className?: string;
}

/**
 * NavigationLink: Navigation link with active state and badge support
 * 
 * Features:
 * - Auto-highlights when current page matches
 * - Notification badge (count or dot)
 * - Icon support
 * - Customizable active/inactive styling
 * 
 * @example
 * <NavigationLink
 *   href="/dashboard/orders"
 *   label="Orders"
 *   icon={<Package />}
 *   badge={5}
 * />
 */
export function NavigationLink({
  href,
  label,
  icon,
  badge,
  badgeDot = false,
  activeClass,
  inactiveClass,
  exactMatch = false,
  className,
}: NavigationLinkProps) {
  const pathname = usePathname();

  const isActive = exactMatch
    ? pathname === href
    : pathname.startsWith(href);

  const baseClass = cn(
    'relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium',
    className
  );

  const activeStyles = activeClass || cn(
    'bg-gold/10 text-gold border-l-2 border-gold',
  );

  const inactiveStyles = inactiveClass || cn(
    'text-foreground/60 hover:text-foreground hover:bg-white/5'
  );

  return (
    <Link
      href={href}
      className={cn(baseClass, isActive ? activeStyles : inactiveStyles)}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Icon */}
      {icon && <span className="flex-shrink-0">{icon}</span>}

      {/* Label */}
      <span className="flex-1">{label}</span>

      {/* Badge */}
      {badge && (
        <span
          className={cn(
            'flex-shrink-0 px-2 py-1 rounded-full text-xs font-bold',
            badgeDot
              ? 'w-2 h-2 bg-red-500 rounded-full p-0'
              : 'bg-red-500 text-white'
          )}
        >
          {!badgeDot && badge}
        </span>
      )}
    </Link>
  );
}

/**
 * NavigationMenu: Vertical navigation menu with grouped links
 * 
 * @example
 * <NavigationMenu
 *   items={[
 *     {
 *       label: 'Main',
 *       links: [
 *         { href: '/dashboard', label: 'Dashboard', icon: <Home /> },
 *         { href: '/products', label: 'Products', icon: <Package /> },
 *       ]
 *     }
 *   ]}
 * />
 */
export interface NavigationGroup {
  label?: string;
  links: NavigationLinkProps[];
}

export function NavigationMenu({
  items,
  className,
}: {
  items: NavigationGroup[];
  className?: string;
}) {
  return (
    <nav className={cn('space-y-1', className)}>
      {items.map((group, groupIdx) => (
        <div key={groupIdx}>
          {group.label && (
            <p className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground/40">
              {group.label}
            </p>
          )}
          <div className="space-y-1">
            {group.links.map((link) => (
              <NavigationLink key={link.href} {...link} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

/**
 * NotificationBadge: Standalone badge component for notifications
 */
export interface NotificationBadgeProps {
  count?: number;
  /** Show as dot */
  dot?: boolean;
  /** Badge color */
  color?: 'red' | 'orange' | 'green' | 'blue' | 'purple';
  className?: string;
}

export function NotificationBadge({
  count,
  dot = false,
  color = 'red',
  className,
}: NotificationBadgeProps) {
  const colorClasses = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    green: 'bg-emerald-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
  };

  if (dot) {
    return (
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          colorClasses[color],
          className
        )}
        aria-label={count ? `${count} notifications` : 'New notification'}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold text-white',
        colorClasses[color],
        className
      )}
      aria-label={`${count} notifications`}
    >
      {count && count > 99 ? '99+' : count}
    </span>
  );
}

/**
 * TabNavigation: Horizontal tab navigation
 */
export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

export interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function TabNavigation({
  tabs,
  activeTab,
  onChange,
  className,
}: TabNavigationProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 border-b border-white/10 overflow-x-auto',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === tab.id
              ? 'border-gold text-gold'
              : 'border-transparent text-foreground/60 hover:text-foreground'
          )}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
        >
          {tab.icon && <span>{tab.icon}</span>}
          <span>{tab.label}</span>
          {tab.badge && (
            <NotificationBadge count={tab.badge} className="ml-1" />
          )}
        </button>
      ))}
    </div>
  );
}
