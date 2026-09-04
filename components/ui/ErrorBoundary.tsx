'use client';

import { ReactNode, Component, ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

// Note: Can't use hooks in class components, so we'll pass language via context or use a wrapper
// For simplicity, we'll detect language from document.documentElement.lang or localStorage

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary: React error boundary for graceful error handling
 * 
 * Catches React component errors and displays a fallback UI
 * instead of crashing the entire app.
 * 
 * @example
 * <ErrorBoundary 
 *   onError={(error, info) => console.log(error, info)}
 *   resetKeys={[userId]}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught:', error);
      console.error('Error info:', errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;

    // Reset on prop change
    if (resetOnPropsChange && prevProps !== this.props) {
      this.resetError();
      return;
    }

    // Reset on resetKeys change
    if (resetKeys) {
      const prevKeys = prevProps.resetKeys;
      if (prevKeys && resetKeys.length === prevKeys.length) {
        const keysChanged = resetKeys.some((key, i) => key !== prevKeys[i]);
        if (keysChanged) {
          this.resetError();
        }
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <ErrorFallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onReset={this.resetError}
          />
        )
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

/**
 * ErrorFallback: Default error UI for ErrorBoundary
 */
export function ErrorFallback({
  error,
  errorInfo,
  onReset,
}: ErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === 'development';
  
  // Detect language - check localStorage or document lang
  const getLanguage = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('i18nextLng');
      return stored?.startsWith('en') ?? false;
    }
    return true; // default to English
  };
  
  const isEn = getLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="bg-red-100 rounded-full p-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              {isEn ? 'Something went wrong' : 'Une erreur est survenue'}
            </h1>
            <p className="mt-2 text-slate-600 text-sm">
              {isEn 
                ? 'An unexpected error occurred. Please try again.'
                : 'Une erreur inattendue est survenue. Veuillez réessayer.'
              }
            </p>
          </div>

          {/* Error Details (Dev Only) */}
          {isDev && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
              <p className="text-xs font-mono text-red-700 font-semibold">
                {error.message}
              </p>
              {errorInfo?.componentStack && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-red-600 hover:text-red-700 font-medium">
                    {isEn ? 'Stack trace' : 'Trace de pile'}
                  </summary>
                  <pre className="mt-2 text-red-700 overflow-auto max-h-40 whitespace-pre-wrap break-words text-[10px] bg-red-100 p-2 rounded">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onReset}
              className="flex-1"
              leftIcon={<RotateCcw size={16} />}
            >
              {isEn ? 'Try again' : 'Réessayer'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                try {
                  window.history.back();
                } catch (e) {
                  window.location.href = '/';
                }
              }}
              className="flex-1"
            >
              {isEn ? 'Go back' : 'Retour'}
            </Button>
          </div>

          {/* Help text */}
          <p className="text-xs text-slate-500 text-center">
            {isEn ? (
              <>
                If the problem persists, please contact support or{' '}
                <button
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  className="text-gold hover:underline font-medium"
                >
                  return home
                </button>
              </>
            ) : (
              <>
                Si le problème persiste, veuillez contacter le support ou{' '}
                <button
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  className="text-gold hover:underline font-medium"
                >
                  retourner à l'accueil
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
