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
import {
  buttonVariants,
  liquidbuttonVariants,
  LiquidButton,
  GlassFilter,
  MetalButton,
  colorVariants,
  metalButtonVariants,
  Slot,
  type VariantProps,
} from './LiquidButton';

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'danger'
    | 'gold-outline'
    | 'default'
    | 'destructive'
    | 'cool'
    | 'outline'
    | 'link';
  size?: 'sm' | 'md' | 'lg' | 'default' | 'icon';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';

    const variants: Record<string, string> = {
      primary: 'bg-gold text-deep-black hover:bg-gold-light active:bg-gold-dark shadow-lg shadow-gold/20 hover:shadow-gold/40',
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-[var(--t-surface-raised)] text-foreground border border-[var(--t-border)] hover:bg-[var(--t-hover-bg)] hover:border-gold/30',
      ghost: 'bg-transparent text-foreground hover:bg-gold/10 hover:text-gold',
      danger: 'bg-red-600 text-foreground hover:bg-red-700 shadow-lg shadow-red-600/20',
      destructive: 'bg-destructive text-primary-foreground hover:bg-destructive/90',
      'gold-outline': 'bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-deep-black',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      cool: 'dark:inset-shadow-2xs dark:inset-shadow-white/10 bg-linear-to-t border border-b-2 border-zinc-950/40 from-primary to-primary/85 shadow-md shadow-primary/20 ring-1 ring-inset ring-white/25 transition-[filter] duration-200 hover:brightness-110 active:brightness-90 dark:border-x-0 text-primary-foreground dark:text-primary-foreground dark:border-t-0 dark:border-primary/50 dark:ring-white/5',
      link: 'text-primary underline-offset-4 hover:underline',
    };

    const sizes: Record<string, string> = {
      sm: 'px-3 py-1.5 text-sm gap-1.5 h-8 rounded-md',
      md: 'px-5 py-2.5 text-sm gap-2 h-9',
      default: 'h-9 px-4 py-2',
      lg: 'px-8 py-3.5 text-base gap-2.5 h-10 rounded-md',
      icon: 'h-9 w-9 p-0',
    };

    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(baseStyles, variants[variant] || variants.primary, sizes[size] || sizes.md, className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-label="Loading"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
export {
  Button,
  buttonVariants,
  liquidbuttonVariants,
  LiquidButton,
  GlassFilter,
  MetalButton,
  colorVariants,
  metalButtonVariants,
};
export type { ButtonProps };



