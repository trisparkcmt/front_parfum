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
const AUTO_SLIDE_INTERVAL = 5000;

/** Build a lookup of category/type slug → icon URL from both accessory types and perfume categories */
async function fetchCategoryIcons(): Promise<Map<string, string>> {
  const iconMap = new Map<string, string>();
  try {
    const [accTypes, perfCats] = await Promise.allSettled([
      shopService.getAccessoryTypes(),
      shopService.getPerfumeCategories(),
    ]);
    if (accTypes.status === 'fulfilled') {
      const list: any[] = extractCatalogList(accTypes.value);
      list.forEach((t) => {
        if (t.icone) iconMap.set(t.slug ?? String(t.id), t.icone);
      });
    }
    if (perfCats.status === 'fulfilled') {
      const list: any[] = extractCatalogList(perfCats.value);
      list.forEach((c) => {
        if (c.icone) iconMap.set(c.slug ?? String(c.id), c.icone);
      });
    }
  } catch {
    /* silent */
  }
  return iconMap;
}

function mapPromotionToEntry(promo: ShopPromotion, iconMap: Map<string, string>): PromoEntry {
  const isPerfume = promo.type_article === 'parfum';

  // Image resolution priority:
  // 1. Product image (image_principale) — the actual product photo
  // 2. Category icon matching the promo slug or a known category mapping
  // 3. Static fallback
  const productImage = promo.image_principale || null;

  // Try to find a category icon by iterating iconMap keys that match part of the promo slug
  let categoryIcon: string | null = null;
  if (!productImage) {
    for (const [slug, icon] of iconMap.entries()) {
      if (promo.slug?.includes(slug) || slug?.includes(promo.slug?.split('-')[0] ?? '')) {
        categoryIcon = icon;
        break;
      }
    }
    // Also try by iterating all icons (first match wins as fallback)
    if (!categoryIcon && iconMap.size > 0) {
      const titleLower = (promo.nom || '').toLowerCase();
      for (const [slug, icon] of iconMap.entries()) {
        if (titleLower.includes(slug.toLowerCase()) || slug.toLowerCase().includes(titleLower.split(' ')[0])) {
          categoryIcon = icon;
          break;
        }
      }
    }
  }

  const resolvedImage = productImage || categoryIcon || null;

  return {
    key: `${promo.type_article}-${promo.id}`,
    title: promo.marque ? `${promo.marque} — ${promo.nom}` : promo.nom,
    discount: promo.taux_reduction ?? 0,
    description: promo.message_promotion || undefined,
    link: isPerfume ? `/shop/perfumes/${promo.slug}` : `/shop/accessories/${promo.slug}`,
    image: resolvedImage,
    type: isPerfume ? 'perfume' : 'accessory',
    rawId: String(promo.id),
  };
}

function getPromoMessage(item: PromoEntry): string {
  if (item.description) return item.description;
  if (item.discount <= 0) return "";

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
  const [isPaused, setIsPaused] = useState(false);

  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const isInternalScrollChange = useRef(false);

  useEffect(() => {
    let active = true;
    const fetchPromotions = async () => {
      try {
        const [response, iconMap] = await Promise.all([
          shopService.getPromotions(),
          fetchCategoryIcons(),
        ]);
        const list = extractCatalogList<ShopPromotion>(response);
        const entries = list
          .map((p) => mapPromotionToEntry(p, iconMap))
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
    return () => { active = false; };
  }, []);

  const items: PromoEntry[] = promos.length > 0 ? promos : [
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

  /** Scroll the mobile carousel so that the target card is centered in the viewport */
  const scrollMobileToIndex = (targetIndex: number) => {
    const container = mobileScrollRef.current;
    if (!container) return;
    const cards = container.querySelectorAll<HTMLElement>('[data-promo-card]');
    if (cards[targetIndex]) {
      isInternalScrollChange.current = true;
      const card = cards[targetIndex];
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const offset = card.offsetLeft - (container.clientWidth - card.offsetWidth) / 2;
      container.scrollTo({ left: offset, behavior: 'smooth' });
      void containerRect; void cardRect;
    }
  };

  // Global Auto-Slide Engine
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      const nextIndex = (slideIndex + 1) % items.length;
      setSlideIndex(nextIndex);
      setMobileIndex(nextIndex);
      scrollMobileToIndex(nextIndex);
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, [items.length, slideIndex, isPaused]);

  // Sync index on bounds changes
  useEffect(() => {
    if (slideIndex >= items.length) setSlideIndex(0);
    if (mobileIndex >= items.length) setMobileIndex(0);
  }, [items.length, slideIndex, mobileIndex]);

  // Track manual swiping
  const handleMobileScroll = () => {
    if (!mobileScrollRef.current) return;
    if (isInternalScrollChange.current) {
      isInternalScrollChange.current = false;
      return;
    }
    const container = mobileScrollRef.current;
    const cards = container.querySelectorAll<HTMLElement>('[data-promo-card]');
    let closestIdx = 0;
    let closestDist = Infinity;
    const center = container.scrollLeft + container.clientWidth / 2;
    cards.forEach((card, i) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(center - cardCenter);
      if (dist < closestDist) { closestDist = dist; closestIdx = i; }
    });
    setMobileIndex(closestIdx);
    setSlideIndex(closestIdx);
  };

  const goTo = (next: number) => {
    const total = items.length;
    const targetIndex = ((next % total) + total) % total;
    setSlideIndex(targetIndex);
    setMobileIndex(targetIndex);
    scrollMobileToIndex(targetIndex);
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
    <section 
      className="w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* ================= MOBILE / TABLET (< lg) ================= */}
      <div className="lg:hidden max-w-7xl mx-auto mt-2 px-4 sm:px-6">
        <div
          ref={mobileScrollRef}
          onScroll={handleMobileScroll}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-[10%]"
          style={{ scrollbarWidth: "none", scrollPaddingInline: '10%' }}
        >
          {items.map((promo, idx) => {
            const displayMessage = getPromoMessage(promo);
            const isActive = idx === mobileIndex;
            return (
              <motion.div
                key={promo.key}
                data-promo-card
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className={`snap-center flex-shrink-0 w-[80%] sm:w-[420px] transition-all duration-300 ${
                  isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-70'
                }`}
              >
                <Link
                  href={promo.link}
                  className="group relative block h-56 rounded-2xl overflow-hidden border border-gold/15 bg-deep-black"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${promo.image || FALLBACK_IMAGE}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-0" />

                  {/* Active indicator ring */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-gold/40 pointer-events-none z-20" />
                  )}

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
              <button
                key={`mobile-dot-${idx}`}
                type="button"
                onClick={() => goTo(idx)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === mobileIndex ? "w-4 bg-gold" : "w-1 bg-foreground/20"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================= DESKTOP (lg+) ================= */}
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
              className="absolute left-5 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-foreground/10 hover:bg-gold/20 border border-foreground/20 hover:border-gold/40 flex items-center justify-center text-foreground hover:text-gold transition-colors backdrop-blur-sm cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              aria-label={t("next", { defaultValue: "Suivant" })}
              onClick={() => goTo(slideIndex + 1)}
              className="absolute right-5 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-foreground/10 hover:bg-gold/20 border border-foreground/20 hover:border-gold/40 flex items-center justify-center text-foreground hover:text-gold transition-colors backdrop-blur-sm cursor-pointer"
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
