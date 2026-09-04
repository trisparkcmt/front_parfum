'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ResponsiveTableProps {
  /** Table columns for responsive headers */
  columns: {
    key: string;
    label: string;
    mobileHidden?: boolean;
    className?: string;
  }[];
  /** Table rows */
  children: ReactNode;
  /** Custom class name */
  className?: string;
  /** Show row borders */
  bordered?: boolean;
  /** Enable horizontal scroll on mobile */
  scrollable?: boolean;
}

/**
 * ResponsiveTable: Mobile-friendly table wrapper
 * 
 * Features:
 * - Stack to card layout on mobile (< 768px)
 * - Horizontal scroll fallback option
 * - Hide non-critical columns on mobile
 * - Touch-friendly spacing
 * 
 * @example
 * <ResponsiveTable
 *   columns={[
 *     { key: 'name', label: 'Name' },
 *     { key: 'email', label: 'Email', mobileHidden: true },
 *   ]}
 *   scrollable={true}
 * >
 *   {rows.map(row => <tr key={row.id}>...</tr>)}
 * </ResponsiveTable>
 */
export function ResponsiveTable({
  columns,
  children,
  className,
  bordered = true,
  scrollable = true,
}: ResponsiveTableProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden',
        scrollable && 'overflow-x-auto',
        className
      )}
    >
      {/* Desktop: Normal table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3',
                    col.mobileHidden && 'hidden md:table-cell',
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn(
            'divide-y divide-white/5 text-xs',
            bordered && 'border-t border-white/10'
          )}>
            {children}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card layout */}
      <div className="sm:hidden">
        <div className="divide-y divide-white/5">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * ResponsiveTableRow: Row component that adapts to mobile
 * 
 * On mobile: Renders as a card with field labels above values
 * On desktop: Renders as a normal table row
 */
export interface ResponsiveTableRowProps {
  /** Row data cells (one per column) */
  children: ReactNode[];
  /** Column definitions for mobile labels */
  columns?: {
    key: string;
    label: string;
    mobileHidden?: boolean;
  }[];
  /** Custom class name */
  className?: string;
  /** Additional mobile card styling */
  mobileCardClassName?: string;
}

export function ResponsiveTableRow({
  children,
  columns,
  className,
  mobileCardClassName,
}: ResponsiveTableRowProps) {
  return (
    <>
      {/* Desktop: Normal row */}
      <tr className={cn('hover:bg-white/[0.02] transition-colors', className)}>
        {children}
      </tr>

      {/* Mobile: Card view */}
      <tr className="sm:hidden">
        <td colSpan={100} className="p-0">
          <div className={cn(
            'px-4 py-4 space-y-3 hover:bg-white/[0.02] transition-colors',
            mobileCardClassName
          )}>
            {children && columns && children.map((cell, idx) => {
              const col = columns[idx];
              if (col?.mobileHidden) return null;
              
              return (
                <div key={col?.key || idx} className="flex items-start justify-between gap-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 flex-shrink-0">
                    {col?.label}
                  </span>
                  <div className="text-xs text-foreground/60 text-right flex-1">
                    {cell}
                  </div>
                </div>
              );
            })}
          </div>
        </td>
      </tr>
    </>
  );
}

/**
 * MobileTableCell: Cell that hides on mobile if needed
 */
export function MobileTableCell({
  children,
  hideOnMobile = false,
  className,
}: {
  children: ReactNode;
  hideOnMobile?: boolean;
  className?: string;
}) {
  return (
    <td className={cn(
      'px-4 py-3',
      hideOnMobile && 'hidden md:table-cell',
      className
    )}>
      {children}
    </td>
  );
}

/**
 * useIsMobile: Hook to detect mobile viewport
 * 
 * @example
 * const isMobile = useIsMobile();
 * if (isMobile) return <MobileView />;
 */
export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    // Set initial value
    setIsMobile(window.innerWidth < breakpoint);

    // Listen to window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}
