'use client';

import { useEffect } from 'react';
/**
 * @file components/ui/Modal.tsx
 * @description Centralized Overlay & Dialog System.
 *
 * This component provides a specialized container for displaying content in a 
 * focused, modal overlay. It is primarily used for the Numba save-to-profile flow 
 * and other transactional confirmations.
 * 
 * **Functionalities**:
 * - **Animated Entry**: Uses `AnimatePresence` and `motion.div` for a smooth scale-up effect upon opening.
 * - **Backdrop Blur**: Implements a darkened, blurred background to focus user attention on the dialog.
 * - **Accessibility**: Includes a dedicated "Close" action and handles outside-click dismissal.
 * - **Responsive Constraints**: Adapts its width for mobile vs. desktop viewports.
 * 
 * **UI Implementation**: Features a semi-transparent glass aesthetic with deep-black backgrounds and gold iconography.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'relative w-full  bg-cream dark:bg-charcoal border border-white/10 shadow-sm',
              sizes[size],
              className
            )}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h3 className="font-display text-lg font-semibold">{title}</h3>
                <button onClick={onClose} className="p-1  hover:bg-white/10 transition-colors">
                  <X size={20} />
                </button>
              </div>
            )}
            {!title && (
              <button onClick={onClose} className="absolute top-4 right-4 p-1  hover:bg-white/10 transition-colors z-10">
                <X size={20} />
              </button>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


