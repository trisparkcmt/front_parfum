'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ConstrainedLayoutProps {
  children: ReactNode;
  /** Max width constraint (default: lg = 1024px) */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Center content horizontally */
  centered?: boolean;
  /** Add horizontal padding */
  padded?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * ConstrainedLayout: Max-width container for large screens
 * 
 * Prevents content from stretching indefinitely on ultra-wide displays.
 * Improves readability on desktop by limiting line length.
 * 
 * Max-width values:
 * - sm: 640px (40rem)
 * - md: 768px (48rem)
 * - lg: 1024px (64rem)
 * - xl: 1280px (80rem)
 * - 2xl: 1536px (96rem)
 * - full: no constraint
 * 
 * @example
 * <ConstrainedLayout maxWidth="2xl" centered padded>
 *   <YourContent />
 * </ConstrainedLayout>
 */
export function ConstrainedLayout({
  children,
  maxWidth = 'lg',
  centered = false,
  padded = true,
  className,
}: ConstrainedLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-none',
  };

  return (
    <div
      className={cn(
        'w-full',
        maxWidthClasses[maxWidth],
        centered && 'mx-auto',
        padded && 'px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * AdminPageLayout: Standard layout for admin pages with constraints
 * 
 * Features:
 * - Max-width constraint on large screens
 * - Centered content
 * - Consistent padding
 * - Header section support
 * 
 * @example
 * <AdminPageLayout title="Users">
 *   <YourContent />
 * </AdminPageLayout>
 */
export function AdminPageLayout({
  title,
  subtitle,
  children,
  actions,
  maxWidth = 'full',
  className,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}) {
  return (
    <div className="w-full space-y-6">
      {(title || subtitle || actions) && (
        <div className={cn(
          'flex items-start justify-between gap-4 flex-wrap',
          className
        )}>
          <div>
            {title && (
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-foreground/60">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3 mt-1">
              {actions}
            </div>
          )}
        </div>
      )}

      <ConstrainedLayout maxWidth={maxWidth} centered padded>
        {children}
      </ConstrainedLayout>
    </div>
  );
}

/**
 * useIsLargeScreen: Hook to detect large screen viewport
 * 
 * @example
 * const isLarge = useIsLargeScreen();
 * if (isLarge) return <DesktopView />;
 */
export function useIsLargeScreen(breakpoint: number = 1024) {
  const [isLargeScreen, setIsLargeScreen] = React.useState(false);

  React.useEffect(() => {
    // Set initial value
    setIsLargeScreen(window.innerWidth >= breakpoint);

    // Listen to window resize
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isLargeScreen;
}

/**
 * ResponsiveGrid: Grid that adapts column count based on screen size
 */
export interface ResponsiveGridProps {
  children: ReactNode;
  /** Column count on mobile (default: 1) */
  mobileColumns?: number;
  /** Column count on tablet (default: 2) */
  tabletColumns?: number;
  /** Column count on desktop (default: 3) */
  desktopColumns?: number;
  /** Gap between items (default: 4) */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Custom class name */
  className?: string;
}

export function ResponsiveGrid({
  children,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = 'md',
  className,
}: ResponsiveGridProps) {
  const gapClasses = {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  return (
    <div
      className={cn(
        'grid',
        gapClasses[gap],
        `grid-cols-${mobileColumns}`,
        `sm:grid-cols-${tabletColumns}`,
        `lg:grid-cols-${desktopColumns}`,
        className
      )}
    >
      {children}
    </div>
  );
}
