'use client';

/**
 * @file components/ui/Input.tsx
 * @description Standardized Text Input Field.
 *
 * This component provides a consistently styled input field for user data 
 * entry, used primarily in authentication forms and dashboard management.
 * 
 * **Features**:
 * - **Labeling**: Supports an optional `label` prop that renders a title above the input.
 * - **Error Handling**: Displays a localized `error` message in red if validation fails.
 * - **Icon Support**: Includes a `leftIcon` slot for visual context (e.g., Mail or Phone icons).
 * - **Customization**: Passthrough for standard HTML input attributes (`placeholder`, `type`, etc.).
 * 
 * **UI Styling**: Uses a semi-transparent `glass-dark` aesthetic with gold focus rings to match the platform's luxury theme.
 */
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground/80 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full  border bg-white/5 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30',
              'border-white/10 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none',
              'transition-all duration-200',
              icon && 'pl-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input };
