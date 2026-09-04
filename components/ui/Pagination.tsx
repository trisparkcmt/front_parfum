'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
  disabled?: boolean;
  showInfo?: boolean;
  className?: string;
}

/**
 * Pagination: Enhanced pagination with jump controls
 * - First/previous/next/last page buttons
 * - Page number display with keyboard support
 * - Info text showing current range and total items
 * - Disabled state management
 * - Accessibility: ARIA labels and keyboard navigation
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  totalItems,
  disabled = false,
  showInfo = true,
  className = '',
}: PaginationProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = parseInt((e.target as HTMLInputElement).value);
      if (value > 0 && value <= totalPages) {
        onPageChange(value);
      }
      (e.target as HTMLInputElement).value = String(currentPage);
    }
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || currentPage * itemsPerPage);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-4',
        'text-xs text-foreground/60',
        className
      )}
      role="navigation"
      aria-label="Pagination navigation"
    >
      {/* Info section */}
      {showInfo && totalItems !== undefined && (
        <div className="text-xs text-foreground/50">
          Showing <span className="font-medium text-foreground">{startItem}</span> to{' '}
          <span className="font-medium text-foreground">{endItem}</span> of{' '}
          <span className="font-medium text-foreground">{totalItems}</span> results
        </div>
      )}

      {/* Controls section */}
      <div className="flex items-center gap-1.5">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={disabled || !canGoPrevious}
          className="p-1.5 rounded hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="First page"
          aria-label="Go to first page"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || !canGoPrevious}
          className="p-1.5 rounded hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
          aria-label="Go to previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page input */}
        <div className="flex items-center gap-2 px-2">
          <input
            type="number"
            min="1"
            max={totalPages}
            defaultValue={currentPage}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="w-12 bg-white/5 border border-white/10 rounded px-2 py-1 text-center text-xs text-foreground outline-none focus:border-gold/50 disabled:opacity-50"
            aria-label="Page number"
          />
          <span className="text-foreground/50">of {totalPages}</span>
        </div>

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || !canGoNext}
          className="p-1.5 rounded hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next page"
          aria-label="Go to next page"
        >
          <ChevronRight size={16} />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={disabled || !canGoNext}
          className="p-1.5 rounded hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Last page"
          aria-label="Go to last page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
