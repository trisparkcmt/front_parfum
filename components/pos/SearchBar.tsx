'use client';

import { Search, X } from 'lucide-react';
import { useCallback } from 'react';

interface SearchBarProps {
  value?: string;
  onChange?: (term: string) => void;
  onSearch?: (term: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function SearchBar({ 
  value = '', 
  onChange, 
  onSearch, 
  placeholder = 'Rechercher un produit...', 
  isLoading = false 
}: SearchBarProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    if (onChange) {
      onChange(term);
    }
    if (onSearch) {
      onSearch(term);
    }
  }, [onChange, onSearch]);

  const handleClear = useCallback(() => {
    if (onChange) {
      onChange('');
    }
    if (onSearch) {
      onSearch('');
    }
  }, [onChange, onSearch]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full pl-10 pr-10 py-3 rounded-lg border border-white/10 bg-white/5 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-gold/50 focus:bg-white/10 transition-all disabled:opacity-50"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-gold transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
