'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** Extra className applied to the trigger button */
  className?: string;
  /** Whether the field has a validation error */
  error?: boolean;
  /** data-field for focus-on-error */
  'data-field'?: string;
  disabled?: boolean;
  /** compact = smaller padding, used in filter bars */
  size?: 'sm' | 'md';
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner…',
  className = '',
  error = false,
  'data-field': dataField,
  disabled = false,
  size = 'md',
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const selectedLabel = options.find(o => o.value === value)?.label ?? '';
  const padding = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-2.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div ref={ref} className="relative" data-field={dataField}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className={[
          'w-full bg-white/5 border rounded-xl flex items-center justify-between gap-2 text-left outline-none transition-colors',
          'hover:border-white/20 focus:border-gold/50',
          error ? 'border-red-500/50' : 'border-white/10',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          padding,
          textSize,
          className,
        ].join(' ')}
      >
        <span className={value ? 'text-foreground' : 'text-foreground/40'}>
          {selectedLabel || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-foreground/40 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[9999] bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="max-h-52 overflow-y-auto">
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10',
                    value === opt.value ? 'text-gold bg-gold/10' : 'text-foreground',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
