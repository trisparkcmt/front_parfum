'use client';

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
  showCloseButton?: boolean;
}

/**
 * ConfirmDialog: Accessible confirmation modal with animations
 * - Portal-based rendering (renders outside DOM hierarchy)
 * - Keyboard support (Enter=confirm, Esc=cancel)
 * - ARIA attributes for accessibility
 * - Loading state management
 * - Variant-based styling (danger, warning, info)
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'warning',
  icon,
  showCloseButton = true,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Confirm action failed:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onCancel();
    } else if (e.key === 'Enter' && !isLoading) {
      handleConfirm();
    }
  };

  const variantConfig = {
    danger: {
      bgColor: 'bg-red-500/5',
      borderColor: 'border-red-500/20',
      buttonVariant: 'danger' as const,
      textColor: 'text-red-400',
      iconColor: 'text-red-400',
    },
    warning: {
      bgColor: 'bg-amber-500/5',
      borderColor: 'border-amber-500/20',
      buttonVariant: 'primary' as const,
      textColor: 'text-amber-400',
      iconColor: 'text-amber-400',
    },
    info: {
      bgColor: 'bg-blue-500/5',
      borderColor: 'border-blue-500/20',
      buttonVariant: 'primary' as const,
      textColor: 'text-blue-400',
      iconColor: 'text-blue-400',
    },
  };

  const config = variantConfig[variant];
  const defaultIcon = !icon && variant === 'danger' ? <AlertTriangle size={24} /> : icon;

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/70 cursor-pointer"
            onClick={onCancel}
            role="presentation"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
            onKeyDown={handleKeyDown}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
          >
            <div
              className={cn(
                'w-full max-w-sm rounded-2xl border pointer-events-auto',
                'bg-background',
                config.bgColor,
                config.borderColor,
                'p-6 shadow-2xl'
              )}
              onClick={e => e.stopPropagation()}
            >
              {/* Header with icon and close button */}
              <div className="flex items-start justify-between mb-4">
                {defaultIcon && (
                  <div className={cn('shrink-0', config.iconColor)}>
                    {defaultIcon}
                  </div>
                )}
                {showCloseButton && (
                  <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="ml-auto text-foreground/40 hover:text-foreground transition-colors disabled:opacity-50"
                    aria-label="Close dialog"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Title */}
              <h2
                id="confirm-title"
                className="text-lg font-semibold text-foreground mb-2"
              >
                {title}
              </h2>

              {/* Message */}
              <p
                id="confirm-message"
                className="text-sm text-foreground/70 mb-6 leading-relaxed"
              >
                {message}
              </p>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  {cancelLabel}
                </Button>
                <Button
                  variant={config.buttonVariant}
                  size="sm"
                  onClick={handleConfirm}
                  isLoading={isLoading}
                  loadingText={confirmLabel}
                >
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
