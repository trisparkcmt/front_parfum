'use client';

import React from 'react';
import { X, Trash2, Eye, EyeOff } from 'lucide-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface BulkAction {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'danger' | 'warning';
  onClick: (selectedIds: string[]) => void | Promise<void>;
  isLoading?: boolean;
}

export interface TableBulkActionsProps {
  /** Selected row IDs */
  selectedIds: string[];
  /** Total row count for context */
  totalCount?: number;
  /** Clear selection callback */
  onClear: () => void;
  /** Available actions */
  actions: BulkAction[];
  className?: string;
}

/**
 * TableBulkActions: Toolbar showing selected items and bulk action buttons
 * 
 * Appears when rows are selected. Shows count and available actions.
 * 
 * @example
 * <TableBulkActions
 *   selectedIds={selected}
 *   onClear={() => setSelected([])}
 *   actions={[
 *     {
 *       id: 'delete',
 *       label: 'Delete',
 *       variant: 'danger',
 *       icon: <Trash2 />,
 *       onClick: (ids) => handleDelete(ids),
 *     }
 *   ]}
 * />
 */
export function TableBulkActions({
  selectedIds,
  totalCount,
  onClear,
  actions,
  className,
}: TableBulkActionsProps) {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;

  if (selectedIds.length === 0) return null;

  const getActionVariant = (variant?: string) => {
    switch (variant) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-white';
      default:
        return 'bg-gold hover:bg-gold/90 text-black';
    }
  };

  return (
    <div
      className={cn(
        'sticky bottom-0 z-40 bg-gradient-to-r from-foreground to-foreground/95 text-white px-6 py-4 flex items-center gap-4 justify-between rounded-t-lg shadow-lg',
        className
      )}
    >
      {/* Selection info */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">
          {selectedIds.length === 1
            ? isEn ? `1 item selected` : `1 élément sélectionné`
            : isEn 
              ? `${selectedIds.length} items selected`
              : `${selectedIds.length} éléments sélectionnés`
          }
        </span>
        {totalCount && selectedIds.length === totalCount && (
          <span className="text-xs opacity-75">{isEn ? '(All)' : '(Tous)'}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => action.onClick(selectedIds)}
            disabled={action.isLoading}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50',
              getActionVariant(action.variant)
            )}
          >
            {action.icon && <span>{action.icon}</span>}
            <span>{action.label}</span>
          </button>
        ))}

        {/* Clear selection */}
        <button
          onClick={onClear}
          className="ml-2 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          aria-label={isEn ? 'Clear selection' : 'Effacer la sélection'}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

/**
 * useTableSelection: Hook for managing row selection
 * 
 * @example
 * const { selected, isAllSelected, toggle, toggleAll, clear } = useTableSelection(items);
 */
export function useTableSelection<T extends { id: string | number }>(
  items: T[]
) {
  const [selectedIds, setSelectedIds] = React.useState<(string | number)[]>([]);

  const isAllSelected = selectedIds.length === items.length && items.length > 0;
  const isPartiallySelected = selectedIds.length > 0 && !isAllSelected;

  const toggle = (id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((item) => item.id));
    }
  };

  const clear = () => {
    setSelectedIds([]);
  };

  const isSelected = (id: string | number) => selectedIds.includes(id);

  return {
    selectedIds,
    isAllSelected,
    isPartiallySelected,
    toggle,
    toggleAll,
    clear,
    isSelected,
  };
}

/**
 * TableSelectCheckbox: Checkbox for row selection
 */
export function TableSelectCheckbox({
  checked,
  indeterminate = false,
  onChange,
  className,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate;
      }}
      onChange={(e) => onChange(e.target.checked)}
      className={cn(
        'rounded border-white/20 bg-white/5 text-gold focus:ring-gold cursor-pointer',
        className
      )}
    />
  );
}
