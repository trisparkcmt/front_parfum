'use client';

/**
 * @file components/pwa/PWAInstallGuide.tsx
 * @description Rich, animated "Add to Home Screen" walkthrough for the PWA
 * install fallback modal. Auto-detects iOS vs Android (with manual override)
 * and renders a live phone-frame mockup for each step instead of plain text.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Share2,
  MoreVertical,
  Plus,
  Home,
  Download,
  Lock,
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { isIOS as detectIOS, isAndroid as detectAndroid } from '@/lib/pwa';

type Platform = 'ios' | 'android';

interface StepInfo {
  title: string;
  desc: string;
}

function cx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------ */
/*  Step copy                                                          */
/* ------------------------------------------------------------------ */

function iosSteps(isEn: boolean): StepInfo[] {
  return [
    {
      title: isEn ? 'Open in Safari' : 'Ouvrez Safari',
      desc: isEn
        ? 'Installing only works from Safari on iPhone or iPad — not Chrome or another browser.'
        : 'L’installation ne fonctionne que depuis Safari sur iPhone ou iPad, pas depuis un autre navigateur.',
    },
    {
      title: isEn ? 'Tap the Share icon' : 'Touchez l’icône Partager',
      desc: isEn
        ? 'It’s the square with an arrow, in the toolbar at the bottom of the screen.'
        : 'C’est le carré avec une flèche, dans la barre en bas de l’écran.',
    },
    {
      title: isEn ? 'Select "Add to Home Screen"' : 'Choisissez « Sur l’écran d’accueil »',
      desc: isEn
        ? 'Scroll down the share menu until you see this option.'
        : 'Faites défiler le menu de partage jusqu’à cette option.',
    },
    {
      title: isEn ? 'Tap "Add"' : 'Appuyez sur « Ajouter »',
      desc: isEn
        ? 'Confirm the app name — it stays exactly as shown.'
        : 'Confirmez le nom de l’application, il reste tel quel.',
    },
    {
      title: isEn ? 'Open it from your home screen' : 'Ouvrez-la depuis l’écran d’accueil',
      desc: isEn
        ? 'The icon now behaves like any other app, full-screen and offline-ready.'
        : 'L’icône se comporte comme une application, en plein écran et accessible hors-ligne.',
    },
  ];
}

function androidSteps(isEn: boolean): StepInfo[] {
  return [
    {
      title: isEn ? 'Open the browser menu' : 'Ouvrez le menu du navigateur',
      desc: isEn
        ? 'Tap the three dots in the top-right corner.'
        : 'Touchez les trois points en haut à droite.',
    },
    {
      title: isEn ? 'Tap "Install app"' : 'Touchez « Installer l’application »',
      desc: isEn
        ? 'It may also appear as "Add to Home screen".'
        : 'L’option peut aussi s’appeler « Ajouter à l’écran d’accueil ».',
    },
    {
      title: isEn ? 'Confirm the install' : 'Confirmez l’installation',
      desc: isEn
        ? 'Tap "Install" on the prompt that appears.'
        : 'Appuyez sur « Installer » dans la fenêtre qui s’affiche.',
    },
    {
      title: isEn ? 'Open it from your home screen' : 'Ouvrez-la depuis l’écran d’accueil',
      desc: isEn
        ? 'The icon now behaves like any other app, full-screen and offline-ready.'
        : 'L’icône se comporte comme une application, en plein écran et accessible hors-ligne.',
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Phone-screen building blocks                                       */
/* ------------------------------------------------------------------ */

function PulseIcon({
  children,
  active,
  reduceMotion,
}: {
  children: React.ReactNode;
  active?: boolean;
  reduceMotion?: boolean;
}) {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
      {active && !reduceMotion && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-gold"
          initial={{ scale: 0.7, opacity: 0.9 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 1.3, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <div
        className={cx(
          'relative w-8 h-8 rounded-full flex items-center justify-center transition-colors',
          active ? 'bg-gold text-deep-black' : 'bg-foreground/10 text-foreground/45'
        )}
      >
        {children}
      </div>
    </div>
  );
}

function BrowserChrome({ url = 'accessoiresexclusifs.com' }: { url?: string }) {
  return (
    <div className="absolute top-5 left-0 right-0 px-2.5">
      <div className="flex items-center gap-1.5 rounded-lg bg-foreground/10 px-2 py-1.5">
        <Lock size={9} className="text-foreground/40 shrink-0" />
        <span className="text-[9px] text-foreground/60 truncate">{url}</span>
      </div>
    </div>
  );
}

function AndroidTopBar({
  highlightMenu,
  reduceMotion,
}: {
  highlightMenu?: boolean;
  reduceMotion?: boolean;
}) {
  return (
    <div className="absolute top-5 left-0 right-0 px-2.5 flex items-center gap-1.5">
      <div className="flex-1 flex items-center gap-1.5 rounded-full bg-foreground/10 px-2 py-1.5 min-w-0">
        <Lock size={9} className="text-foreground/40 shrink-0" />
        <span className="text-[9px] text-foreground/60 truncate">accessoiresexclusifs.com</span>
      </div>
      <PulseIcon active={highlightMenu} reduceMotion={reduceMotion}>
        <MoreVertical size={13} />
      </PulseIcon>
    </div>
  );
}

function SafariToolbar({
  highlightShare,
  reduceMotion,
}: {
  highlightShare?: boolean;
  reduceMotion?: boolean;
}) {
  return (
    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-between px-5">
      <ArrowLeft size={14} className="text-foreground/25" />
      <PulseIcon active={highlightShare} reduceMotion={reduceMotion}>
        <Share2 size={13} />
      </PulseIcon>
      <Bookmark size={14} className="text-foreground/25" />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="absolute top-14 left-3 right-3 space-y-2">
      <div className="h-16 rounded-lg bg-gradient-to-br from-gold/25 to-gold/5" />
      <div className="h-2 w-3/4 rounded-full bg-foreground/10" />
      <div className="h-2 w-1/2 rounded-full bg-foreground/10" />
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="h-14 rounded-lg bg-foreground/[0.06]" />
        <div className="h-14 rounded-lg bg-foreground/[0.06]" />
      </div>
    </div>
  );
}

function MenuSheet({
  rows,
}: {
  rows: { label: string; active: boolean; icon: React.ReactNode }[];
}) {
  return (
    <div className="absolute inset-x-2 bottom-3 rounded-2xl bg-charcoal border border-foreground/10 shadow-xl overflow-hidden">
      <div className="flex justify-center pt-2">
        <span className="w-8 h-1 rounded-full bg-foreground/20" />
      </div>
      <div className="py-1.5">
        {rows.map((r) => (
          <div
            key={r.label}
            className={cx('flex items-center gap-2 px-3 py-2 text-[9px]', r.active && 'bg-gold/10')}
          >
            <span
              className={cx(
                'w-4 h-4 rounded-full flex items-center justify-center shrink-0',
                r.active ? 'bg-gold text-deep-black' : 'bg-foreground/10 text-foreground/40'
              )}
            >
              {r.active ? r.icon : <span className="w-1 h-1 rounded-full bg-current" />}
            </span>
            <span className={cx('truncate', r.active ? 'text-gold font-semibold' : 'text-foreground/60')}>
              {r.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DropdownMenu({
  rows,
}: {
  rows: { label: string; active: boolean; icon: React.ReactNode }[];
}) {
  return (
    <div className="absolute top-14 right-2 w-[72%] rounded-xl bg-charcoal border border-foreground/10 shadow-xl overflow-hidden py-1">
      {rows.map((r) => (
        <div
          key={r.label}
          className={cx('flex items-center gap-2 px-3 py-2 text-[9px]', r.active && 'bg-gold/10')}
        >
          <span
            className={cx(
              'w-4 h-4 rounded-full flex items-center justify-center shrink-0',
              r.active ? 'bg-gold text-deep-black' : 'bg-foreground/10 text-foreground/40'
            )}
          >
            {r.active ? r.icon : <span className="w-1 h-1 rounded-full bg-current" />}
          </span>
          <span className={cx('truncate', r.active ? 'text-gold font-semibold' : 'text-foreground/60')}>
            {r.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({ isEn, confirmLabel }: { isEn: boolean; confirmLabel: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
      <div className="w-[85%] rounded-xl bg-charcoal border border-gold/20 p-3 text-center shadow-xl">
        <div className="w-9 h-9 mx-auto rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold text-[11px] font-serif font-bold mb-2">
          AE
        </div>
        <p className="text-[9px] font-semibold text-foreground">Accessoires Exclusifs</p>
        <p className="text-[8px] text-foreground/40 mb-2.5 truncate">accessoiresexclusifs.com</p>
        <div className="flex gap-1.5">
          <div className="flex-1 rounded-md py-1.5 text-[8px] text-foreground/50 border border-foreground/10">
            {isEn ? 'Cancel' : 'Annuler'}
          </div>
          <div className="flex-1 rounded-md py-1.5 text-[8px] font-semibold bg-gold text-deep-black">
            {confirmLabel}
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeScreenReveal({ isEn, reduceMotion }: { isEn: boolean; reduceMotion?: boolean }) {
  return (
    <div className="absolute inset-0 p-3">
      <div className="grid grid-cols-4 gap-2.5 pt-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-[9px] bg-foreground/[0.06]" />
        ))}
        <motion.div
          className="relative aspect-square rounded-[9px] bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-deep-black text-[10px] font-serif font-bold"
          initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: reduceMotion ? 0 : 0.15 }}
        >
          AE
          {!reduceMotion && (
            <motion.span
              className="absolute -inset-1.5 rounded-xl border border-gold/50"
              initial={{ opacity: 0.8, scale: 0.9 }}
              animate={{ opacity: 0, scale: 1.3 }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.div>
      </div>
      <p className="text-center text-[8px] text-gold/80 mt-2.5 font-medium">
        {isEn ? 'Added to Home Screen' : 'Ajoutée à l’écran d’accueil'}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen router                                                      */
/* ------------------------------------------------------------------ */

function renderScreen(platform: Platform, step: number, isEn: boolean, reduceMotion: boolean) {
  if (platform === 'ios') {
    switch (step) {
      case 0:
        return (
          <>
            <BrowserChrome />
            <PageSkeleton />
            <SafariToolbar reduceMotion={reduceMotion} />
          </>
        );
      case 1:
        return (
          <>
            <BrowserChrome />
            <PageSkeleton />
            <SafariToolbar highlightShare reduceMotion={reduceMotion} />
          </>
        );
      case 2:
        return (
          <>
            <BrowserChrome />
            <div className="opacity-30">
              <PageSkeleton />
            </div>
            <MenuSheet
              rows={[
                { label: isEn ? 'Copy' : 'Copier', active: false, icon: null },
                {
                  label: isEn ? 'Add to Reading List' : 'Ajouter à la liste de lecture',
                  active: false,
                  icon: null,
                },
                {
                  label: isEn ? 'Add to Home Screen' : 'Sur l’écran d’accueil',
                  active: true,
                  icon: <Home size={9} />,
                },
                { label: isEn ? 'Add Bookmark' : 'Ajouter un signet', active: false, icon: null },
              ]}
            />
          </>
        );
      case 3:
        return (
          <>
            <BrowserChrome />
            <div className="opacity-20">
              <PageSkeleton />
            </div>
            <ConfirmDialog isEn={isEn} confirmLabel={isEn ? 'Add' : 'Ajouter'} />
          </>
        );
      case 4:
      default:
        return <HomeScreenReveal isEn={isEn} reduceMotion={reduceMotion} />;
    }
  }

  switch (step) {
    case 0:
      return (
        <>
          <AndroidTopBar highlightMenu reduceMotion={reduceMotion} />
          <PageSkeleton />
        </>
      );
    case 1:
      return (
        <>
          <AndroidTopBar reduceMotion={reduceMotion} />
          <div className="opacity-30">
            <PageSkeleton />
          </div>
          <DropdownMenu
            rows={[
              { label: isEn ? 'New tab' : 'Nouvel onglet', active: false, icon: null },
              { label: isEn ? 'History' : 'Historique', active: false, icon: null },
              {
                label: isEn ? 'Install app' : 'Installer l’application',
                active: true,
                icon: <Download size={9} />,
              },
              { label: isEn ? 'Settings' : 'Paramètres', active: false, icon: null },
            ]}
          />
        </>
      );
    case 2:
      return (
        <>
          <AndroidTopBar reduceMotion={reduceMotion} />
          <div className="opacity-20">
            <PageSkeleton />
          </div>
          <ConfirmDialog isEn={isEn} confirmLabel={isEn ? 'Install' : 'Installer'} />
        </>
      );
    case 3:
    default:
      return <HomeScreenReveal isEn={isEn} reduceMotion={reduceMotion} />;
  }
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function PWAInstallGuide({ isEn }: { isEn: boolean }) {
  const [platform, setPlatform] = useState<Platform>('ios');
  const [step, setStep] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (detectAndroid()) setPlatform('android');
    else if (detectIOS()) setPlatform('ios');
  }, []);

  const stepsData = platform === 'ios' ? iosSteps(isEn) : androidSteps(isEn);
  const total = stepsData.length;
  const current = stepsData[Math.min(step, total - 1)];

  const switchPlatform = (p: Platform) => {
    setPlatform(p);
    setStep(0);
  };

  const next = () => setStep((s) => Math.min(s + 1, total - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="space-y-5">
      <p className="text-sm text-foreground/60">
        {isEn
          ? 'Add the app to your home screen for one-tap access and a full-screen experience.'
          : 'Ajoutez l’application à votre écran d’accueil pour un accès en un geste, en plein écran.'}
      </p>

      {/* Platform switch */}
      <div className="inline-flex rounded-full border border-foreground/10 bg-foreground/[0.03] p-1 text-xs">
        {(['ios', 'android'] as Platform[]).map((p) => (
          <button
            key={p}
            onClick={() => switchPlatform(p)}
            className={cx(
              'px-3.5 py-1.5 rounded-full font-medium transition-colors',
              platform === p ? 'bg-gold text-deep-black' : 'text-foreground/50 hover:text-foreground'
            )}
          >
            {p === 'ios' ? 'iPhone' : 'Android'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[196px_1fr] gap-5 sm:gap-7 items-center">
        {/* Phone mockup */}
        <div className="relative mx-auto w-[172px] h-[352px] sm:w-[196px] sm:h-[400px] rounded-[2rem] border-[3px] border-foreground/15 bg-deep-black shadow-xl shadow-black/40 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground/10 rounded-b-xl z-20" />
          <AnimatePresence mode="wait">
            <motion.div
              key={`${platform}-${step}`}
              className="absolute inset-0"
              initial={prefersReducedMotion ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, x: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {renderScreen(platform, step, isEn, Boolean(prefersReducedMotion))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step content */}
        <div className="space-y-4 min-w-0">
          <div>
            <p className="text-[11px] font-medium text-gold/80 mb-1.5">
              {isEn ? `Step ${step + 1} of ${total}` : `Étape ${step + 1} sur ${total}`}
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${platform}-${step}-text`}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-lg font-serif font-semibold text-foreground">{current.title}</h3>
                <p className="text-[13px] text-foreground/55 leading-6 mt-1">{current.desc}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1.5">
            {stepsData.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`${isEn ? 'Step' : 'Étape'} ${i + 1}`}
                className={cx(
                  'h-1.5 rounded-full transition-all',
                  i === step ? 'w-5 bg-gold' : 'w-1.5 bg-foreground/15 hover:bg-foreground/25'
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={prev}
              disabled={step === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-foreground/10 px-3 py-2 text-xs font-medium text-foreground/60 hover:bg-foreground/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft size={14} />
              {isEn ? 'Back' : 'Précédent'}
            </button>
            <button
              onClick={next}
              disabled={step === total - 1}
              className="inline-flex items-center gap-1 rounded-lg bg-gold px-3.5 py-2 text-xs font-semibold text-deep-black hover:bg-gold-light disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              {isEn ? 'Next' : 'Suivant'}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-foreground/35 border-t border-foreground/10 pt-3.5">
        {isEn
          ? 'No automatic prompt? Use your browser’s share or menu button to add this site manually.'
          : 'Pas de proposition automatique ? Utilisez le bouton de partage ou le menu du navigateur pour ajouter le site manuellement.'}
      </p>
    </div>
  );
}