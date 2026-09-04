'use client';

import { AlertTriangle, Wifi, RefreshCw, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface NetworkErrorProps {
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Retry callback */
  onRetry: () => void;
  /** Is retry in progress */
  isRetrying?: boolean;
  /** Custom class name */
  className?: string;
  /** Show as inline card instead of full screen */
  inline?: boolean;
}

/**
 * NetworkError: Component for network error states
 * 
 * Displays when:
 * - Network is offline
 * - API request failed
 * - Timeout occurred
 * - Server error (5xx)
 * 
 * Provides retry mechanism with exponential backoff support
 * 
 * @example
 * <NetworkError 
 *   onRetry={handleRetry}
 *   isRetrying={isLoading}
 * />
 */
export function NetworkError({
  title,
  description,
  onRetry,
  isRetrying = false,
  className,
  inline = false,
}: NetworkErrorProps) {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;

  const defaultTitle = isEn ? 'Connection Error' : 'Erreur de connexion';
  const defaultDescription = isEn 
    ? 'Failed to connect to the server. Please check your connection and try again.'
    : 'Échec de la connexion au serveur. Veuillez vérifier votre connexion et réessayer.';

  if (inline) {
    return (
      <div
        className={cn(
          'rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3',
          className
        )}
      >
        <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-red-400">{title || defaultTitle}</h3>
          <p className="text-sm text-red-400/80 mt-1">{description || defaultDescription}</p>
          <Button
            onClick={onRetry}
            isLoading={isRetrying}
            size="sm"
            className="mt-3"
            leftIcon={<RefreshCw size={14} />}
          >
            {isEn ? 'Retry' : 'Réessayer'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4',
        className
      )}
    >
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Icon with animation */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 rounded-full blur-lg opacity-50" />
              <div className="relative bg-red-100 rounded-full p-4">
                <Wifi size={32} className="text-red-600 opacity-50" />
              </div>
            </div>
          </div>

          {/* Title and description */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">{title || defaultTitle}</h1>
            <p className="text-slate-600 text-sm leading-relaxed">{description || defaultDescription}</p>
          </div>

          {/* Retry info */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 text-center">
            {isEn 
              ? 'Make sure you have an active internet connection'
              : 'Assurez-vous d\'avoir une connexion Internet active'
            }
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onRetry}
              isLoading={isRetrying}
              className="flex-1"
              leftIcon={<RefreshCw size={16} />}
            >
              {isRetrying 
                ? (isEn ? 'Retrying...' : 'Nouvelle tentative...')
                : (isEn ? 'Try Again' : 'Réessayer')
              }
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                window.location.href = '/';
              }}
              className="flex-1"
              leftIcon={<Home size={16} />}
            >
              {isEn ? 'Go Home' : 'Accueil'}
            </Button>
          </div>

          {/* Help text */}
          <p className="text-xs text-slate-500 text-center">
            {isEn 
              ? 'If the problem persists, please try again later or contact support'
              : 'Si le problème persiste, veuillez réessayer plus tard ou contacter le support'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * useRetry: Hook for exponential backoff retry logic
 * 
 * @example
 * const { retry, isRetrying, attempt } = useRetry({
 *   maxAttempts: 3,
 *   initialDelay: 1000,
 * });
 */
export function useRetry({
  maxAttempts = 3,
  initialDelay = 1000,
  backoffMultiplier = 2,
}: {
  maxAttempts?: number;
  initialDelay?: number;
  backoffMultiplier?: number;
} = {}) {
  const [attempt, setAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const retry = async (fn: () => Promise<any>) => {
    let currentAttempt = 0;

    while (currentAttempt < maxAttempts) {
      try {
        setIsRetrying(true);
        const result = await fn();
        setAttempt(0);
        setLastError(null);
        setIsRetrying(false);
        return result;
      } catch (error) {
        currentAttempt++;
        setAttempt(currentAttempt);

        if (currentAttempt >= maxAttempts) {
          setLastError(error as Error);
          setIsRetrying(false);
          throw error;
        }

        // Exponential backoff
        const delay = initialDelay * Math.pow(backoffMultiplier, currentAttempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const reset = () => {
    setAttempt(0);
    setLastError(null);
    setIsRetrying(false);
  };

  return {
    retry,
    isRetrying,
    attempt,
    maxAttempts,
    lastError,
    reset,
    canRetry: attempt < maxAttempts,
  };
}

/**
 * NetworkStatus: Hook to track online/offline status
 * 
 * @example
 * const isOnline = useNetworkStatus();
 * if (!isOnline) return <NetworkError onRetry={...} />;
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
