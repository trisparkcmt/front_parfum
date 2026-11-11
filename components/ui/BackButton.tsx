'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  label,
  href,
  showTooltip = true,
}: BackButtonProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage || i18n.language)?.startsWith('en');
  const buttonLabel = label ?? t('go_back', { defaultValue: isEn ? 'Back' : 'Retour' });
  const shortcutHint = isEn ? '(Alt+← or ⌘+←)' : '(Alt+← ou ⌘+←)';
  const tooltipHint = isEn ? 'Alt + ← to go back' : 'Alt + ← pour revenir en arrière';

  const handleBack = () => {
    if (href) {
      router.push(href);
      return;
    }

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('from_product_detail', 'true');
      } catch {}

      if (window.history.length > 1) {
        router.back();
        return;
      }

      const savedCatalog = sessionStorage.getItem('last_shop_catalog_url');
      if (savedCatalog) {
        router.push(savedCatalog);
        return;
      }
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
        aria-label={`${buttonLabel} ${shortcutHint}`}
        title={showTooltip ? `${buttonLabel} ${shortcutHint}` : undefined}
      >
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gold/10 group-hover:scale-110 transition-all">
          <ArrowLeft size={18} />
        </div>
        <span className="text-sm font-medium uppercase tracking-widest">{buttonLabel}</span>
      </button>

      {/* Keyboard hint tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-1.5 bg-foreground text-background text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {tooltipHint}
          <div className="absolute top-full left-3 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
        </div>
      )}
    </div>
  );
}

