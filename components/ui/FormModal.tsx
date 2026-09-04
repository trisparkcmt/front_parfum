'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  className?: string;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
}

/**
 * FormModal: Full-screen height form overlay that docks to the right.
 * Perfect for admin dashboards and data-entry flows.
 * Constrains to max screen height to prevent scrolling out of view.
 * 
 * Features:
 * - Framer Motion animations (fade + slide)
 * - Focus trap (Tab/Shift+Tab cycles within modal)
 * - Keyboard navigation (Escape to close)
 * - ARIA labels for accessibility
 * - Scroll lock on body while open
 */
export function FormModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'xl',
  className,
  showCloseButton = true,
  footer,
}: FormModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useFocusTrap(isOpen, onClose);
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;

  // Handle scroll lock and focus management
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (isOpen) {
      // Lock scroll
      document.body.style.overflow = 'hidden';
      if (mainEl) mainEl.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = '';
        if (mainEl) mainEl.style.overflow = '';
      };
    }
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
    '3xl': 'max-w-6xl',
    full: 'w-full',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay - takes full viewport */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-40 bg-black/70 pointer-events-auto"
            onClick={onClose}
            role="presentation"
            aria-hidden="true"
          />
          
          {/* Modal - positioned above overlay */}
          <div
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 flex items-start justify-end pointer-events-none"
            onClick={onClose}
            role="presentation"
            aria-hidden="true"
          >
            <motion.div
              ref={focusTrapRef}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'relative flex h-screen max-h-screen w-full flex-col pointer-events-auto',
                'border-l border-white/10 bg-background',
                sizes[size],
                className
              )}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
              aria-describedby={subtitle ? 'modal-subtitle' : undefined}
            >
              {/* Sticky Header */}
              {(title || showCloseButton) && (
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-background px-6 py-4">
                  {title && (
                    <div className="min-w-0">
                      <h3 
                        id="modal-title"
                        className="truncate text-[15px] font-semibold text-foreground"
                      >
                        {title}
                      </h3>
                      {subtitle && (
                        <p 
                          id="modal-subtitle"
                          className="mt-0.5 text-xs text-foreground/40"
                        >
                          {subtitle}
                        </p>
                      )}
                    </div>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="ml-auto shrink-0 rounded-md p-1.5 text-foreground/40 transition-colors hover:bg-white/8 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                      aria-label={isEn ? 'Close dialog' : 'Fermer la boîte de dialogue'}
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}

              {/* Scrollable Content */}
              <div className="flex flex-1 flex-col overflow-y-hidden">
                <div className="flex-1 overflow-y-auto">
                  <div className="px-6 py-6">{children}</div>
                </div>
                {footer ? (
                  <div className="border-t border-white/10 bg-background px-6 py-4">{footer}</div>
                ) : null}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}