'use client';

import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormErrorProps {
  /** Error message or field-level errors object */
  errors?: string | Record<string, string | string[]>;
  /** Dismiss callback */
  onDismiss?: () => void;
  /** Custom class name */
  className?: string;
  /** Show as inline field error (smaller) instead of banner */
  inline?: boolean;
  /** Error severity level */
  severity?: 'error' | 'warning';
}

/**
 * FormError: Standardized error display component
 * 
 * Handles:
 * - Single error message string
 * - Field-level errors object (displays first error or all)
 * - Array of field errors
 * - Dismissible banner or inline display
 * - Consistent styling across forms
 * 
 * @example
 * <FormError errors={formErrors} onDismiss={() => setErrors({})} />
 * 
 * @example
 * <FormError 
 *   errors={{ email: 'Invalid email', password: ['Too short'] }} 
 *   inline={true}
 * />
 */
export function FormError({
  errors,
  onDismiss,
  className,
  inline = false,
  severity = 'error',
}: FormErrorProps) {
  if (!errors) return null;

  // Convert errors to array of messages
  let messages: string[] = [];

  if (typeof errors === 'string') {
    messages = [errors];
  } else if (typeof errors === 'object') {
    // Extract first error from each field
    Object.values(errors).forEach((error) => {
      if (typeof error === 'string') {
        messages.push(error);
      } else if (Array.isArray(error) && error.length > 0) {
        messages.push(error[0]);
      }
    });
  }

  if (messages.length === 0) return null;

  const firstError = messages[0];

  // Inline field error (small, no dismiss)
  if (inline) {
    return (
      <div
        className={cn(
          'flex items-start gap-2 mt-1 p-2 rounded bg-red-500/10 border border-red-500/20',
          className
        )}
        role="alert"
      >
        <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
        <p className="text-xs text-red-400">{firstError}</p>
      </div>
    );
  }

  // Banner error (dismissible)
  const bgColor = severity === 'error' ? 'bg-red-500/10' : 'bg-amber-500/10';
  const borderColor = severity === 'error' ? 'border-red-500/20' : 'border-amber-500/20';
  const textColor = severity === 'error' ? 'text-red-400' : 'text-amber-400';
  const iconColor = severity === 'error' ? 'text-red-400' : 'text-amber-400';

  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex items-start gap-3',
        bgColor,
        borderColor,
        className
      )}
      role="alert"
    >
      <AlertCircle size={20} className={cn('shrink-0 mt-0.5', iconColor)} />
      <div className="flex-1">
        <p className={cn('text-sm font-medium', textColor)}>
          {severity === 'error' ? 'Error' : 'Warning'}
        </p>
        <p className={cn('mt-1 text-sm', textColor)}>
          {firstError}
        </p>
        {messages.length > 1 && (
          <ul className={cn('mt-2 text-xs space-y-1', textColor)}>
            {messages.slice(1).map((msg, i) => (
              <li key={i}>• {msg}</li>
            ))}
          </ul>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={cn('shrink-0 hover:opacity-70 transition-opacity', textColor)}
          aria-label="Dismiss error"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}

/**
 * FieldError: Inline field-level error display
 * Wrapper around FormError with inline={true}
 */
export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="mt-1.5 text-xs text-red-400 flex items-start gap-1.5">
      <AlertCircle size={12} className="shrink-0 mt-0.5" />
      {error}
    </p>
  );
}
