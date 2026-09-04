'use client';

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

/**
 * TableSortHeader: Sortable column header
 * 
 * Shows sort direction indicator and handles click to toggle sort.
 * 
 * @example
 * <TableSortHeader
 *   label="Name"
 *   sortKey="name"
 *   currentSort={sort}
 *   onSort={handleSort}
 * />
 */
export interface TableSortHeaderProps {
  label: string | ReactNode;
  sortKey: string;
  currentSort: SortState;
  onSort: (key: string, direction: SortDirection) => void;
  className?: string;
  sortable?: boolean;
}

export function TableSortHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  className,
  sortable = true,
}: TableSortHeaderProps) {
  if (!sortable) {
    return <th className={cn('px-4 py-3', className)}>{label}</th>;
  }

  const isActive = currentSort.column === sortKey;
  const nextDirection = 
    !isActive ? 'asc' 
    : currentSort.direction === 'asc' ? 'desc' 
    : null;

  const handleClick = () => {
    onSort(sortKey, nextDirection);
  };

  return (
    <th
      className={cn(
        'px-4 py-3 cursor-pointer select-none hover:bg-white/[0.03] transition-colors',
        className
      )}
      onClick={handleClick}
      role="columnheader"
      aria-sort={
        isActive
          ? currentSort.direction === 'asc'
            ? 'ascending'
            : 'descending'
          : 'none'
      }
    >
      <div className="flex items-center gap-2 hover:text-foreground transition-colors">
        <span className={isActive ? 'text-gold' : 'text-foreground/60'}>
          {label}
        </span>
        {isActive && (
          currentSort.direction === 'asc' ? (
            <ChevronUp size={14} className="text-gold" />
          ) : (
            <ChevronDown size={14} className="text-gold" />
          )
        )}
      </div>
    </th>
  );
}

/**
 * useSortTable: Hook for managing table sort state
 * 
 * @example
 * const { sort, handleSort, sortedItems } = useSortTable(items, 'name');
 */
export function useSortTable<T extends Record<string, any>>(
  items: T[],
  initialSortKey?: string,
  initialDirection: SortDirection = 'asc'
) {
  const [sort, setSort] = React.useState<SortState>({
    column: initialSortKey || null,
    direction: initialDirection,
  });

  const sortedItems = React.useMemo(() => {
    if (!sort.column || !sort.direction) return items;

    return [...items].sort((a, b) => {
      const aVal = a[sort.column!];
      const bVal = b[sort.column!];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sort.direction === 'asc' ? 1 : -1;
      if (bVal == null) return sort.direction === 'asc' ? -1 : 1;

      // String comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal);
        return sort.direction === 'asc' ? comparison : -comparison;
      }

      // Number comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        const comparison = aVal - bVal;
        return sort.direction === 'asc' ? comparison : -comparison;
      }

      // Date comparison
      if (aVal instanceof Date && bVal instanceof Date) {
        const comparison = aVal.getTime() - bVal.getTime();
        return sort.direction === 'asc' ? comparison : -comparison;
      }

      // Fallback
      return 0;
    });
  }, [items, sort]);

  const handleSort = (column: string, direction: SortDirection) => {
    setSort({ column, direction });
  };

  const resetSort = () => {
    setSort({ column: null, direction: null });
  };

  return {
    sort,
    sortedItems,
    handleSort,
    resetSort,
  };
}
