'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  className?: string;
  label?: string;
  href?: string;
  /** Show tooltip on hover */
  showTooltip?: boolean;
}

/**
 * BackButton: Enhanced back navigation button
 * 
 * Features:
 * - Click to go back in history
 * - Alt+← keyboard shortcut
 * - Optional redirect to href
 * - Tooltip showing keyboard shortcut
 * - Accessible with ARIA labels
 * 
 * @example
 * <BackButton label="Go Back" showTooltip={true} />
 */
export function BackButton({ 
  className, 
  label = "Retour", 
  href,
  showTooltip = true,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
      return;
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/');
  };

  // Keyboard shortcut: Alt+Left Arrow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [href]);

  return (
    <div className="group relative inline-block">
      <button
        onClick={handleBack}
        className={cn(
          "flex items-center gap-2 text-foreground/60 hover:text-gold transition-colors mb-6 rounded-lg p-2 hover:bg-gold/5",
          className
        )}
        aria-label={`${label} (Alt+← or ⌘+←)`}
        title={showTooltip ? `${label} (Alt+← or ⌘+←)` : undefined}
      >
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gold/10 group-hover:scale-110 transition-all">
          <ArrowLeft size={18} />
        </div>
        <span className="text-sm font-medium uppercase tracking-widest">{label}</span>
      </button>

      {/* Keyboard hint tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-1.5 bg-foreground text-background text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Alt + ← to go back
          <div className="absolute top-full left-3 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
        </div>
      )}
    </div>
  );
}

