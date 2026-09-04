'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Show home icon */
  showHome?: boolean;
  /** Custom class name */
  className?: string;
  /** Show separator icons */
  showSeparators?: boolean;
}

/**
 * Breadcrumb: Navigation breadcrumbs for page hierarchy
 * 
 * Shows current page location and enables quick navigation up the hierarchy.
 * 
 * @example
 * <Breadcrumb
 *   items={[
 *     { label: 'Admin', href: '/dashboard/admin' },
 *     { label: 'Perfumes', href: '/dashboard/admin/perfume' },
 *     { label: 'Edit', href: '#' },
 *   ]}
 * />
 */
export function Breadcrumb({
  items,
  showHome = true,
  className,
  showSeparators = true,
}: BreadcrumbProps) {
  return (
    <nav
      className={cn('flex items-center gap-1', className)}
      aria-label="Breadcrumb"
    >
      {/* Home icon */}
      {showHome && (
        <>
          <Link
            href="/dashboard/admin"
            className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-white/5 transition-colors"
            aria-label="Home"
          >
            <Home size={16} />
          </Link>
          {showSeparators && items.length > 0 && (
            <ChevronRight size={14} className="text-foreground/20" />
          )}
        </>
      )}

      {/* Breadcrumb items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-1">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-xs font-medium text-foreground/60 hover:text-foreground transition-colors flex items-center gap-1"
              >
                {item.icon && (
                  <span className="text-foreground/40">{item.icon}</span>
                )}
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'text-xs font-medium flex items-center gap-1',
                  isLast
                    ? 'text-foreground'
                    : 'text-foreground/60'
                )}
              >
                {item.icon && (
                  <span className="text-foreground/40">{item.icon}</span>
                )}
                {item.label}
              </span>
            )}

            {showSeparators && !isLast && (
              <ChevronRight size={14} className="text-foreground/20" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
