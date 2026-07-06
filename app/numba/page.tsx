'use client';

/**
 * @file app/numba/page.tsx
 * @description Numba Atelier Entry Point & Concept Introduction.
 * Modern Editorial Layout with radical block isolation on mobile viewports.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function NumbaLanding() {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydration Guard: Prevents server/client translation mismatches
  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-gold selection:text-deep-black flex flex-col justify-between">
      
      {/* Top Brand Banner */}
      <div className="w-full border-b border-[var(--t-border)] px-4 sm:px-12 py-4 flex justify-between items-center text-[10px] tracking-[0.3em] font-mono uppercase text-foreground/40">
        <div>[ {t('olfactory_atelier')} ]</div>
        <div>Numba Lab System v2.6</div>
      </div>

      {/* 
        Main Layout Wrapper: 
        On Mobile: Creates a padded container with visible vertical spacing (gap-6) between blocks.
        On Desktop (lg): Flattens out into a rigid, gap-less grid bounded by crisp lines.
      */}
      <main className="p-4 sm:p-6 lg:p-0 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-0 w-full max-w-[1800px] mx-auto flex-grow items-stretch lg:border-b lg:border-[var(--t-border)]">
        
        {/* Column 1: The Manifest (Left Anchor) */}
        <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-between rounded-2xl lg:rounded-none border border-[var(--t-border)] lg:border-t-0 lg:border-b-0 lg:border-l-0 lg:border-r bg-foreground/[0.03]">
          <div>
            <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-gold block mb-12">
              Concept Introduction
            </span>
            <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-8">
              {t('welcome_at')}<br />
              <span className="text-gradient-gold font-normal italic font-serif lowercase">numba.</span>
            </h1>
          </div>

          <div className="mt-12 lg:mt-0">
            <p className="text-sm sm:text-base text-foreground/70 font-light leading-relaxed max-w-md">
              {t('numba_desc')}
            </p>
          </div>
        </div>

        {/* Column 2: Guided Entry Path (Methodology A) */}
        <Link 
          href="/numba/ai-consultant" 
          className="group block relative p-8 sm:p-12 lg:p-16 flex flex-col justify-between rounded-2xl lg:rounded-none border-2 border-gold/40 lg:border lg:border-t-0 lg:border-b-0 lg:border-l-0 lg:border-r bg-foreground/[0.01] hover:bg-gold/5 transition-all duration-500 shadow-sm shadow-gold/[0.02] lg:shadow-none"
        >
          {/* Mobile-Only Badge for absolute separation clarity */}
          <div className="lg:hidden absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gold text-deep-black text-[9px] font-mono tracking-widest uppercase px-3 py-0.5 rounded-full font-bold">
            Option A
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-16">
              <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-foreground/40 group-hover:text-gold transition-colors">
                Methodology A
              </span>
              <span className="text-xs font-mono text-gold font-bold bg-gold/10 px-2 py-0.5 rounded lg:bg-transparent lg:p-0">
                [ Guided ]
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6">
              {t('ai_sommelier')}
            </h2>
            <p className="text-foreground/60 text-sm font-light leading-relaxed max-w-sm">
              {t('ai_sommelier_desc')}
            </p>
          </div>

          <div className="mt-16 pt-6 border-t border-[var(--t-border)] flex items-center justify-between text-xs font-mono tracking-[0.2em] uppercase text-gold">
            <span className="font-bold">{t('consult_ai')}</span>
            <span className="transform group-hover:translate-x-2 transition-transform duration-300">→</span>
          </div>
        </Link>

        {/* Column 3: Direct Entry Path (Methodology B) */}
        <Link 
          href="/numba/atelier" 
          className="group block relative p-8 sm:p-12 lg:p-16 flex flex-col justify-between rounded-2xl lg:rounded-none border border-[var(--t-border)] lg:border-none bg-foreground/[0.03] lg:bg-transparent hover:bg-foreground/5 transition-all duration-500"
        >
          {/* Mobile-Only Badge for absolute separation clarity */}
          <div className="lg:hidden absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-neutral-800 text-neutral-400 text-[9px] font-mono tracking-widest uppercase px-3 py-0.5 rounded-full border border-[var(--t-border)]">
            Option B
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-16">
              <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-foreground/40 group-hover:text-foreground transition-colors">
                Methodology B
              </span>
              <span className="text-xs font-mono text-foreground/50 bg-foreground/10 px-2 py-0.5 rounded lg:bg-transparent lg:p-0">
                [ Autonomous ]
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6">
              {t('free_creation')}
            </h2>
            <p className="text-foreground/60 text-sm font-light leading-relaxed max-w-sm">
              {t('free_creation_desc')}
            </p>
          </div>

          <div className="mt-16 pt-6 border-t border-[var(--t-border)] flex items-center justify-between text-xs font-mono tracking-[0.2em] uppercase text-foreground">
            <span className="font-bold">{t('open_atelier')}</span>
            <span className="transform group-hover:translate-x-2 transition-transform duration-300">→</span>
          </div>
        </Link>

      </main>

      {/* Minimal Structural Footer */}
      <footer className="w-full px-4 sm:px-12 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono tracking-[0.2em] text-foreground/40 uppercase">
        <div>Numba Olfactory ©2026</div>
        <div className="flex gap-8">
          <span className="hover:text-gold cursor-pointer transition-colors">Index</span>
          <span className="hover:text-gold cursor-pointer transition-colors">Specifications</span>
          <span className="hover:text-gold cursor-pointer transition-colors">Legal</span>
        </div>
      </footer>

    </div>
  );
}