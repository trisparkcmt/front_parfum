'use client';

/**
 * InlineCell — click to edit, blur/Enter to save, Escape to cancel.
 *
 * Usage:
 *   <InlineCell
 *     value={item.nom}
 *     onSave={(val) => patch(item.id, { nom: val })}
 *   />
 *
 * Props:
 *   value       — current string value
 *   onSave      — called with trimmed new value when the user commits (only when value changed)
 *   display     — optional custom React node shown in read mode (falls back to `value`)
 *   inputType   — 'text' | 'number' (default 'text')
 *   className   — extra classes for the read-mode span
 *   inputClass  — extra classes for the active input
 *   disabled    — prevent editing
 */

import React, { useState, useEffect, useRef } from 'react';
import { Edit2 } from 'lucide-react';

interface InlineCellProps {
  value: string;
  onSave: (newValue: string) => void;
  display?: React.ReactNode;
  inputType?: 'text' | 'number';
  className?: string;
  inputClass?: string;
  disabled?: boolean;
}

export function InlineCell({
  value,
  onSave,
  display,
  inputType = 'text',
  className = '',
  inputClass = '',
  disabled = false,
}: InlineCellProps) {
  const [active, setActive] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const originalRef = useRef(value);

  // Sync draft when external value changes (e.g. after optimistic rollback)
  useEffect(() => {
    if (!active) setDraft(value);
  }, [value, active]);

  const activate = () => {
    if (disabled) return;
    originalRef.current = value;
    setDraft(value);
    setActive(true);
  };

  useEffect(() => {
    if (active) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [active]);

  const commit = () => {
    setActive(false);
    const trimmed = draft.trim();
    if (trimmed !== '' && trimmed !== originalRef.current) {
      onSave(trimmed);
    }
  };

  const cancel = () => {
    setActive(false);
    setDraft(value);
  };

  if (active) {
    return (
      <input
        ref={inputRef}
        type={inputType}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); inputRef.current?.blur(); }
          if (e.key === 'Escape') { e.preventDefault(); cancel(); }
        }}
        className={`min-w-0 w-full rounded border border-gold/50 bg-white/[0.06] px-2 py-1 text-xs text-foreground outline-none ring-1 ring-gold/30 ${inputClass}`}
        // Stop row-level click handlers from firing while editing
        onClick={e => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      onClick={e => { e.stopPropagation(); activate(); }}
      title={disabled ? undefined : 'Cliquer pour modifier'}
      className={`group inline-flex items-center gap-1.5 cursor-text rounded px-1 -mx-1 py-0.5 transition-colors ${disabled ? 'cursor-default' : 'hover:bg-white/[0.06] hover:ring-1 hover:ring-white/10'} ${className}`}
    >
      {display ?? value}
      {!disabled && (
        <Edit2
          size={10}
          className="opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0"
        />
      )}
    </span>
  );
}
