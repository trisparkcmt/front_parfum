"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { shopService } from "@/services/apiService";
import { extractCatalogList } from "@/lib/catalogUtils";
import AppImage from "@/components/ui/AppImage";

interface PromoEntry {
  key: string;
  title: string;
  discount: number;
  description?: string;
  link: string;
  image?: string | null;
  type: 'perfume' | 'accessory' | 'generic';
  rawId?: string;
  startDate?: string;
  endDate?: string;
}

const FALLBACK_IMAGE = "/promo2.png";
const AUTO_SLIDE_INTERVAL = 5000;
const glass = 'rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.25)] supports-[backdrop-filter]:bg-white/[0.06]';

const textDict = {
  createPerfume: { fr: "Créez votre parfum", en: "Create your perfume" },
  evergreenDesc: { fr: "Une création olfactive unique, conçue pour vous.", en: "A unique scent creation, tailored just for you." },
  exclusive: { fr: "Exclusif", en: "Exclusive" },
  exclusiveOffer: { fr: "Offre exclusive", en: "Exclusive offer" },
  discover: { fr: "Découvrir", en: "Discover" },
  prev: { fr: "Précédent", en: "Previous" },
  next: { fr: "Suivant", en: "Next" },
  categoryPerfume: { fr: "Catégorie parfum", en: "Perfume category" },
  categoryAccessory: { fr: "Catégorie accessoire", en: "Accessory category" },
  upTo: { fr: "Jusqu'à", en: "Up to" },
  off: { fr: "de réduction", en: "off" },
};

function normalizePromotionValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

function isPromotionActive(item: { date_debut?: string | null; date_fin?: string | null }) {
  const now = new Date();
  const start = item.date_debut ? new Date(item.date_debut) : null;
  const end = item.date_fin ? new Date(item.date_fin) : null;

  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

function mapCategoryToEntry(category: any, type: 'perfume' | 'accessory', isEn: boolean): PromoEntry | null {
  const discount = normalizePromotionValue(category.taux_reduction);
  const hasPromotion = discount > 0 || Boolean(category.message_promotion?.trim());

  if (!hasPromotion || !isPromotionActive(category)) return null;

  const defaultTitle = type === 'perfume'
    ? (isEn ? textDict.categoryPerfume.en : textDict.categoryPerfume.fr)
    : (isEn ? textDict.categoryAccessory.en : textDict.categoryAccessory.fr);

  return {
    key: `${type}-${category.id}`,
    title: category.nom || defaultTitle,
    discount,
    description: category.message_promotion || undefined,
    link: type === 'perfume'
      ? `/shop/perfumes?categorie=${category.id}`
      : `/shop/accessories?type=${category.id}`,
    image: category.icone || category.image || null,
    type,
    rawId: String(category.id),
    startDate: category.date_debut || undefined,
    endDate: category.date_fin || undefined,
  };
}

function formatCountdown(item: PromoEntry, isEn: boolean): string | null {
  const now = new Date();
  const start = item.startDate ? new Date(item.startDate) : null;
  const end = item.endDate ? new Date(item.endDate) : null;

  if (start && now < start) {
    const diffMs = start.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days >= 1) {
      return isEn ? `Starts in ${days} day${days > 1 ? 's' : ''}` : `Commence dans ${days} jour${days > 1 ? 's' : ''}`;
    }
    return isEn ? `Starts in ${hours} hour${hours > 1 ? 's' : ''}` : `Commence dans ${hours} heure${hours > 1 ? 's' : ''}`;
  }

  if (end && now < end) {
    const diffMs = end.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days >= 1) {
      return isEn
        ? `${days} day${days > 1 ? 's' : ''} left`
        : `Encore ${days} jour${days > 1 ? 's' : ''}`;
    }
    return isEn
      ? `${hours} hour${hours > 1 ? 's' : ''} left`
      : `Encore ${hours} heure${hours > 1 ? 's' : ''}`;
  }

  return null;
}

function getPromoMessage(item: PromoEntry, isEn: boolean): string {
  if (item.description) return item.description;
  if (item.discount <= 0) return "";

  if (item.type === 'perfume') {
    return isEn
      ? "Discover this promoted perfume category and explore the collection."
      : "Découvrez cette catégorie de parfums en promotion et explorez la collection.";
  }

  if (item.type === 'accessory') {
    return isEn
      ? "Browse this promoted accessory category and shop the collection."
      : "Parcourez cette catégorie d'accessoires en promotion et découvrez la collection.";
  }

  return "";
}

/* ------------------------------------------------------------------ */
/*  Shared promo UI: a real "sale ticket" corner ribbon + countdown   */
/*  chip, reused across mobile cards, the single-item banner and the  */
/*  desktop hero so the "this is a promotion" cue is consistent and   */
/*  instantly recognizable everywhere in the carousel.                */
/* ------------------------------------------------------------------ */

function getPromoTitle(promo: PromoEntry, isEn: boolean): string {
  if (promo.type === 'generic') return promo.title;
  return isEn ? `Promotion on ${promo.title}` : `Promotion sur ${promo.title}`;
}

function DiscountRibbon({
  discount,
  isEn,
  size = 'sm',
}: {
  discount: number;
  isEn: boolean;
  size?: 'sm' | 'lg';
}) {
  const hasDiscount = discount > 0;
  return (
    <div className="pointer-events-none absolute left-0 top-0 z-20 h-24 w-24 overflow-hidden">
      <div
        className={cn(
          "absolute flex items-center justify-center gap-1 bg-red-600 font-display font-bold uppercase tracking-wide text-white shadow-[0_2px_10px_rgba(0,0,0,0.35)]",
          size === 'lg' ? "left-[-34px] top-[18px] w-[170px] py-2 text-sm" : "left-[-30px] top-[14px] w-[130px] py-1.5 text-[11px]"
        )}
        style={{ transform: "rotate(-45deg)" }}
      >
        {hasDiscount ? (
          <span>-{discount}%</span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Sparkles size={size === 'lg' ? 13 : 11} />
            {isEn ? textDict.exclusive.en : textDict.exclusive.fr}
          </span>
        )}
      </div>
    </div>
  );
}

function CountdownChip({ message }: { message: string }) {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[11px] font-medium text-gold">
      <Clock size={12} />
      {message}
    </span>
  );
}

export default function PromoCarousel() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

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
        const [perfumeCategoriesResponse, accessoryTypesResponse] = await Promise.all([
          shopService.getPerfumeCategories(),
          shopService.getAccessoryTypes(),
        ]);

        const perfumeCategories = extractCatalogList<any>(perfumeCategoriesResponse);
        const accessoryTypes = extractCatalogList<any>(accessoryTypesResponse);

        const entries = [
          ...perfumeCategories
            .map((category) => mapCategoryToEntry(category, 'perfume', isEn))
            .filter((entry): entry is PromoEntry => Boolean(entry)),
          ...accessoryTypes
            .map((category) => mapCategoryToEntry(category, 'accessory', isEn))
            .filter((entry): entry is PromoEntry => Boolean(entry)),
        ];

        if (active) setPromos(entries);
      } catch (error) {
        console.error("[PromoCarousel] Failed to fetch promotional categories:", error);
        if (active) setPromos([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPromotions();
    return () => { active = false; };
  }, [isEn]);

  const items: PromoEntry[] = promos.length > 0 ? promos : [
    {
      key: "atelier-evergreen",
      title: isEn ? textDict.createPerfume.en : textDict.createPerfume.fr,
      discount: 0,
      description: isEn ? textDict.evergreenDesc.en : textDict.evergreenDesc.fr,
      link: "/numba",
      image: FALLBACK_IMAGE,
      type: 'generic'
    },
  ];

  const scrollMobileToIndex = (targetIndex: number) => {
    const container = mobileScrollRef.current;
    if (!container) return;
    const cards = container.querySelectorAll<HTMLElement>('[data-promo-card]');
    if (cards[targetIndex]) {
      isInternalScrollChange.current = true;
      const card = cards[targetIndex];
      const offset = card.offsetLeft - (container.clientWidth - card.offsetWidth) / 2;
      container.scrollTo({ left: offset, behavior: 'smooth' });
    }
  };

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

  useEffect(() => {
    if (slideIndex >= items.length) setSlideIndex(0);
    if (mobileIndex >= items.length) setMobileIndex(0);
  }, [items.length, slideIndex, mobileIndex]);

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
        <div className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 pt-2">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-52 w-[82%] min-w-[280px] max-w-[340px] sm:w-[320px] flex-shrink-0 rounded-2xl bg-foreground/5 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="hidden lg:block w-full h-[600px] bg-foreground/5 animate-pulse" />
      </div>
    );
  }

  const activeSlide = items[slideIndex] ?? items[0];
  const activeCountdownMessage = formatCountdown(activeSlide, isEn);
  const activeMessage = getPromoMessage(activeSlide, isEn);

  return (
    <section
      className="w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* MOBILE / TABLET — single item: edge-to-edge header image, text overlaid on the photo */}
      {items.length === 1 && (() => {
        const promo = items[0];
        const displayMessage = getPromoMessage(promo, isEn);
        const countdownMessage = formatCountdown(promo, isEn);
        return (
          <div className="lg:hidden w-full mt-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <Link
                href={promo.link}
                className="group relative block h-64 w-full overflow-hidden bg-deep-black"
              >
                <div className="absolute inset-0 pointer-events-none">
                  <AppImage
                    src={promo.image || FALLBACK_IMAGE}
                    alt={promo.title}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/10 z-10" />

                <DiscountRibbon discount={promo.discount} isEn={isEn} />

                <div className="relative z-20 flex h-full flex-col justify-end px-5 py-4 max-w-7xl mx-auto">
                  <h3 className="font-display text-xl font-semibold text-white leading-tight capitalize drop-shadow-sm line-clamp-2">
                    {getPromoTitle(promo, isEn)}
                  </h3>
                  {displayMessage && (
                    <p className="text-white/85 text-sm leading-relaxed line-clamp-2 mt-1.5">
                      {displayMessage}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    {countdownMessage ? (
                      <CountdownChip message={countdownMessage} />
                    ) : <span />}
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold">
                      {isEn ? textDict.discover.en : textDict.discover.fr}
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        );
      })()}

      {/* MOBILE / TABLET — multiple items: scrollable carousel, text overlaid on the photo */}
      {items.length > 1 && (
      <div className="lg:hidden max-w-7xl mx-auto mt-2 px-4 sm:px-6">
        <div
          ref={mobileScrollRef}
          onScroll={handleMobileScroll}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
          style={{ scrollbarWidth: 'none', scrollPaddingInline: '1rem' }}
        >
          {items.map((promo, idx) => {
            const displayMessage = getPromoMessage(promo, isEn);
            const countdownMessage = formatCountdown(promo, isEn);
            const isActive = idx === mobileIndex;
            return (
              <motion.div
                key={promo.key}
                data-promo-card
                initial={{ opacity: 0, y: 16 }}
                animate={{
                  opacity: isActive ? 1 : 0.7,
                  scale: isActive ? 1 : 0.96,
                  y: 0
                }}
                transition={{ duration: 0.4 }}
                className="snap-center flex-shrink-0 w-[82%] min-w-[280px] max-w-[340px] sm:w-[320px]"
              >
                <Link
                  href={promo.link}
                  className={cn(
                    "group relative block h-52 overflow-hidden rounded-2xl border bg-deep-black transition-colors",
                    isActive ? "border-gold/40" : "border-gold/15"
                  )}
                >
                  <div className="absolute inset-0 pointer-events-none">
                    <AppImage
                      src={promo.image || FALLBACK_IMAGE}
                      alt={promo.title}
                      fill
                      priority={isActive}
                      sizes="(max-width: 1024px) 80vw, 340px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/10 z-10" />

                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-gold/40 pointer-events-none z-20" />
                  )}

                  <DiscountRibbon discount={promo.discount} isEn={isEn} />

                  <div className="relative z-20 flex h-full flex-col justify-end p-4">
                    <h3 className="font-display text-base font-semibold text-white leading-tight line-clamp-2 capitalize drop-shadow-sm">
                      {getPromoTitle(promo, isEn)}
                    </h3>
                    {displayMessage && (
                      <p className="text-white/85 text-xs leading-relaxed line-clamp-2 mt-1">
                        {displayMessage}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      {countdownMessage ? (
                        <CountdownChip message={countdownMessage} />
                      ) : <span />}
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold">
                        {isEn ? textDict.discover.en : textDict.discover.fr}
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

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
      </div>
      )}

      {/* DESKTOP */}
      <div className="hidden lg:block relative w-full h-[620px] overflow-hidden bg-deep-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1 }}
              animate={{ scale: 1.08 }}
 
             transition={{ duration: AUTO_SLIDE_INTERVAL / 1000 + 2, ease: 'linear' }}
            >
              <AppImage
                src={activeSlide.image || FALLBACK_IMAGE}
                alt={activeSlide.title}
                fill
                priority={true}
                sizes="100vw"
              />
            </motion.div>

            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

            <DiscountRibbon discount={activeSlide.discount} isEn={isEn} size="lg" />

            <div className="relative z-10 max-w-7xl mx-auto h-full px-6 lg:px-8 flex items-center pt-16">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-2xl"
              >
                {activeSlide.discount > 0 && (
                  <span className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold mb-4">
                    {isEn ? textDict.exclusiveOffer.en : textDict.exclusiveOffer.fr}
                  </span>
                )}

                <h2 className="font-display text-5xl xl:text-6xl font-bold text-white leading-[1.05] mb-4 capitalize drop-shadow-sm">
                  {getPromoTitle(activeSlide, isEn)}
                </h2>

                {activeSlide.discount > 0 && (
                  <p className="font-display text-lg text-white/80 mb-3">
                    {isEn ? textDict.upTo.en : textDict.upTo.fr}{" "}
                    <span className="text-3xl font-bold text-red-500">-{activeSlide.discount}%</span>{" "}
                    {isEn ? textDict.off.en : textDict.off.fr}
                  </p>
                )}

                {activeMessage && (
                  <p className="text-white/85 text-base leading-relaxed mb-6 line-clamp-2 font-medium max-w-xl">
                    {activeMessage}
                  </p>
                )}

                {activeCountdownMessage && (
                  <div className="mb-6">
                    <CountdownChip message={activeCountdownMessage} />
                  </div>
                )}

                <Link
                  href={activeSlide.link}
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gold text-deep-black text-sm font-semibold hover:bg-white transition-colors duration-300"
                >
                  {isEn ? textDict.discover.en : textDict.discover.fr}
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {items.length > 1 && (
          <>
            <button
              type="button"
              aria-label={isEn ? textDict.prev.en : textDict.prev.fr}
              onClick={() => goTo(slideIndex - 1)}
              className={cn(glass, 'absolute left-6 top-1/2 -translate-y-1/2 z-20 size-12 flex items-center justify-center text-white/80 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer')}
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              aria-label={isEn ? textDict.next.en : textDict.next.fr}
              onClick={() => goTo(slideIndex + 1)}
              className={cn(glass, 'absolute right-6 top-1/2 -translate-y-1/2 z-20 size-12 flex items-center justify-center text-white/80 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer')}
            >
              <ArrowRight size={18} />
            </button>

            <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {items.map((_, idx) => (
                <button
                  key={`desktop-progress-${idx}`}
                  type="button"
                  aria-label={`Slide ${idx + 1}`}
                  onClick={() => goTo(idx)}
                  className="relative h-1 w-10 rounded-full bg-white/20 overflow-hidden cursor-pointer"
                >
                  {idx === slideIndex && (
                    <motion.span
                      key={`${activeSlide.key}-${isPaused}`}
                      className="absolute inset-y-0 left-0 bg-gold rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: isPaused ? '0%' : '100%' }}
                      transition={{ duration: AUTO_SLIDE_INTERVAL / 1000, ease: 'linear' }}
                    />
                  )}
                  {idx < slideIndex && <span className="absolute inset-0 bg-gold/70 rounded-full" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}