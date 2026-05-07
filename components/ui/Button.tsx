'use client';

/**
 * @file components/ui/Button.tsx
 * @description Primary Interactive Action Component.
 *
 * This is the standard button component for the entire platform, designed to 
 * provide a consistent, luxury-grade interaction experience.
 * 
 * **Key Features**:
 * - **Multiple Variants**: Supports `primary` (Gold), `secondary` (Charcoal), `outline`, `ghost`, and `danger`.
 * - **Size Options**: Includes `sm`, `md` (default), and `lg` configurations.
 * - **Dynamic States**: Implements an `isLoading` prop that renders a spinner while disabling user interaction.
 * - **Icon Integration**: Supports `leftIcon` and `rightIcon` for enhanced visual communication.
 * - **Visual Feedback**: Built with `motion.button` from `framer-motion` to provide subtle scaling animations on click/hover.
 * 
 * **Design**: Employs the brand's gold and charcoal palette with high-contrast text and smooth transitions.
 */
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold-outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-300  focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';

    const variants = {
      primary: 'bg-gold text-deep-black hover:bg-gold-light active:bg-gold-dark shadow-lg shadow-gold/20 hover:shadow-gold/40',
      secondary: 'bg-charcoal text-cream border border-white/10 hover:bg-white/10 hover:border-gold/30',
      ghost: 'bg-transparent text-foreground hover:bg-gold/10 hover:text-gold',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20',
      'gold-outline': 'bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-deep-black',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-8 py-3.5 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
export type { ButtonProps };
