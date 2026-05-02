'use client';

import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';

interface BadgeProps {
  variant?: 'default' | 'gold' | 'pending' | 'validated' | 'delivering' | 'delivered' | 'cancelled';
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: 'bg-foreground/10 text-foreground/70',
  gold: 'bg-gold/15 text-gold border border-gold/20',
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  validated: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  delivering: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  delivered: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  cancelled: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variantStyles[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const labels: Record<OrderStatus, string> = {
    pending: 'En attente',
    validated: 'Validée',
    delivering: 'En livraison',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  };
  return <Badge variant={status}>{labels[status]}</Badge>;
}
