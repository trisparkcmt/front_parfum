'use client';

import { forwardRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string; // REQUIRED: always display on top
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, type, onFocus, onBlur, onChange, placeholder, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Track active value state
    const currentValue = props.value !== undefined ? props.value : props.defaultValue;

    useEffect(() => {
      setHasValue(currentValue !== undefined && currentValue !== null && String(currentValue).length > 0);
    }, [currentValue]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(e.target.value.length > 0);
      if (onBlur) onBlur(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      if (onChange) onChange(e);
    };

    const finalType = type === 'password' && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        <label htmlFor={id} className="block text-sm font-medium text-foreground/70 mb-1">
          {label}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 z-10 pointer-events-none">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            id={id}
            type={finalType}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder={placeholder || ''}
            className={cn(
              'w-full border bg-white/5 text-sm text-foreground placeholder:text-foreground/40 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none transition-all duration-200',
              'py-2.5 px-4',
              icon && 'pl-10',
              type === 'password' && 'pr-10',
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10',
              className
            )}
            {...props}
          />


          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-gold transition-colors z-10"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input };

// ─── FloatInput ─────────────────────────────────────────────────────────────
// Standalone floating-label input for admin modal forms (no react-hook-form).
// Supports: floating label, password eye toggle, error display, icons.

interface FloatInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const FloatInput = forwardRef<HTMLInputElement, FloatInputProps>(
  ({ label, error, icon, type, className, onFocus, onBlur, onChange, value, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(() =>
      value !== undefined && value !== null && String(value).length > 0
    );
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
      setHasValue(value !== undefined && value !== null && String(value).length > 0);
    }, [value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(e.target.value.length > 0);
      onBlur?.(e);
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      onChange?.(e);
    };

    const isFloating = isFocused || hasValue;
    const finalType = type === 'password' && showPassword ? 'text' : type;
    const inputPlaceholder = ' ';

    return (
      <div className="w-full">
        <div className="relative mt-2">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 z-10 pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            type={finalType}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder={inputPlaceholder}
            className={cn(
              'w-full border bg-white/5 text-sm text-foreground focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none transition-all duration-200 rounded-xl pt-5 pb-1.5 px-4',
              icon && 'pl-10',
              type === 'password' && 'pr-10',
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10',
              className
            )}
            {...props}
          />

          <label
            className={cn(
              'absolute transition-all duration-200 pointer-events-none origin-left',
              icon ? 'left-10' : 'left-4',
              isFloating
                ? 'top-1 text-[9px] font-bold text-gold uppercase tracking-wider scale-90'
                : 'top-1/2 -translate-y-1/2 text-sm text-foreground/30'
            )}
          >
            {label}
          </label>

          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-gold transition-colors z-10"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

FloatInput.displayName = 'FloatInput';
