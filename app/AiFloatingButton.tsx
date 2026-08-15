"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "ai-float-dismissed";

export default function AiFloatingButton() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith("en");

  // Start hidden; reveal only after hydration to avoid SSR mismatch
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

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
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.88 }}
          transition={{ type: "spring", stiffness: 340, damping: 28, delay: 1.2 }}
          className="fixed bottom-24 right-4 lg:bottom-8 lg:right-6 z-50 flex items-end gap-2"
        >
          {/* Dismiss button — sits above-left of the main pill */}
          <button
            type="button"
            onClick={dismiss}
            aria-label={isEn ? "Close AI chat prompt" : "Fermer l'invite IA"}
            className="mb-auto mt-1 flex items-center justify-center size-5 rounded-full bg-foreground/10 border border-foreground/15 text-foreground/50 hover:bg-foreground/20 hover:text-foreground transition-colors backdrop-blur-sm"
          >
            <X size={11} strokeWidth={2.5} />
          </button>

          {/* Main pill button */}
          <Link
            href="/numba/ai-consultant"
            className="group relative flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 rounded-full bg-background border border-gold/30 shadow-[0_6px_30px_rgba(0,0,0,0.2)] hover:border-gold/60 transition-all duration-300"
          >
            {/* Subtle gold glow ring */}
            <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_18px_4px_rgba(212,175,55,0.18)] pointer-events-none" />

            {/* Icon with pulse ring */}
            <span className="relative flex items-center justify-center size-8 rounded-full bg-gold/15 text-gold shrink-0">
              <Sparkles size={16} strokeWidth={1.8} />
              <span className="absolute inset-0 rounded-full animate-ping bg-gold/25 opacity-60" />
            </span>

            <span className="flex flex-col leading-tight">
              <span className="text-[10px] uppercase tracking-widest text-gold/70 font-medium">
                {isEn ? "AI Assistant" : "Assistant IA"}
              </span>
              <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">
                {isEn ? "Chat with our AI" : "Discuter avec notre IA"}
              </span>
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
