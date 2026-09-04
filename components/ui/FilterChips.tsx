'use client';

import { X } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FilterChip {
  id: string;
  label: string;
  icon?: ReactNode;
  color?: 'default' | 'gold' | 'red' | 'emerald' | 'blue';
}

export interface FilterChipsProps {
  /** Applied chips */
  chips: FilterChip[];
  /** Remove chip callback */
  onRemove: (chipId: string) => void;
  /** Clear all chips */
  onClear?: () => void;
  /** Custom class name */
  className?: string;
  /** Show clear all button */
  showClearAll?: boolean;
}

/**
 * FilterChips: Display applied filters as removable chips
 * 
 * Shows active filters with individual removal and clear-all option.
 * Useful for search + filter combinations.
 * 
 * @example
 * <FilterChips
 *   chips={activeFilters}
 *   onRemove={(id) => removeFilter(id)}
 *   onClear={() => clearAll()}
 *   showClearAll={true}
 * />
 */
export function FilterChips({
  chips,
  onRemove,
  onClear,
  className,
  showClearAll = chips.length > 1,
}: FilterChipsProps) {
  if (chips.length === 0) return null;

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'gold':
        return 'bg-gold/10 text-gold border-gold/20';
      case 'red':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'blue':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-white/5 text-foreground/80 border-white/10';
    }
  };

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {/* Clear all button */}
      {showClearAll && onClear && (
        <button
          onClick={onClear}
          className="text-xs px-2 py-1 rounded-full border border-white/10 text-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors"
          aria-label="Clear all filters"
        >
          Clear all
        </button>
      )}

      {/* Chips */}
      {chips.map((chip) => (
        <div
          key={chip.id}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border',
            'transition-colors hover:border-opacity-100',
            getColorClasses(chip.color)
          )}
        >
          {chip.icon && <span className="flex-shrink-0">{chip.icon}</span>}
          <span>{chip.label}</span>
          <button
            onClick={() => onRemove(chip.id)}
            className="ml-1 hover:opacity-70 transition-opacity flex-shrink-0"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * FilterBuilder: Component to construct and manage complex filters
 * 
 * @example
 * <FilterBuilder
 *   filters={filters}
 *   onChange={setFilters}
 *   options={{
 *     status: ['active', 'inactive', 'pending'],
 *     category: categories,
 *   }}
 * />
 */
export interface FilterConfig {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;
}

export function FilterBuilder({
  filters,
  onChange,
  options,
  className,
}: {
  filters: FilterConfig[];
  onChange: (filters: FilterConfig[]) => void;
  options: Record<string, any[]>;
  className?: string;
}) {
  const addFilter = () => {
    onChange([
      ...filters,
      { field: '', operator: 'equals', value: '' },
    ]);
  };

  const updateFilter = (index: number, filter: FilterConfig) => {
    const newFilters = [...filters];
    newFilters[index] = filter;
    onChange(newFilters);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-3', className)}>
      {filters.map((filter, index) => (
        <div key={index} className="flex gap-2 items-end">
          {/* Field selector */}
          <select
            value={filter.field}
            onChange={(e) =>
              updateFilter(index, { ...filter, field: e.target.value })
            }
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold/50"
          >
            <option value="">Select field...</option>
            {Object.keys(options).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>

          {/* Operator selector */}
          <select
            value={filter.operator}
            onChange={(e) =>
              updateFilter(index, { ...filter, operator: e.target.value as any })
            }
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold/50"
          >
            <option value="equals">Equals</option>
            <option value="contains">Contains</option>
            <option value="greater">Greater</option>
            <option value="less">Less</option>
            <option value="between">Between</option>
          </select>

          {/* Value input */}
          {filter.field && options[filter.field] ? (
            <select
              value={filter.value}
              onChange={(e) =>
                updateFilter(index, { ...filter, value: e.target.value })
              }
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold/50"
            >
              <option value="">Select value...</option>
              {options[filter.field].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={filter.value}
              onChange={(e) =>
                updateFilter(index, { ...filter, value: e.target.value })
              }
              placeholder="Enter value..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold/50"
            />
          )}

          {/* Remove button */}
          <button
            onClick={() => removeFilter(index)}
            className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
            aria-label="Remove filter"
          >
            <X size={16} />
          </button>
        </div>
      ))}

      {/* Add filter button */}
      <button
        onClick={addFilter}
        className="text-xs px-4 py-2 rounded-lg border border-white/10 text-foreground/60 hover:bg-white/5 transition-colors"
      >
        + Add filter
      </button>
    </div>
  );
}
