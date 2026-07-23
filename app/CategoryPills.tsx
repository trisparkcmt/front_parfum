"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Gem,
  Watch,
  Glasses,
  Crown,
  Package,
  ArrowRight,
} from "lucide-react";
import { CartIcon, CategoryIcon, TagIcon, DiffuseurIcon, PerfumeIcon } from "@/components/icons/CustomIcons";
import AppImage from "@/components/ui/AppImage";
import { productService } from "@/services/productService";
import { AccessorySubCategory } from "@/types";

interface CategoryEntry {
  key: string;
  label: string;
  href: string;
  image: string | null;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

const PERFUME_LABELS: Record<string, string> = {
  "perfume-brand": "category_perfume_brand",
  "perfume-dupe": "category_perfume_dupe",
  "numba-creation": "category_numba_creation",
};

const PERFUME_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "perfume-brand": PerfumeIcon,
  "perfume-dupe": PerfumeIcon,
  "numba-creation": Gem,
};

const ACCESSORY_LABELS: Record<AccessorySubCategory, string> = {
  watches: "category_watches",
  jewelry: "category_jewelry",
  bags: "category_bags",
  sunglasses: "category_sunglasses",
  belts: "category_belts",
  other: "category_other",
};

const ACCESSORY_ICONS: Record<AccessorySubCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  watches: Watch,
  jewelry: Gem,
  bags: CartIcon,
  sunglasses: Glasses,
  belts: TagIcon,
  other: Package,
};

/**
 * Category navigation.
 *
 * Mobile (< lg): horizontal scrollable pill row (unchanged from before).
 * Desktop (lg+): circular avatar row styled after a classic
 * "Shop by category" sub-nav — round image/icon, label underneath,
 * horizontally scrollable when there are more categories than fit,
 * with a "View all categories" link on the right.
 *
 * Avatar image priority: real category image (perfume `image` field or
 * accessory `icone` field) when present, otherwise a representative
 * lucide icon so the row never shows a broken/empty circle.
 */
export default function CategoryPills() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<CategoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string>("all");

  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      try {
        const [perfumeCategories, accessoryTypes] = await Promise.all([
          productService.getPerfumeCategories().catch(() => []),
          productService.getAccessoryTypes().catch(() => []),
        ]);

        const perfumeEntries: CategoryEntry[] = perfumeCategories.map((c: any) => ({
          key: `perfume-${c.id}`,
          label: c.name,
          href: `/shop/perfumes?categorie=${c.id}`,
          image: c.image || c.icone || null,
          Icon: Sparkles,
        }));

        const accessoryEntries: CategoryEntry[] = accessoryTypes.map((tp: any) => {
          const subcat = tp.subcategory as AccessorySubCategory;
          // Map to correct catalog path with selected query type filter
          return {
            key: `accessory-${tp.id}`,
            label: t(ACCESSORY_LABELS[subcat] || tp.name, { defaultValue: tp.name }),
            href: `/shop/accessories?type=${tp.id}`,
            image: tp.icone || null,
            Icon: ACCESSORY_ICONS[subcat] || Package,
          };
        });

        const diffuseurEntry: CategoryEntry = {
          key: 'diffuseurs-main',
          label: 'Diffuseurs',
          href: '/shop/diffuseurs',
          image: null,
          Icon: DiffuseurIcon,
        };

        if (mounted) setCategories([diffuseurEntry, ...perfumeEntries, ...accessoryEntries]);
      } catch (error) {
        console.error("[CategoryPills] Failed to fetch categories:", error);
        if (mounted) setCategories([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCategories();
    return () => {
      mounted = false;
    };
  }, [t]);

  return (
    <>
      {/* ================= MOBILE / TABLET (< lg): pill row, normal flow ================= */}
      <section className="lg:hidden w-full max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {t("categories", { defaultValue: "Catégories" })}
          </h2>
          <Link href="/shop" className="text-xs font-medium text-foreground/50 hover:text-gold transition-colors">
            {t("see_all", { defaultValue: "Voir tout" })}
          </Link>
        </div>

        {/* Horizontally scrollable pill row for mobile */}
        <div className="relative -mx-4">
          <div
            className="flex items-center gap-2 overflow-x-auto px-4 pb-2"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-9 w-24 flex-shrink-0 rounded-full bg-foreground/5 animate-pulse" />
                ))
              : categories.map((cat) => {
                  const { Icon } = cat;
                  return (
                    <Link
                      key={cat.key}
                      href={cat.href}
                      onClick={() => setActive(cat.key)}
                      className={`flex-shrink-0 pl-1 pr-4 h-9 flex items-center gap-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                        active === cat.key
                          ? "bg-gold/15 border-gold/40 text-gold"
                          : "bg-foreground/5 border-foreground/10 text-foreground/70 hover:border-gold/30 hover:text-gold"
                      }`}
                    >
                      <div className="relative size-7 rounded-full overflow-hidden flex items-center justify-center bg-foreground/10 flex-shrink-0">
                        {cat.image ? (
                          <AppImage src={cat.image} alt={cat.label || 'Catégorie'} fill className="object-cover" loading="lazy" sizes="28px" />
                        ) : (
                          <Icon size={14} className="text-foreground/60" />
                        )}
                      </div>
                      {cat.label}
                    </Link>
                  );
                })}
          </div>
        </div>
      </section>

      {/*
        ================= DESKTOP (lg+): floating card straddling the seam =================
        This sits BETWEEN the hero and the section below in markup order, but
        a negative top margin pulls it up so roughly its top half overlaps the
        hero's bottom edge and its bottom half overlaps the next section's top
        edge. z-20 keeps it visually above both neighbors. The hero
        (PromoCarousel) and the section below it (ProductSection) need no
        special z-index of their own — normal stacking order already puts
        this card on top since it comes later in the DOM with `relative`.
      */}
      <div className="hidden lg:block relative z-20 max-w-7xl mx-auto px-2 lg:px-8 mt-5 mb-6">
        <div className="rounded-lg bg-background  px-2 pt-7 pb-2">
          <div className="flex items-center justify-between mb-5">
            <h2>Nos categories</h2>
            <Link
              href="/shop"
              className="flex items-center gap-1.5 text-sm font-medium text-foreground/50 hover:text-gold transition-colors"
            >
              {t("view_all_categories", { defaultValue: "Voir toutes les catégories" })}
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="flex gap-7 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: "none" }}>
            {loading
              ? Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className="size-20 rounded-full bg-foreground/5 animate-pulse" />
                    <div className="h-3 w-14 rounded bg-foreground/5 animate-pulse" />
                  </div>
                ))
              : categories.map((cat) => {
                  const { Icon } = cat;
                  return (
                    <Link
                      key={cat.key}
                      href={cat.href}
                      onClick={() => setActive(cat.key)}
                      className="group flex flex-col items-center gap-2.5 flex-shrink-0"
                    >
                      <div
                        className={`size-15 rounded-full flex items-center justify-center overflow-hidden border transition-colors ${
                          active === cat.key
                            ? "border-gold/60 bg-gold/10"
                            : "border-foreground/10 bg-foreground/5 group-hover:border-gold/40"
                        }`}
                      >
                        {cat.image ? (
                          <AppImage src={cat.image} alt={cat.label || 'Catégorie'} fill className="object-cover" loading="lazy" sizes="60px" />
                        ) : (
                          <Icon size={26} className="text-foreground/60 group-hover:text-gold transition-colors" />
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                          active === cat.key ? "text-gold" : "text-foreground/70 group-hover:text-gold"
                        }`}
                      >
                        {cat.label}
                      </span>
                    </Link>
                  );
                })}
          </div>
        </div>
      </div>
    </>
  );
}