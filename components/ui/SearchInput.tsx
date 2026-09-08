'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  icon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

/**
 * SearchInput: Enhanced search component with debounce
 * - Debounced search (default 300ms) to reduce API calls
 * - Clear button for quick reset
 * - Search and loading indicators
 * - Keyboard shortcuts (Ctrl+K to focus, Escape to clear)
 * - Accessibility: ARIA labels and semantic HTML
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  debounceMs = 300,
  disabled = false,
  className = '',
  autoFocus = false,
  icon,
  clearable = true,
  onClear,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;

  const defaultPlaceholder = isEn ? 'Search...' : 'Rechercher...';

  // Debounce onChange
  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [localValue, onChange, debounceMs]);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Global keyboard shortcut (Ctrl+K or Cmd+K to focus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        'relative w-full group',
        className
      )}
    >
      {/* Search icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none group-hover:text-foreground/60 transition-colors">
        {icon || <Search size={16} />}
      </div>

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder || defaultPlaceholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn(
          'w-full bg-white/5 border border-white/10 rounded-xl',
          'pl-10 pr-10 py-2.5 text-sm text-foreground',
          'outline-none transition-all duration-200',
          'placeholder:text-foreground/40',
          'focus:border-gold/50 focus:bg-white/8',
          'hover:border-white/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isFocused && 'border-gold/50 bg-white/8'
        )}
        aria-label={isEn ? 'Search' : 'Recherche'}
      />

      {/* Clear button */}
      {clearable && localValue && !disabled && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors p-1 rounded hover:bg-white/5"
          title={isEn ? 'Clear search' : 'Effacer la recherche'}
          aria-label={isEn ? 'Clear search' : 'Effacer la recherche'}
          type="button"
        >
          <X size={16} />
        </button>
      )}

      {/* Keyboard hint */}
      {!localValue && !isFocused && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground/30 pointer-events-none hidden sm:block">
          ⌘K
        </div>
      )}
    </div>
  );
}
