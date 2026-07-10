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
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-[330px]">
      <AnimatePresence>
        {toasts.map((toast) => {
          const theme = toastThemes[toast.type] || toastThemes.info;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              className={`relative flex items-center gap-[15px] px-[15px] py-[12px] min-h-[80px] rounded-lg overflow-hidden glass-dark border ${theme.borderColor} shadow-sm select-none`}
            >
              {/* Decorative Redesigned Wave Graphic */}
              <svg 
                className={`absolute w-[80px] rotate-90 -left-[31px] top-[32px] pointer-events-none ${theme.waveColor}`}
                viewBox="0 0 1440 320" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M0,256L11.4,240C22.9,224,46,192,69,192C91.4,192,114,224,137,234.7C160,245,183,235,206,213.3C228.6,192,251,160,274,149.3C297.1,139,320,149,343,181.3C365.7,213,389,267,411,282.7C434.3,299,457,277,480,250.7C502.9,224,526,192,549,181.3C571.4,171,594,181,617,208C640,235,663,277,686,256C708.6,235,731,149,754,122.7C777.1,96,800,128,823,165.3C845.7,203,869,245,891,224C914.3,203,937,117,960,112C982.9,107,1006,181,1029,197.3C1051.4,213,1074,171,1097,144C1120,117,1143,107,1166,133.3C1188.6,160,1211,224,1234,218.7C1257.1,213,1280,139,1303,133.3C1325.7,128,1349,192,1371,192C1394.3,192,1417,128,1429,96L1440,64L1440,320L1428.6,320C1417.1,320,1394,320,1371,320C1348.6,320,1326,320,1303,320C1280,320,1257,320,1234,320C1211.4,320,1189,320,1166,320C1142.9,320,1120,320,1097,320C1074.3,320,1051,320,1029,320C1005.7,320,983,320,960,320C937.1,320,914,320,891,320C868.6,320,846,320,823,320C800,320,777,320,754,320C731.4,320,709,320,686,320C662.9,320,640,320,617,320C594.3,320,571,320,549,320C525.7,320,503,320,480,320C457.1,320,434,320,411,320C388.6,320,366,320,343,320C320,320,297,320,274,320C251.4,320,229,320,206,320C182.9,320,160,320,137,320C114.3,320,91,320,69,320C45.7,320,23,320,11,320L0,320Z" />
              </svg>

              {/* Icon Circular Enclosure */}
              <div className={`ml-2 w-[35px] h-[35px] flex items-center justify-center rounded-full shrink-0 ${theme.iconBg}`}>
                {theme.icon}
              </div>

              {/* Text Layout Block */}
              <div className="flex-1 flex flex-col justify-center min-w-0 z-10">
                <p className={`text-[17px] font-bold leading-tight ${theme.titleColor}`}>
                  {toast.type.charAt(0).toUpperCase() + toast.type.slice(1)} Note
                </p>
                <p className="text-[14px] text-cream/80 leading-snug break-words">
                  {toast.message}
                </p>
                
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

              {/* Dismiss Button */}
              <button 
                onClick={() => removeToast(toast.id)} 
                className="p-1 hover:bg-white/10 rounded transition-colors z-10 cursor-pointer"
                aria-label="Close notification"
              >
                <X size={18} className="text-cream/50 hover:text-cream transition-colors" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
