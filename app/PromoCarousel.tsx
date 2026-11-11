"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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
const SINGLE_SLIDE_ZOOM_SECONDS = 24;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const textDict = {
  createPerfume: { fr: "Créez votre parfum", en: "Create your perfume" },
  evergreenDesc: { fr: "Une création olfactive unique, conçue pour vous.", en: "A unique scent creation, tailored just for you." },
  atelier: { fr: "Atelier Numba", en: "Numba Atelier" },
  exclusive: { fr: "Exclusif", en: "Exclusive" },
  exclusiveOffer: { fr: "Offre exclusive", en: "Exclusive offer" },
  discover: { fr: "Découvrir", en: "Discover" },
  exploreCollection: { fr: "Explorer la collection", en: "Explore the collection" },
  scroll: { fr: "Défiler", en: "Scroll" },
  prev: { fr: "Précédent", en: "Previous" },
  next: { fr: "Suivant", en: "Next" },
  categoryPerfume: { fr: "Catégorie parfum", en: "Perfume category" },
  categoryAccessory: { fr: "Catégorie accessoire", en: "Accessory category" },
  upTo: { fr: "Jusqu'à", en: "Up to" },
  off: { fr: "de réduction", en: "off" },
  promotionOn: { fr: "Promotion sur", en: "Promotion on" },
  headline: {
    fr: { before: "Créez", accent: "votre", after: "parfum" },
    en: { before: "Create", accent: "your", after: "perfume" },
  },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const reveal: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
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
      : `/shop/accessories?type_accessoire=${category.id}`,
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
/*  Shared UI: every slide (promo or default) uses the same structure  */
/*  eyebrow → headline (with a gold italic accent) → message → CTA,   */
/*  so the no-promo hero and the promo slides feel like one system.    */
/* ------------------------------------------------------------------ */

function getHeadlineParts(promo: PromoEntry, isEn: boolean) {
  if (promo.type === 'generic') {
    const parts = isEn ? textDict.headline.en : textDict.headline.fr;
    return { ...parts, breakAccent: false };
  }
  return {
    before: isEn ? textDict.promotionOn.en : textDict.promotionOn.fr,
    accent: promo.title,
    after: "",
    breakAccent: true,
  };
}

function HeadlineText({ promo, isEn }: { promo: PromoEntry; isEn: boolean }) {
  const parts = getHeadlineParts(promo, isEn);
  return (
    <>
      <span>{parts.before}</span>{" "}
      <em
        className={cn(
          "font-display font-normal italic capitalize text-gold",
          parts.breakAccent && "block"
        )}
      >
        {parts.accent}
      </em>
      {parts.after && (
        <>
          {" "}
          <span>{parts.after}</span>
        </>
      )}
    </>
  );
}

function Eyebrow({ promo, isEn }: { promo: PromoEntry; isEn: boolean }) {
  const label =
    promo.type === 'generic'
      ? (isEn ? textDict.atelier.en : textDict.atelier.fr)
      : promo.discount > 0
        ? (isEn ? textDict.exclusiveOffer.en : textDict.exclusiveOffer.fr)
        : (isEn ? textDict.exclusive.en : textDict.exclusive.fr);

  return (
    <span className="inline-flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.3em] text-gold sm:text-[11px]">
      <span className="h-px w-8 bg-gold" />
      {label}
    </span>
  );
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
          "absolute flex items-center justify-center gap-1 font-display font-bold uppercase tracking-wide shadow-[0_2px_10px_rgba(0,0,0,0.35)]",
          hasDiscount ? "bg-red-600 text-white" : "bg-gold text-deep-black",
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
    <span className="inline-flex w-fit items-center gap-1.5 border border-gold/30 bg-black/30 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-gold backdrop-blur-sm">
      <Clock size={12} />
      {message}
    </span>
  );
}

function MobileSlideBody({
  promo,
  isEn,
  compact,
}: {
  promo: PromoEntry;
  isEn: boolean;
  compact?: boolean;
}) {
  const message = getPromoMessage(promo, isEn);
  const countdown = formatCountdown(promo, isEn);

  return (
    <div
      className={cn(
        "relative z-20 flex h-full w-full flex-col justify-end",
        compact ? "p-4" : "mx-auto max-w-7xl px-5 py-5"
      )}
    >
      <div className="mb-2">
        <Eyebrow promo={promo} isEn={isEn} />
      </div>
      <h3
        className={cn(
          "font-display font-light leading-[1.08] text-white break-words",
          compact ? "text-xl" : "text-3xl"
        )}
      >
        <HeadlineText promo={promo} isEn={isEn} />
      </h3>
      {message && (
        <p
          className={cn(
            "mt-2 font-light leading-relaxed text-white/80",
            compact ? "line-clamp-1 text-xs" : "line-clamp-2 text-sm"
          )}
        >
          {message}
        </p>
      )}
      <div className="flex items-center justify-between pt-3">
        {countdown ? <CountdownChip message={countdown} /> : <span />}
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
          {isEn ? textDict.discover.en : textDict.discover.fr}
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );
}

export default function PromoCarousel() {
  const { i18n } = useTranslation();
  const isEn = Boolean(i18n.language?.startsWith('en'));

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
      <div className="flex w-full flex-col lg:flex-1 lg:min-h-0">
        <div className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 pt-2">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-52 w-[82%] min-w-[280px] max-w-[340px] sm:w-[320px] flex-shrink-0 bg-foreground/5 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="hidden lg:block w-full flex-1 min-h-0 bg-foreground/5 animate-pulse" />
      </div>
    );
  }

  const activeSlide = items[slideIndex] ?? items[0];
  const activeCountdownMessage = formatCountdown(activeSlide, isEn);
  const activeMessage = getPromoMessage(activeSlide, isEn);
  const isSingle = items.length === 1;
  const kenBurnsDuration = isSingle ? SINGLE_SLIDE_ZOOM_SECONDS : AUTO_SLIDE_INTERVAL / 1000 + 2;

  return (
    <section
      className="flex w-full flex-col lg:flex-1 lg:min-h-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* MOBILE / TABLET — single item: edge-to-edge header image, text overlaid on the photo */}
      {isSingle && (
        <div className="lg:hidden w-full mt-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <Link
              href={items[0].link}
              className="group relative block h-72 w-full overflow-hidden bg-deep-black tablet:h-[50svh]"
            >
              <div className="absolute inset-0 pointer-events-none">
                <AppImage
                  src={items[0].image || FALLBACK_IMAGE}
                  alt={items[0].title}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-black/5" />

              {items[0].type !== 'generic' && (
                <DiscountRibbon discount={items[0].discount} isEn={isEn} />
              )}

              <MobileSlideBody promo={items[0]} isEn={isEn} />
            </Link>
          </motion.div>
        </div>
      )}

      {/* MOBILE / TABLET — multiple items: scrollable carousel, text overlaid on the photo */}
      {!isSingle && (
        <div className="lg:hidden max-w-7xl mx-auto mt-2 px-4 sm:px-6">
          <div
            ref={mobileScrollRef}
            onScroll={handleMobileScroll}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
            style={{ scrollbarWidth: 'none', scrollPaddingInline: '1rem' }}
          >
            {items.map((promo, idx) => {
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
                      "group relative block h-56 overflow-hidden border bg-deep-black transition-colors tablet:h-[50svh]",
                      isActive ? "border-gold/50" : "border-gold/15"
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
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/45 to-black/5" />

                    {promo.type !== 'generic' && (
                      <DiscountRibbon discount={promo.discount} isEn={isEn} />
                    )}

                    <MobileSlideBody promo={promo} isEn={isEn} compact />
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
                className={cn(
                  "h-[3px] transition-all duration-300",
                  idx === mobileIndex ? "w-6 bg-gold" : "w-3 bg-foreground/20"
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* DESKTOP */}
      <div className="hidden lg:block relative w-full flex-1 min-h-0 overflow-hidden bg-deep-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            {/* Photo with a slow zoom (also runs on the single no-promo slide) */}
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1 }}
              animate={{ scale: 1.08 }}
              transition={{ duration: kenBurnsDuration, ease: 'linear' }}
            >
              <AppImage
                src={activeSlide.image || FALLBACK_IMAGE}
                alt={activeSlide.title}
                fill
                priority={true}
                sizes="100vw"
                className="object-cover"
              />
            </motion.div>

            {/* Light, directional overlays: the photo stays rich on the right */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

            {activeSlide.type !== 'generic' && (
              <DiscountRibbon discount={activeSlide.discount} isEn={isEn} size="lg" />
            )}

            <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-6 pb-20 pt-32 lg:px-8">
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="max-w-3xl"
              >
                <motion.div variants={reveal} className="mb-6">
                  <Eyebrow promo={activeSlide} isEn={isEn} />
                </motion.div>

                <motion.h2
                  variants={reveal}
                  className="mb-5 font-display text-5xl font-light leading-[1.02] tracking-tight text-white xl:text-6xl 2xl:text-7xl"
                >
                  <HeadlineText promo={activeSlide} isEn={isEn} />
                </motion.h2>

                {activeSlide.discount > 0 && (
                  <motion.p variants={reveal} className="mb-4 font-display text-xl text-white/80">
                    {isEn ? textDict.upTo.en : textDict.upTo.fr}{" "}
                    <span className="px-1 text-4xl font-medium text-red-500">-{activeSlide.discount}%</span>{" "}
                    {isEn ? textDict.off.en : textDict.off.fr}
                  </motion.p>
                )}

                {activeMessage && (
                  <motion.p
                    variants={reveal}
                    className="mb-8 line-clamp-2 max-w-md text-base font-light leading-relaxed text-white/75"
                  >
                    {activeMessage}
                  </motion.p>
                )}

                {activeCountdownMessage && (
                  <motion.div variants={reveal} className="mb-8">
                    <CountdownChip message={activeCountdownMessage} />
                  </motion.div>
                )}

                <motion.div variants={reveal} className="flex flex-wrap items-center gap-8">
                  <Link
                    href={activeSlide.link}
                    className="group inline-flex items-center gap-3 bg-gold px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-deep-black transition-colors duration-300 hover:bg-white"
                  >
                    {isEn ? textDict.discover.en : textDict.discover.fr}
                    <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>

                  {activeSlide.type === 'generic' && (
                    <Link
                      href="/shop/perfumes"
                      className="inline-flex items-center border-b border-white/30 pb-1 text-[11px] font-medium uppercase tracking-[0.22em] text-white/80 transition-colors duration-300 hover:border-gold hover:text-gold"
                    >
                      {isEn ? textDict.exploreCollection.en : textDict.exploreCollection.fr}
                    </Link>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom bar: progress + counter + arrows (multi-slide), or a quiet scroll cue (single) */}
        <div className="absolute inset-x-0 bottom-0 z-20">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 pb-8 lg:px-8">
            {isSingle ? (
              <div className="flex items-center gap-4">
                <span className="h-px w-12 bg-gold/70" />
                <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/60">
                  {isEn ? textDict.scroll.en : textDict.scroll.fr}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2">
                    {items.map((_, idx) => (
                      <button
                        key={`desktop-progress-${idx}`}
                        type="button"
                        aria-label={`Slide ${idx + 1}`}
                        onClick={() => goTo(idx)}
                        className="relative h-[2px] w-12 cursor-pointer overflow-hidden bg-white/25"
                      >
                        {idx === slideIndex && (
                          <motion.span
                            key={`${activeSlide.key}-${isPaused}`}
                            className="absolute inset-y-0 left-0 bg-gold"
                            initial={{ width: '0%' }}
                            animate={{ width: isPaused ? '0%' : '100%' }}
                            transition={{ duration: AUTO_SLIDE_INTERVAL / 1000, ease: 'linear' }}
                          />
                        )}
                        {idx < slideIndex && <span className="absolute inset-0 bg-gold/70" />}
                      </button>
                    ))}
                  </div>
                  <span className="font-display text-sm tracking-[0.2em] text-white/70">
                    {String(slideIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={isEn ? textDict.prev.en : textDict.prev.fr}
                    onClick={() => goTo(slideIndex - 1)}
                    className="inline-flex h-11 w-11 items-center justify-center border border-white/25 bg-black/20 text-white/90 backdrop-blur-sm transition-colors hover:border-gold hover:text-gold"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={isEn ? textDict.next.en : textDict.next.fr}
                    onClick={() => goTo(slideIndex + 1)}
                    className="inline-flex h-11 w-11 items-center justify-center border border-white/25 bg-black/20 text-white/90 backdrop-blur-sm transition-colors hover:border-gold hover:text-gold"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}