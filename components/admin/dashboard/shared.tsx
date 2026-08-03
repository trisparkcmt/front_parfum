'use client';

import type { ButtonHTMLAttributes, ElementType, ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { SlideOver } from '@/components/ui/SlideOver';

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

type DashboardStatusTone = 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'gold' | 'neutral';

interface DashboardStatusTagProps {
  label: string;
  tone?: DashboardStatusTone;
  dot?: boolean;
}

export function DashboardStatusTag({ label, tone = 'neutral', dot = true }: DashboardStatusTagProps) {
  const styles: Record<DashboardStatusTone, { bg: string; text: string; ring: string; dot: string }> = {
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      ring: 'ring-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      ring: 'ring-blue-500/20',
      dot: 'bg-blue-400',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      ring: 'ring-amber-500/20',
      dot: 'bg-amber-400',
    },
    red: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      ring: 'ring-red-500/20',
      dot: 'bg-red-400',
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      ring: 'ring-purple-500/20',
      dot: 'bg-purple-400',
    },
    gold: {
      bg: 'bg-gold/10',
      text: 'text-gold',
      ring: 'ring-gold/20',
      dot: 'bg-gold',
    },
    neutral: {
      bg: 'bg-white/5',
      text: 'text-foreground/60',
      ring: 'ring-white/10',
      dot: 'bg-foreground/40',
    },
  };

  const style = styles[tone] || styles.neutral;

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        style.bg,
        style.text,
        style.ring
      )}
    >
      {dot && <span className={cx('h-1.5 w-1.5 rounded-full', style.dot)} />}
      {label}
    </span>
  );
}

interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function DashboardPageHeader({ title, description, actions }: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-foreground/40">{description}</p>}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

interface DashboardKpiItem {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
  bg?: string;
}

interface DashboardKpiStripProps {
  items: DashboardKpiItem[];
  className?: string;
}

export function DashboardKpiStrip({ items, className }: DashboardKpiStripProps) {
  return (
    <div className={cx('grid grid-cols-2 gap-3 rounded-xl sm:flex sm:divide-x sm:divide-white/8 sm:border sm:border-white/10 sm:bg-white/[0.03]', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-1 sm:rounded-none sm:border-none sm:bg-transparent sm:px-5 sm:py-4"
        >
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
            {item.icon ? <span className={cx(item.color)}>{item.icon}</span> : null}
            {item.label}
          </p>
          <p className="text-xl font-semibold tabular-nums text-foreground">{String(item.value)}</p>
        </div>
      ))}
    </div>
  );
}

interface DashboardSearchBarProps extends Omit<ButtonHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DashboardSearchBar({ value, onChange, placeholder = 'Rechercher…', className, ...props }: DashboardSearchBarProps) {
  return (
    <div className={cx('flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 sm:max-w-sm', className)}>
      <Search size={14} className="shrink-0 text-foreground/35" />
      <input
        {...props}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
      />
    </div>
  );
}

interface DashboardIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ElementType;
  variant?: 'gold' | 'red' | 'blue' | 'neutral';
  adminOnly?: boolean;
  showAdminActions?: boolean;
}

export function DashboardIconButton({
  icon: Icon,
  variant = 'neutral',
  adminOnly = false,
  showAdminActions = true,
  className,
  ...props
}: DashboardIconButtonProps) {
  if (adminOnly && !showAdminActions) return null;

  const variants = {
    gold: 'text-foreground/45 hover:bg-gold/10 hover:text-gold',
    red: 'text-foreground/45 hover:bg-red-500/10 hover:text-red-400',
    blue: 'text-foreground/45 hover:bg-blue-500/10 hover:text-blue-400',
    neutral: 'text-foreground/45 hover:bg-white/5 hover:text-foreground',
  } as const;

  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      className={cx('rounded-md p-1.5 transition-colors focus:outline-none', variants[variant], className)}
    >
      <Icon size={14} />
    </button>
  );
}

interface DashboardActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'emerald' | 'red' | 'blue' | 'purple' | 'neutral';
  adminOnly?: boolean;
  showAdminActions?: boolean;
  icon?: ElementType;
}

export function DashboardActionButton({
  tone = 'neutral',
  adminOnly = false,
  showAdminActions = true,
  icon: Icon,
  children,
  className,
  ...props
}: DashboardActionButtonProps) {
  if (adminOnly && !showAdminActions) return null;

  const tones = {
    emerald: 'bg-emerald-500/90 hover:bg-emerald-500 text-black',
    red: 'bg-red-500/90 hover:bg-red-500 text-white',
    blue: 'bg-blue-500/90 hover:bg-blue-500 text-white',
    purple: 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 ring-1 ring-inset ring-purple-500/25',
    neutral: 'bg-white/8 hover:bg-white/14 text-foreground/80',
  } as const;

  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      className={cx('inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors', tones[tone], className)}
    >
      {Icon ? <Icon size={12} /> : null}
      {children}
    </button>
  );
}

interface DashboardSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  className?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function DashboardSlideOver({ isOpen, onClose, title, description, size = 'xl', className, children, footer }: DashboardSlideOverProps) {
  if (!isOpen) return null;

  const sizeMap: Record<NonNullable<DashboardSlideOverProps['size']>, 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'> = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl',
    '2xl': '2xl',
    '3xl': '3xl',
    full: 'full',
  };

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={sizeMap[size]}
      className={className}
      footer={footer}
    >
      {children}
    </SlideOver>
  );
}

interface DashboardTableRowProps {
  children: ReactNode;
  className?: string;
}

export function DashboardTableRow({ children, className }: DashboardTableRowProps) {
  return <tr className={cx('transition-colors hover:bg-white/[0.02]', className)}>{children}</tr>;
}

export function DashboardTableHeaderCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cx('px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/35', className)}>
      {children}
    </th>
  );
}

export function DashboardTableCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cx('px-4 py-3', className)}>{children}</td>;
}

export function DashboardToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('flex flex-col gap-3 sm:flex-row sm:items-center', className)}>{children}</div>;
}

export function DashboardPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('overflow-hidden rounded-xl border border-white/10', className)}>{children}</div>;
}
