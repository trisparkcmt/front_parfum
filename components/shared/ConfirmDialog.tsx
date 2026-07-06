'use client';

import { motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'default',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const variantStyles = {
    default: {
      icon: 'text-blue-400 bg-blue-400/10',
      confirmBtn: 'bg-gold text-black hover:bg-gold/80',
    },
    danger: {
      icon: 'text-red-400 bg-red-400/10',
      confirmBtn: 'bg-red-500 text-white hover:bg-red-600',
    },
    warning: {
      icon: 'text-amber-400 bg-amber-400/10',
      confirmBtn: 'bg-amber-500 text-white hover:bg-amber-600',
    },
  };

  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md mx-4 bg-background rounded-2xl border border-white/10 shadow-sm p-6"
      >
        {/* Header with close button */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${styles.icon} flex items-center justify-center`}>
              <AlertCircle size={20} />
            </div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message */}
        <p className="text-foreground/70 mb-6 leading-relaxed">{message}</p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-foreground text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText || t('cancel', 'Cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-lg ${styles.confirmBtn} text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {isLoading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {confirmText || t('confirm', 'Confirm')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
