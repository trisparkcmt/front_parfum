'use client';

/**
 * @file app/numba/page.tsx
 * @description Numba Atelier Entry Point & Concept Introduction.
 *
 * This page introduces users to the "Numba" custom perfume experience. 
 * It is designed to inspire creativity and guide the user's journey.
 * 
 * **Key Sections**:
 * - **Concept Explanation**: Describes the philosophy of personalized fragrance creation.
 * - **Experience Selection**: Provides two distinct entry points:
 *   - **Guided Path**: The AI Consultant for those seeking expert advice.
 *   - **Direct Path**: The Atelier Lab for users who want to mix their own essences manually.
 * - **Visual Showcase**: Uses high-quality imagery and animations to set a luxury tone.
 * 
 * **Navigation**: Uses the App Router to direct users into specialized sub-routes for their chosen experience.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FlaskConical, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NumbaLanding() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background py-40 lg:py-48">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity"
       
      />
      <div className="absolute inset-0 bg-background" />

      <div className="  relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="hidden md:flex flex-col inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold mb-8">
            <Sparkles size={16} />
            <span className="text-sm font-medium tracking-wider uppercase">{t('olfactory_atelier')}</span>
          </div>

          <h1 className="hidden md:flex flex-col font-display text-5xl md:text-7xl font-bold text-foreground mb-6">
            {t('welcome_at')} <span className="text-gradient-gold">Numba</span>
          </h1>

          <p className="hidden md:flex flex-col text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-16 font-light leading-relaxed">
            {t('numba_desc')}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* IA Option */}
            <Link href="/numba/ai-consultant">
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="h-full p-8 rounded-3xl glass-gold border border-gold/30 text-left relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute -right-4 -top-4 opacity-10 text-gold transform group-hover:scale-110 transition-transform">
                  <Sparkles size={120} />
                </div>
                <div className="w-16 h-16  bg-gold text-deep-black flex items-center justify-center mb-6 shadow-lg shadow-gold/20">
                  <Sparkles size={32} />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-3">{t('ai_sommelier')}</h3>
                <p className="text-foreground/70 mb-8 leading-relaxed">
                  {t('ai_sommelier_desc')}
                </p>
                <div className="inline-flex items-center text-gold font-bold group-hover:gap-2 transition-all mt-auto">
                  {t('consult_ai')} <ArrowRight size={18} className="ml-1" />
                </div>
              </motion.div>
            </Link>

            {/* Manual Option */}
            <Link href="/numba/atelier">
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="h-full p-8 rounded-3xl bg-foreground/5 border border-[var(--t-border)] text-left relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute -right-4 -top-4 opacity-5 text-foreground transform group-hover:scale-110 transition-transform">
                  <FlaskConical size={120} />
                </div>
                <div className="w-16 h-16  bg-foreground/10 text-foreground flex items-center justify-center mb-6">
                  <FlaskConical size={32} />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-3">{t('free_creation')}</h3>
                <p className="text-foreground/70 mb-8 leading-relaxed">
                  {t('free_creation_desc')}
                </p>
                <div className="inline-flex items-center text-foreground font-bold group-hover:gap-2 transition-all group-hover:text-gold mt-auto">
                  {t('open_atelier')} <ArrowRight size={18} className="ml-1" />
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
