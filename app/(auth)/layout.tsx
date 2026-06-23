'use client';

/**
 * @file app/(auth)/layout.tsx
 * @description Shared auth shell with a smooth side-swap animation between
 * /login and /register on desktop. Uses framer-motion `layout` to FLIP the
 * brand panel and form panel positions.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Gem, ArrowLeft, Sparkles } from 'lucide-react';
import { useMemo } from 'react';

const TAGLINES = [
  { title: "L'art de l'élégance.", body: "Rejoignez notre espace membre exclusif pour accéder à vos créations sur mesure." },
  { title: 'Façonné pour vous.', body: 'Suivez vos commandes, sauvegardez vos envies et recevez nos pièces en avant-première.' },
  { title: 'Une signature rare.', body: 'Chaque accessoire est numéroté, signé, et pensé pour durer toute une vie.' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // On /register the form sits on the LEFT and the brand panel on the RIGHT.
  // On every other auth route the form sits on the RIGHT (default).
  const formOnLeft = pathname?.startsWith('/register');

  const tagline = useMemo(() => {
    if (pathname?.startsWith('/register')) return TAGLINES[1];
    if (pathname?.startsWith('/forgot-password') || pathname?.startsWith('/reset-password')) return TAGLINES[2];
    return TAGLINES[0];
  }, [pathname]);

  const Brand = (
    <motion.aside
      key="brand-panel"
      layout
      layoutId="auth-brand"
      transition={{ type: 'spring', stiffness: 110, damping: 20, mass: 0.9 }}
      className="hidden md:flex md:w-1/2 relative overflow-hidden bg-charcoal"
    >
      {/* photo */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=2000&auto=format&fit=crop')" }}
      />
      {/* animated gold sheen */}
      <motion.div
        aria-hidden
        className="absolute -inset-1/2 bg-[radial-gradient(circle_at_30%_20%,theme(colors.gold)/35%,transparent_55%)]"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/20 to-transparent" />
      <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
           style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      <div className="relative z-10 w-full p-12 flex flex-col justify-between h-full">
        <Link href="/" className="flex items-center gap-2 group w-fit">
          <Gem className="h-8 w-8 text-gold group-hover:rotate-12 transition-transform duration-300" />
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">
            <span className="text-gold">Accessories</span> Exclusif
          </span>
        </Link>

        <AnimatePresence mode="wait">
          <motion.div
            key={tagline.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45 }}
          >
            <div className="inline-flex items-center gap-2 text-gold/80 text-xs uppercase tracking-[0.25em] mb-4">
              <Sparkles size={14} /> Maison privée
            </div>
            <h2 className="font-display text-4xl lg:text-5xl text-foreground font-bold mb-4 leading-tight">
              {tagline.title}
            </h2>
            <p className="text-cream/70 text-lg max-w-md leading-relaxed">{tagline.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.aside>
  );

  const Form = (
    <motion.section
      key="form-panel"
      layout
      layoutId="auth-form"
      transition={{ type: 'spring', stiffness: 110, damping: 20, mass: 0.9 }}
      className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative bg-background"
    >
      {/* subtle gold glow behind card */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[480px] rounded-full bg-gold/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-gold mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Retour à l'accueil
        </Link>

        <div className="relative rounded-2xl border border-gold/15 bg-charcoal/40 backdrop-blur-md shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] p-7 sm:p-9">
          {/* corner gold accents */}
          <span className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );

  return (
    <div className="min-h-screen bg-background">
      <LayoutGroup>
        <motion.div layout className={`min-h-screen flex flex-col ${formOnLeft ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
          {Brand}
          {Form}
        </motion.div>
      </LayoutGroup>
    </div>
  );
}
