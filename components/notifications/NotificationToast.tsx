/**
 * @file components/notifications/NotificationToast.tsx
 * @description Toast notification component for FCM foreground messages
 * 
 * Displays notifications with:
 * - Custom styling with TailwindCSS
 * - Auto-dismiss timer
 * - Click action handling
 * - Smooth animations
 */

'use client';

import React, { useEffect, useState } from 'react';
import { X, Bell, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { formatNotificationPayload } from '@/services/fcmService';
import type { FCMPayload } from '@/services/fcmService';

export type NotificationType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface NotificationToastProps {
  payload: FCMPayload;
  onClose?: () => void;
  autoDismissMs?: number;
  onClick?: () => void;
}

/**
 * Map notification types to icons and colors
 */
const getNotificationStyle = (type: NotificationType) => {
  const styles = {
    default: {
      bg: 'bg-slate-900',
      border: 'border-slate-700',
      icon: Bell,
      iconColor: 'text-slate-400',
    },
    success: {
      bg: 'bg-emerald-900',
      border: 'border-emerald-700',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
    },
    error: {
      bg: 'bg-red-900',
      border: 'border-red-700',
      icon: AlertCircle,
      iconColor: 'text-red-400',
    },
    warning: {
      bg: 'bg-amber-900',
      border: 'border-amber-700',
      icon: AlertCircle,
      iconColor: 'text-amber-400',
    },
    info: {
      bg: 'bg-blue-900',
      border: 'border-blue-700',
      icon: Info,
      iconColor: 'text-blue-400',
    },
  };

  return styles[type] || styles.default;
};

/**
 * NotificationToast Component
 * 
 * Displays a styled toast for FCM notifications with animations
 * Auto-dismisses after configurable delay
 */
export const NotificationToast: React.FC<NotificationToastProps> = ({
  payload,
  onClose,
  autoDismissMs = 6000,
  onClick,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const formatted = formatNotificationPayload(payload);
  
  // Determine notification type from title or default to info
  let notificationType: NotificationType = 'default';
  if (formatted.title?.toLowerCase().includes('success')) notificationType = 'success';
  else if (formatted.title?.toLowerCase().includes('error')) notificationType = 'error';
  else if (formatted.title?.toLowerCase().includes('warning')) notificationType = 'warning';
  else notificationType = 'info';

  const style = getNotificationStyle(notificationType);
  const IconComponent = style.icon;

  // Auto-dismiss timer
  useEffect(() => {
    if (autoDismissMs <= 0) return;

    const timer = setTimeout(() => {
      handleClose();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleClick = () => {
    onClick?.();
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed bottom-6 right-6 max-w-sm
        ${style.bg} border ${style.border}
        rounded-lg shadow-lg
        backdrop-blur-sm
        transform transition-all duration-300
        animate-in slide-in-from-right-full
        hover:shadow-xl
        overflow-hidden
        group
        cursor-pointer
        z-50
      `}
      onClick={handleClick}
      role="alert"
      aria-live="assertive"
    >
      {/* Background gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Content container */}
      <div className="relative px-6 py-4 flex gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 flex items-start pt-0.5">
          <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          {formatted.title && (
            <h3 className="text-sm font-semibold text-white truncate">
              {formatted.title}
            </h3>
          )}

          {/* Body */}
          {formatted.body && (
            <p className="text-sm text-white/80 mt-1 line-clamp-2">
              {formatted.body}
            </p>
          )}

          {/* Data attributes if present */}
          {formatted.data && Object.keys(formatted.data).length > 0 && (
            <div className="text-xs text-white/60 mt-2 space-y-1">
              {Object.entries(formatted.data).map(([key, value]) => (
                <div key={key}>
                  <span className="font-mono">{key}</span>: {String(value).substring(0, 30)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="flex-shrink-0 text-white/40 hover:text-white transition-colors ml-2"
          aria-label="Close notification"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className={`
          absolute bottom-0 left-0 right-0 h-1 bg-gold
          transform-gpu transition-all
        `}
        style={{
          animation: `progress ${autoDismissMs}ms linear forwards`,
        }}
      />

      <style>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        @keyframes slide-in-from-right-full {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
