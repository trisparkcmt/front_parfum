'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';

export type SortOrder = 'asc' | 'desc' | null;

export interface TableSortHeaderProps {
  label: string;
  sortKey: string;
  currentSort?: string;
  currentOrder?: SortOrder;
  onSort: (key: string, order: SortOrder) => void;
  className?: string;
  sortable?: boolean;
}

/**
 * TableSortHeader: Clickable table column header with sort indicators
 * - Shows current sort order (asc/desc/none)
 * - Cycles through: unsorted → asc → desc → unsorted
 * - Keyboard accessible (Enter/Space to sort)
 * - Visual feedback with arrows
 */
export function TableSortHeader({
  label,
  sortKey,
  currentSort,
  currentOrder,
  onSort,
  className = '',
  sortable = true,
}: TableSortHeaderProps) {
  const isActive = currentSort === sortKey;
  
  const handleClick = () => {
    if (!sortable) return;
    
    // Cycle: null -> asc -> desc -> null
    let nextOrder: SortOrder;
    if (isActive) {
      if (currentOrder === 'asc') {
        nextOrder = 'desc';
      } else if (currentOrder === 'desc') {
        nextOrder = null;
      } else {
        nextOrder = 'asc';
      }
    } else {
      nextOrder = 'asc';
    }
    
    onSort(sortKey, nextOrder);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!sortable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={!sortable}
      className={[
        'flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider',
        'transition-colors outline-none focus:ring-2 focus:ring-gold/50 rounded px-1',
        sortable
          ? 'cursor-pointer hover:text-foreground text-foreground/50'
          : 'cursor-default text-foreground/35 opacity-50',
        isActive ? 'text-foreground' : '',
        className,
      ].join(' ')}
      title={sortable ? `Sort by ${label}` : undefined}
      aria-sort={
        isActive
          ? currentOrder === 'asc'
            ? 'ascending'
            : 'descending'
          : 'none'
      }
    >
      {label}
      {sortable && (
        <span className="flex items-center gap-0.5">
          {isActive && currentOrder === 'asc' && (
            <ChevronUp size={14} className="text-gold" />
          )}
          {isActive && currentOrder === 'desc' && (
            <ChevronDown size={14} className="text-gold" />
          )}
          {!isActive && (
            <div className="opacity-20 group-hover:opacity-40 flex flex-col -gap-1.5">
              <ChevronUp size={12} />
              <ChevronDown size={12} />
            </div>
          )}
        </span>
      )}
    </button>
  );
}
