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
    <div className="fixed inset-x-0 bottom-4 z-[100] flex justify-center px-3 pointer-events-none">
      <div className="w-full max-w-md flex flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map((toast) => {
            const theme = toastThemes[toast.type] || toastThemes.info;
            const title = toast.type === 'success' ? 'Succès' : toast.type === 'error' ? 'Erreur' : 'Info';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                className={`pointer-events-auto w-full rounded-2xl border ${theme.borderColor} bg-background/95 px-3 py-2.5 shadow-[0_16px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${theme.iconBg}`}>
                    {theme.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold ${theme.titleColor}`}>{title}</p>
                      <button
                        onClick={() => removeToast(toast.id)}
                        className="rounded-full p-1 text-foreground/40 transition-colors hover:bg-white/10 hover:text-foreground"
                        aria-label="Fermer la notification"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="mt-0.5 text-sm leading-snug text-foreground/80">{toast.message}</p>
                    {toast.href && (
                      <Link
                        href={toast.href}
                        onClick={() => removeToast(toast.id)}
                        className="mt-1 inline-flex text-xs font-semibold text-gold hover:underline"
                      >
                        {toast.hrefLabel || 'Voir plus'}
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
