'use client';

/**
 * @file components/shared/ToastProvider.tsx
 * @description Global Notification Rendering Engine.
 */
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';

// Dynamic theme configuration based on your original design tokens
const toastThemes = {
  success: {
    icon: <CheckCircle size={17} className="text-emerald-400" />,
    iconBg: 'bg-emerald-500/20',
    waveColor: 'fill-emerald-500/10',
    titleColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20'
  },
  error: {
    icon: <XCircle size={17} className="text-red-400" />,
    iconBg: 'bg-red-500/20',
    waveColor: 'fill-red-500/10',
    titleColor: 'text-red-400',
    borderColor: 'border-red-500/20'
  },
  info: {
    icon: <Info size={17} className="text-blue-400" />,
    iconBg: 'bg-blue-500/20',
    waveColor: 'fill-blue-500/10',
    titleColor: 'text-blue-400',
    borderColor: 'border-blue-500/20'
  }
};

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-1.5 sm:gap-2">
        <AnimatePresence>
          {toasts.map((toast) => {
            const theme = toastThemes[toast.type] || toastThemes.info;
            const title = toast.type === 'success' ? 'Succès' : toast.type === 'error' ? 'Erreur' : 'Info';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`pointer-events-auto rounded-lg sm:rounded-xl border ${theme.borderColor} bg-background/95 px-3 py-2 sm:px-4 sm:py-2.5 shadow-[0_16px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl flex items-center gap-2`}
              >
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${theme.iconBg}`}>
                  {theme.icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs sm:text-sm font-semibold leading-tight ${theme.titleColor}`}>{toast.message}</p>
                  {toast.href && (
                    <Link
                      href={toast.href}
                      onClick={() => removeToast(toast.id)}
                      className="mt-0.5 inline-flex text-[10px] sm:text-xs font-semibold text-gold hover:underline"
                    >
                      {toast.hrefLabel || 'Voir plus'}
                    </Link>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="ml-2 rounded-full p-0.5 text-foreground/40 transition-colors hover:bg-white/10 hover:text-foreground flex-shrink-0"
                  aria-label="Fermer la notification"
                >
                  <X size={12} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
