"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Tag } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import { shopService } from "@/services/apiService";
import { extractCatalogList } from "@/lib/catalogUtils";
import type { ShopPromotion } from "@/types";

interface PromoEntry {
  key: string;
  title: string;
  discount: number;
  description?: string;
  link: string;
  image?: string | null;
  type: 'perfume' | 'accessory' | 'generic';
  rawId?: string;
}

const FALLBACK_IMAGE = "/promo2.png";

function mapPromotionToEntry(promo: ShopPromotion): PromoEntry {
  const isPerfume = promo.type_article === 'parfum';
  return {
    key: `${promo.type_article}-${promo.id}`,
    title: promo.marque ? `${promo.marque} — ${promo.nom}` : promo.nom,
    discount: promo.taux_reduction ?? 0,
    description: promo.message_promotion || undefined,
    link: isPerfume ? `/shop/perfumes/${promo.slug}` : `/shop/accessories/${promo.slug}`,
    image: promo.image_principale || null,
    type: isPerfume ? 'perfume' : 'accessory',
    rawId: String(promo.id),
  };
}

/**
 * Generates context-aware, punchy promo messaging based on category traits
 */
function getPromoMessage(item: PromoEntry): string {
  if (item.description) return item.description;

  if (item.discount <= 0) {
    return "";
  }

  const isEn = i18n.language === 'en';
  const titleLower = (item.title || "").toLowerCase();

  if (item.type === 'perfume') {
    if (titleLower.includes('dupe')) {
      return isEn 
        ? `Get up to ${item.discount}% off our premium inspired alternative fragrances!` 
        : `Profitez d'une réduction allant jusqu'à -${item.discount}% sur nos parfums inspirés (dupes) !`;
    }
    return isEn 
      ? `Enjoy up to ${item.discount}% off our authentic brand name perfumes.` 
      : `Profitez d'une réduction de presque -${item.discount}% sur nos parfums de grande marque.`;
  }

  if (item.type === 'accessory') {
    if (titleLower.includes('lunette') || titleLower.includes('sunglass')) {
      return isEn 
        ? `Special promotion on sunglasses! Save up to ${item.discount}% off today.` 
        : `Promotion sur toutes nos lunettes de soleil ! Jusqu'à -${item.discount}% de réduction à ne pas manquer.`;
    }
    if (titleLower.includes('montre') || titleLower.includes('watch')) {
      return isEn 
        ? `Elevate your style with up to ${item.discount}% off our luxury watches.` 
        : `Sublimez votre style avec jusqu'à -${item.discount}% de réduction sur nos montres de luxe.`;
    }
    if (titleLower.includes('sac') || titleLower.includes('bag')) {
      return isEn 
        ? `Don't miss out on up to ${item.discount}% off our designer handbags.` 
        : `Offre exceptionnelle : jusqu'à -${item.discount}% sur notre maroquinerie et nos sacs tendance !`;
    }
    return isEn 
      ? `Exclusive discount: Save up to ${item.discount}% off our premium accessories.` 
      : `Ne manquez pas jusqu'à -${item.discount}% de réduction immédiate sur cette sélection d'accessoires.`;
  }

  return "";
}

export default function PromoCarousel() {
  const { t } = useTranslation();
  const [promos, setPromos] = useState<PromoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);

  const mobileScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    const fetchPromotions = async () => {
      try {
        const response = await shopService.getPromotions();
        const list = extractCatalogList<ShopPromotion>(response);
        const entries = list
          .map(mapPromotionToEntry)
          .filter((p) => p.discount > 0 || Boolean(p.description));

        if (active) setPromos(entries);
      } catch (error) {
        console.error("[PromoCarousel] Failed to fetch promotional data:", error);
        if (active) setPromos([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPromotions();
    return () => {
      active = false;
    };
  }, []);

  const items: PromoEntry[] =
    promos.length > 0
      ? promos
      : [
          {
            key: "atelier-evergreen",
            title: t("create_my_perfume", { defaultValue: "Créez votre parfum" }),
            discount: 0,
            description: t("atelier_evergreen_desc", {
              defaultValue: "Une création olfactive unique, conçue pour vous.",
            }),
            link: "/numba/atelier",
            image: FALLBACK_IMAGE,
            type: 'generic'
          },
        ];

  // Sync index parameters
  useEffect(() => {
    if (slideIndex >= items.length) setSlideIndex(0);
    if (mobileIndex >= items.length) setMobileIndex(0);
  }, [items.length, slideIndex, mobileIndex]);

  // Track manual scrolling behavior on mobile items layout
  const handleMobileScroll = () => {
    if (!mobileScrollRef.current) return;
    const { scrollLeft, clientWidth } = mobileScrollRef.current;
    if (clientWidth === 0) return;
    
    // Find matching snapped slide item
    const computedIndex = Math.round(scrollLeft / (clientWidth * 0.85));
    const cleanIndex = Math.max(0, Math.min(computedIndex, items.length - 1));
    setMobileIndex(cleanIndex);
  };

  const goTo = (next: number) => {
    const total = items.length;
    setSlideIndex(((next % total) + total) % total);
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-52 w-[85%] flex-shrink-0 rounded-2xl bg-foreground/5 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="hidden lg:block w-full h-[420px] bg-foreground/5 animate-pulse" />
      </div>
    );
  }

  const activeSlide = items[slideIndex] ?? items[0];

  return (
    <section className="w-full">
      {/* ================= MOBILE / TABLET (< lg): swipeable card row with indicators ================= */}
      <div className="lg:hidden max-w-7xl mx-auto mt-2 px-4 sm:px-6">
        <div
          ref={mobileScrollRef}
          onScroll={handleMobileScroll}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((promo, idx) => {
            const displayMessage = getPromoMessage(promo);
            return (
              <motion.div
                key={promo.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="snap-start flex-shrink-0 w-[85%] sm:w-[420px]"
              >
                <Link
                  href={promo.link}
                  className="group relative block h-56 rounded-2xl overflow-hidden border border-gold/15 bg-deep-black"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${promo.image || FALLBACK_IMAGE}')` }}
                  />
                  
                  {/* Backdrop Overlay gradient to support readability over text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-0" />

                  <div className="relative z-10 flex flex-col justify-between h-full p-5">
                    {promo.discount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/20 border border-gold/40 text-gold text-[10px] font-bold uppercase tracking-widest w-fit backdrop-blur-sm">
                        <Tag size={11} />
                        -{promo.discount}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/20 border border-gold/40 text-gold text-[10px] font-bold uppercase tracking-widest w-fit backdrop-blur-sm">
                        {t("exclusive_offer", { defaultValue: "Exclusif" })}
                      </span>
                    )}

                    <div className="space-y-1">
                      <h3 className="font-display text-base font-semibold text-white leading-tight line-clamp-1 capitalize drop-shadow-sm">
                        {promo.title}
                      </h3>
                      {displayMessage && (
                        <p className="text-white/80 text-[11px] leading-relaxed line-clamp-2">
                          {displayMessage}
                        </p>
                      )}
                      <span className="pt-1 inline-flex items-center gap-1 text-xs font-medium text-gold">
                        {t("shop_now", { defaultValue: "Découvrir" })}
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile Dot Indicators */}
        {items.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-4 pb-2">
            {items.map((_, idx) => (
              <div
                key={`mobile-dot-${idx}`}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === mobileIndex ? "w-4 bg-gold" : "w-1 bg-foreground/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================= DESKTOP (lg+): hero slider with arrows and indicators ================= */}
      <div className="hidden lg:block relative w-full h-[440px] overflow-hidden bg-deep-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${activeSlide.image || FALLBACK_IMAGE}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-0" />

            <div className="relative z-10 max-w-7xl mx-auto h-full px-6 lg:px-8 flex items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="max-w-xl"
              >
                {activeSlide.discount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest mb-5">
                    <Tag size={13} />
                    -{activeSlide.discount}% {t("exclusive_offer", { defaultValue: "Offre exclusive" })}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest mb-5">
                    {t("exclusive_offer", { defaultValue: "Exclusif" })}
                  </span>
                )}

                <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-3 capitalize">
                  {activeSlide.title}
                </h2>

                <p className="text-foreground/90 text-base leading-relaxed mb-7 line-clamp-2 font-medium">
                  {getPromoMessage(activeSlide)}
                </p>

                <Link
                  href={activeSlide.link}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-deep-black text-sm font-semibold hover:bg-gold/90 transition-colors"
                >
                  {t("shop_now", { defaultValue: "Découvrir" })}
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Desktop Prev / Next Nav controls */}
        {items.length > 1 && (
          <>
            <button
              type="button"
              aria-label={t("previous", { defaultValue: "Précédent" })}
              onClick={() => goTo(slideIndex - 1)}
              className="absolute left-5 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-foreground/10 hover:bg-gold/20 border border-foreground/20 hover:border-gold/40 flex items-center justify-center text-foreground hover:text-gold transition-colors backdrop-blur-sm"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              aria-label={t("next", { defaultValue: "Suivant" })}
              onClick={() => goTo(slideIndex + 1)}
              className="absolute right-5 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-foreground/10 hover:bg-gold/20 border border-foreground/20 hover:border-gold/40 flex items-center justify-center text-foreground hover:text-gold transition-colors backdrop-blur-sm"
            >
              <ArrowRight size={18} />
            </button>

            {/* Desktop Dot indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {items.map((_, idx) => (
                <button
                  key={`desktop-dot-${idx}`}
                  type="button"
                  aria-label={`Slide ${idx + 1}`}
                  onClick={() => goTo(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === slideIndex ? "w-6 bg-gold" : "w-1.5 bg-foreground/30 hover:bg-foreground/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
