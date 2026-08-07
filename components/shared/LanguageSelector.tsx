'use client';

import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/useThemeStore';

const languages = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keep desktop controls white in light mode while preserving mobile theme-aware colors.
  const theme = useThemeStore((s) => s.theme);
  const iconColor = cn(
    theme === 'dark' ? 'text-white' : 'text-black',
    'lg:text-white'
  );

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const toggleLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-2 hover:bg-foreground/5 rounded-lg transition-colors group"
      >
        <Globe size={18} className={cn(iconColor, 'group-hover:text-gold transition-colors')} />
        <span className={cn('text-xs font-medium uppercase group-hover:text-gold transition-colors', iconColor)}>
          {currentLanguage.code}
        </span>
        <ChevronDown
          size={12}
          className={cn(
            iconColor,
            'transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            // Opens to the left on desktop (right-0) and to the right on mobile (left-0)
            className="absolute left-0 md:left-auto md:right-0 mt-2 w-40 bg-[var(--t-surface)] backdrop-blur-xl border border-[var(--t-border)] rounded-xl shadow-lg z-50 overflow-hidden"
          >
            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => toggleLanguage(lang.code)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors",
                    i18n.language === lang.code
                      ? "text-gold bg-gold/10"
                      : "text-foreground/70 hover:text-gold hover:bg-foreground/5"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span>{lang.flag}</span>
                    {lang.label}
                  </span>
                  {i18n.language === lang.code && (
                    <div className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
