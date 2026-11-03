"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "ai-float-dismissed";
const RIBBON_APPEAR_DELAY_MS = 700;
const RIBBON_VISIBLE_MS = 4200;

/**
 * A minimal line-drawn robot glyph — makes it immediately legible as an
 * AI chat entry point, drawn in the same restrained stroke style as the
 * rest of the medallion so it still reads as part of this brand's world.
 */
function RobotIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* antenna */}
      <path d="M12 3.5v2" />
      <circle cx="12" cy="2.8" r="0.6" fill="currentColor" stroke="none" />
      {/* head */}
      <rect x="7" y="5.5" width="10" height="8" rx="2.2" />
      {/* eyes */}
      <circle cx="10.1" cy="9.3" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="13.9" cy="9.3" r="0.9" fill="currentColor" stroke="none" />
      {/* side ears/receivers */}
      <path d="M7 8.2h-1a1 1 0 0 0-1 1v1.4a1 1 0 0 0 1 1h1" />
      <path d="M17 8.2h1a1 1 0 0 1 1 1v1.4a1 1 0 0 1-1 1h-1" />
      {/* neck */}
      <path d="M12 13.5v1.6" />
      {/* body */}
      <path d="M8.4 15.1c-.9.6-1.4 1.4-1.4 2.4v1.4c0 .9.7 1.6 1.6 1.6h6.8c.9 0 1.6-.7 1.6-1.6v-1.4c0-1-.5-1.8-1.4-2.4" />
      <path d="M9.6 15.1h4.8" />
    </svg>
  );
}

export default function AiFloatingButton() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith("en");

  // Start hidden; reveal only after hydration to avoid SSR mismatch
  const [visible, setVisible] = useState(false);
  const [ribbonVisible, setRibbonVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  // One orchestrated moment: the ribbon unfurls once, holds, then retracts
  // behind the medallion. It does not return on hover or repeat.
  useEffect(() => {
    if (!visible) return;
    const show = setTimeout(() => setRibbonVisible(true), RIBBON_APPEAR_DELAY_MS);
    const hide = setTimeout(
      () => setRibbonVisible(false),
      RIBBON_APPEAR_DELAY_MS + RIBBON_VISIBLE_MS
    );
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [visible]);

  const dismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.4 }}
          className="fixed bottom-24 right-4 lg:bottom-8 lg:right-6 z-50 flex items-center"
        >
          {/* Ribbon tag — unfurls from behind the medallion, once, then retracts */}
          <AnimatePresence>
            {ribbonVisible && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "right center" }}
                className="mr-[-14px] pr-6"
              >
                <Link
                  href="/numba/ai-consultant"
                  style={{ clipPath: "polygon(0 0, 100% 0, 88% 50%, 100% 100%, 0 100%)" }}
                  className="flex items-center py-2.5 pl-4 pr-8 border border-gold/25 bg-background whitespace-nowrap"
                >
                  <span className="font-serif italic text-[14px] text-foreground/85">
                    {isEn ? "A question of scent?" : "Un conseil olfactif ?"}
                  </span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Medallion — the persistent element; icon and link never remount */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={dismiss}
              aria-label={isEn ? "Close AI chat prompt" : "Fermer l'invite IA"}
              className="absolute -top-1 -right-1 z-10 flex items-center justify-center size-3.5 rounded-full bg-background border border-gold/25 text-foreground/40 hover:text-foreground hover:border-gold/50 transition-colors"
            >
              <span className="text-[8px] leading-none">✕</span>
            </button>

            <Link
              href="/numba/ai-consultant"
              aria-label={isEn ? "Chat with our scent consultant" : "Discuter avec notre conseiller olfactif"}
              className="group relative flex items-center justify-center size-12 rounded-full border border-gold/30 bg-background shadow-[0_4px_18px_rgba(0,0,0,0.28)] transition-colors duration-300 hover:border-gold/55"
            >
              {/* Engraved inner rim — reads as a struck medallion, not a soft SaaS shadow */}
              <span className="absolute inset-[3px] rounded-full border border-gold/15 pointer-events-none" />
              <RobotIcon className="relative size-[18px] text-gold" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}