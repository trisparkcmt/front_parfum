'use client';

import { cn } from '@/lib/utils';

export interface ModalLoadingSpinnerProps {
  /** Loading message */
  message?: string;
  /** Spinner size in pixels */
  size?: number;
  /** Custom class name */
  className?: string;
}

/**
 * ModalLoadingSpinner: Loading indicator for modals
 * 
 * Displays centered spinner with optional message.
 * Used during form submission, data loading, etc.
 * 
 * @example
 * <ModalLoadingSpinner message="Saving..." />
 */
export function ModalLoadingSpinner({
  message,
  size = 40,
  className,
}: ModalLoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8 gap-3',
        className
      )}
    >
      {/* Spinner */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer ring */}
        <svg
          className="absolute inset-0 animate-spin text-gold/20"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
        </svg>

        {/* Inner animated ring */}
        <svg
          className="absolute inset-0 animate-spin text-gold"
          fill="none"
          viewBox="0 0 24 24"
          style={{ animationDirection: 'reverse', animationDuration: '1s' }}
        >
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>

      {/* Message */}
      {message && (
        <p className="text-sm text-foreground/60 font-medium text-center max-w-xs">
          {message}
        </p>
      )}
    </div>
  );
}
