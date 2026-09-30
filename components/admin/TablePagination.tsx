'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  /** Label for the item type, e.g. "parfums", "accessoires" */
  itemLabel?: string;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = 'éléments',
}: TablePaginationProps) {
  const [jumpModeIndex, setJumpModeIndex] = useState<number | null>(null);
  const [jumpValue, setJumpValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  // Build a compact page range: always show first, last, current ± 1
  const pages: (number | '...')[] = [];
  const range = new Set<number>();
  range.add(1);
  range.add(totalPages);
  for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
    range.add(i);
  }
  const sorted = Array.from(range).sort((a, b) => a - b);
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) pages.push('...');
    pages.push(p);
  });

  useEffect(() => {
    if (jumpModeIndex !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [jumpModeIndex]);

  const handleJumpSubmit = () => {
    const pageNum = parseInt(jumpValue, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    }
    setJumpModeIndex(null);
    setJumpValue('');
  };

  const handleJumpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJumpSubmit();
    } else if (e.key === 'Escape') {
      setJumpModeIndex(null);
      setJumpValue('');
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-xs text-foreground/40">
      <span>
        {start}–{end} sur {totalItems} {itemLabel}
      </span>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Page précédente"
          >
            <ChevronLeft size={13} />
          </button>

          {pages.map((p, i) =>
            p === '...' ? (
              jumpModeIndex === i ? (
                <input
                  key={`ellipsis-input-${i}`}
                  ref={inputRef}
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpValue}
                  onChange={(e) => setJumpValue(e.target.value)}
                  onBlur={handleJumpSubmit}
                  onKeyDown={handleJumpKeyDown}
                  className="w-10 h-7 rounded-md border border-white/10 bg-white/5 px-1.5 text-center text-[11px] text-foreground outline-none focus:border-gold/50"
                  placeholder="..."
                />
              ) : (
                <button
                  key={`ellipsis-${i}`}
                  onClick={() => setJumpModeIndex(i)}
                  className="px-1.5 py-1 text-foreground/50 hover:text-foreground transition-colors outline-none"
                  title="Aller à une page spécifique"
                >
                  …
                </button>
              )
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`min-w-[28px] h-7 rounded-md px-1.5 text-[11px] font-medium transition-colors ${
                  p === currentPage
                    ? 'bg-gold/15 text-gold ring-1 ring-gold/30'
                    : 'hover:bg-white/8 text-foreground/50 hover:text-foreground'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Page suivante"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
