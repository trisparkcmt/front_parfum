'use client';

import { ReactNode, cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/utils';

/**
 * Icon Size System: Standardized icon sizes for consistency
 * 
 * Sizes:
 * - xs: 12px (for badges, very small indicators)
 * - sm: 16px (for inputs, form elements)
 * - md: 20px (default, buttons, nav items)
 * - lg: 24px (large buttons, headers)
 * - xl: 32px (hero sections, prominent icons)
 * - 2xl: 40px (page hero, large displays)
 * - 3xl: 48px (banners, very large)
 */

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
};

const sizeClass: Record<IconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
  '3xl': 'w-12 h-12',
};

export interface IconProps {
  /** Icon component from lucide-react */
  icon: ReactNode;
  /** Size preset */
  size?: IconSize;
  /** Custom width in pixels */
  width?: number;
  /** Custom height in pixels */
  height?: number;
  /** Icon color/variant */
  variant?: 'default' | 'muted' | 'inverted' | 'success' | 'warning' | 'danger';
  /** Custom class name */
  className?: string;
}

/**
 * Icon: Wrapper for standardized icon sizing and styling
 * 
 * @example
 * <Icon icon={<Package />} size="lg" variant="danger" />
 */
export function Icon({
  icon,
  size = 'md',
  width,
  height,
  variant = 'default',
  className,
}: IconProps) {
  const variantClasses = {
    default: 'text-foreground',
    muted: 'text-foreground/50',
    inverted: 'text-background',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-red-500',
  };

  const px = width ?? sizeMap[size];
  const py = height ?? sizeMap[size];

  if (!isValidElement(icon)) return null;

  return cloneElement(icon as any, {
    size: px,
    className: cn(sizeClass[size], variantClasses[variant], className),
  });
}

/**
 * IconButton: Button styled as icon with hover effects
 */
export interface IconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  size?: IconSize;
  variant?: 'default' | 'ghost' | 'subtle' | 'danger' | 'success';
  disabled?: boolean;
  tooltip?: string;
  ariaLabel?: string;
  className?: string;
}

export function IconButton({
  icon,
  onClick,
  size = 'md',
  variant = 'default',
  disabled = false,
  tooltip,
  ariaLabel,
  className,
}: IconButtonProps) {
  const variantClasses = {
    default: 'hover:bg-white/10 text-foreground',
    ghost: 'hover:text-foreground text-foreground/60',
    subtle: 'hover:bg-gold/10 text-gold',
    danger: 'hover:bg-red-500/10 text-red-500',
    success: 'hover:bg-emerald-500/10 text-emerald-500',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      aria-label={ariaLabel}
      className={cn(
        'p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        'inline-flex items-center justify-center',
        variantClasses[variant],
        className
      )}
    >
      <Icon icon={icon} size={size} />
    </button>
  );
}

/**
 * IconWithLabel: Icon with accompanying text
 */
export interface IconWithLabelProps {
  icon: ReactNode;
  label: string;
  size?: IconSize;
  variant?: 'default' | 'muted' | 'success' | 'warning' | 'danger';
  direction?: 'row' | 'column';
  className?: string;
}

export function IconWithLabel({
  icon,
  label,
  size = 'md',
  variant = 'default',
  direction = 'row',
  className,
}: IconWithLabelProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2',
        direction === 'column' && 'flex-col text-center',
        className
      )}
    >
      <Icon icon={icon} size={size} variant={variant} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

/**
 * Icon Grid Component: Display multiple icons with labels
 */
export interface IconGridItem {
  icon: ReactNode;
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function IconGrid({
  items,
  size = 'lg',
  columns = 3,
}: {
  items: IconGridItem[];
  size?: IconSize;
  columns?: number;
}) {
  return (
    <div
      className={cn(
        'grid gap-4 mb-4',
        `grid-cols-${columns}`,
        'sm:grid-cols-3',
        'lg:grid-cols-4'
      )}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center p-4 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors"
        >
          <Icon icon={item.icon} size={size} variant={item.variant} />
          <p className="mt-3 text-xs font-medium text-center">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Get icon size in pixels
 */
export function getIconSize(size: IconSize): number {
  return sizeMap[size];
}
