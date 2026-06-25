'use client';

/**
 * @file components/shared/ToastProvider.tsx
 * @description Global Notification Rendering Engine.
 *
 * This component is responsible for rendering the floating notification stack 
 * (Toasts) managed by the `useToastStore`.
 * 
 * **Functionalities**:
 * - **Stack Management**: Dynamically renders a list of `Toast` components based on the global store state.
 * - **Animations**: Uses `AnimatePresence` and `motion` to handle smooth entry (slide-in) and exit (fade-out) for each notification.
 * - **Positioning**: Fixed to the bottom-right of the screen to ensure visibility without obstructing primary content.
 * - **Interaction**: Provides the "Close" trigger that communicates back to the store to remove specific notifications.
 * 
 * **Integration**: Wrapped at the root of the application (in `layout.tsx`) to ensure site-wide accessibility.
 */
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';

const icons = {
  success: <CheckCircle size={18} className="text-emerald-400" />,
  error: <XCircle size={18} className="text-red-400" />,
  info: <Info size={18} className="text-blue-400" />,
};

const bgColors = {
  success: 'border-emerald-500/20',
  error: 'border-red-500/20',
  info: 'border-blue-500/20',
};

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            className={`flex items-center gap-3 px-4 py-3  glass-dark border ${bgColors[toast.type]} shadow-2xl`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-cream">{toast.message}</p>
              {toast.href && (
                <Link
                  href={toast.href}
                  onClick={() => removeToast(toast.id)}
                  className="text-xs text-gold hover:underline mt-0.5 inline-block font-medium"
                >
                  {toast.hrefLabel || 'Voir le panier →'}
                </Link>
              )}
            </div>
            <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-white/10  transition-colors">
              <X size={14} className="text-cream/50" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}


