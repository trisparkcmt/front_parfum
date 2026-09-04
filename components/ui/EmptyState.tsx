'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  /** Icon or illustration to display */
  icon?: ReactNode;
  /** Main heading */
  title: string;
  /** Descriptive text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    isLoading?: boolean;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Custom class name */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * EmptyState: Comprehensive empty state component
 * 
 * Displays when:
 * - No search results
 * - No data in table
 * - No items in list
 * - Deleted all items
 * 
 * @example
 * <EmptyState
 *   icon={<SearchIcon />}
 *   title="No results found"
 *   description="Try adjusting your search or filters"
 *   action={{ label: 'Clear filters', onClick: handleClear }}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'py-8 px-4',
    md: 'py-16 px-6',
    lg: 'py-24 px-8',
  };

  const iconSizes = {
    sm: 48,
    md: 64,
    lg: 96,
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeClasses[size],
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="mb-4 text-slate-400">
          {typeof icon === 'string' ? (
            <div className={cn('w-16 h-16', { 'w-12 h-12': size === 'sm', 'w-24 h-24': size === 'lg' })}>
              {icon}
            </div>
          ) : (
            <div className="scale-125 opacity-60">{icon}</div>
          )}
        </div>
      )}

      {/* Title */}
      <h3 className={cn('font-semibold text-slate-900', titleSizes[size])}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mt-2 text-slate-600 text-sm max-w-md">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="mt-6 flex gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              isLoading={action.isLoading}
              className={size === 'sm' ? 'text-sm px-4 py-2' : ''}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
              className={size === 'sm' ? 'text-sm px-4 py-2' : ''}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * NoResults: Specialized empty state for search results
 */
export function NoResults({
  searchTerm,
  onClear,
  onBack,
  className,
}: {
  searchTerm?: string;
  onClear?: () => void;
  onBack?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      title="No results found"
      description={
        searchTerm
          ? `We couldn't find anything matching "${searchTerm}". Try different keywords or filters.`
          : 'Try adjusting your search or filters'
      }
      action={
        onClear
          ? { label: 'Clear search', onClick: onClear }
          : undefined
      }
      secondaryAction={
        onBack ? { label: 'Go back', onClick: onBack } : undefined
      }
      className={className}
    />
  );
}

/**
 * NoData: Specialized empty state for empty tables/lists
 */
export function NoData({
  title = 'No data available',
  description,
  actionLabel,
  onAction,
  className,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      }
      title={title}
      description={description}
      action={
        actionLabel && onAction
          ? { label: actionLabel, onClick: onAction }
          : undefined
      }
      className={className}
    />
  );
}

/**
 * NoPermission: Specialized empty state for access denied
 */
export function NoPermission({
  onGoBack,
  className,
}: {
  onGoBack?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      }
      title="Access Denied"
      description="You don't have permission to view this content."
      secondaryAction={
        onGoBack ? { label: 'Go back', onClick: onGoBack } : undefined
      }
      className={className}
    />
  );
}

/**
 * LoadingState: Placeholder while data is loading
 */
export function LoadingState({
  title = 'Loading...',
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6',
        className
      )}
    >
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 bg-gradient-to-r from-gold/20 to-transparent rounded-full animate-spin" />
        <div className="absolute inset-2 bg-white rounded-full" />
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-2 text-slate-600 text-sm">{description}</p>
      )}
    </div>
  );
}
