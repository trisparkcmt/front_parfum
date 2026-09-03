'use client';

import { ReactNode } from 'react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'minimal' | 'highlight';
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const variants = {
    default: 'py-16 px-4 text-center',
    minimal: 'py-8 px-4 text-center',
    highlight: 'py-20 px-6 text-center bg-gradient-to-br from-gold/5 to-purple-500/5 rounded-2xl border border-white/10',
  };

  return (
    <div className={cn(variants[variant], className)}>
      {icon && (
        <div className="mb-4 flex justify-center text-foreground/40 scale-125">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-foreground/60 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6 flex justify-center">
          <Button onClick={action.onClick} size="md">
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
