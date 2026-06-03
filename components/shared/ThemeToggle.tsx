'use client';

/**
 * @file components/shared/ThemeToggle.tsx
 * @description Premium Theme Mode Toggle for Desktop & Mobile.
 *
 * Renders a Sun/Moon icon button that switches between the dark and light theme.
 * Uses the `useThemeStore` for state management.
 */
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme, initTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initTheme();
    setMounted(true);
  }, [initTheme]);

  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative p-2 rounded-full transition-all duration-300 group",
        theme === 'dark'
          ? 'hover:bg-white/5'
          : 'hover:bg-black/5',
        className
      )}
      aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
    >
      {theme === 'dark' ? (
        <Sun size={20} className="text-cream/70 group-hover:text-gold transition-colors" />
      ) : (
        <Moon size={20} className="text-onyx/70 group-hover:text-gold transition-colors" />
      )}
    </button>
  );
}


