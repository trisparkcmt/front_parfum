"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { productService } from "@/services/productService";
import { Product } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useToastStore } from "@/store/useToastStore";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeletons";

type FlashTab = "all" | "newest" | "popular" | "men" | "women";

const TAB_KEYS: { key: FlashTab; labelKey: string; defaultLabel: string }[] = [
  { key: "all", labelKey: "flash_tab_all", defaultLabel: "Tout" },
  { key: "newest", labelKey: "flash_tab_newest", defaultLabel: "Nouveautés" },
  { key: "popular", labelKey: "flash_tab_popular", defaultLabel: "Populaire" },
  { key: "men", labelKey: "flash_tab_men", defaultLabel: "Homme" },
  { key: "women", labelKey: "flash_tab_women", defaultLabel: "Femme" },
];

/**
 * Flash Sales.
 *
 * Replaces the old separate Bestsellers / Hotsellers sections with one
 * unified section and a tab bar:
 *
 * - All     → bestsellers ∪ hotsellers, deduped by id
 * - Newest  → hotsellers only (your "trending now" endpoint)
 * - Popular → bestsellers only
 * - Men     → from the All set, gender is 'masculine' OR 'unisex'
 * - Women   → from the All set, gender is 'feminine' OR 'unisex'
 *
 * Scope note (confirmed with Darren): this stays perfume-only for now.
 * getBestsellerPerfumes()/getHotsellerPerfumes() are the only endpoints
 * that expose bestseller/hotseller status — accessories have no
 * equivalent filter yet, so they're intentionally excluded until a
 * backend filter exists. Perfumes with no `gender` set are excluded
 * from Men/Women (this shouldn't happen for perfumes, but accessories
 * would hit this path too if they're ever added back in — see the
 * GENDERLESS_COUNTS_AS_BOTH rule below).
 *
 * Products with NO gender set (would apply to accessories if/when
 * added) count as belonging to BOTH Men and Women, per Darren's call —
 * not unisex-only, but a "no signal, show everywhere" rule.
 */
const GENDERLESS_COUNTS_AS_BOTH = true;

export default function FlashSales() {
  const { t } = useTranslation();
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [hotsellers, setHotsellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FlashTab>("all");

  const { addProduct } = useCartStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const [fetchedBestsellers, fetchedHotsellers] = await Promise.all([
          productService.getBestsellerPerfumes().catch((err) => {
            console.error("[FlashSales] Bestsellers fetch failed:", err);
            return [];
          }),
          productService.getHotsellerPerfumes().catch((err) => {
            console.error("[FlashSales] Hotsellers fetch failed:", err);
            return [];
          }),
        ]);
        if (active) {
          setBestsellers(fetchedBestsellers);
          setHotsellers(fetchedHotsellers);
        }
      } catch (error) {
        console.error("[FlashSales] Failed to fetch products:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, []);

  // "All" = bestsellers ∪ hotsellers, deduped by id (a product can be both).
  const allItems = useMemo(() => {
    const map = new Map<string, Product>();
    [...bestsellers, ...hotsellers].forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [bestsellers, hotsellers]);

  const matchesGender = (product: Product, target: "masculine" | "feminine") => {
    if (!product.gender) return GENDERLESS_COUNTS_AS_BOTH;
    return product.gender === target || product.gender === "unisex";
  };

  const visibleProducts = useMemo(() => {
    switch (activeTab) {
      case "newest":
        return hotsellers;
      case "popular":
        return bestsellers;
      case "men":
        return allItems.filter((p) => matchesGender(p, "masculine"));
      case "women":
        return allItems.filter((p) => matchesGender(p, "feminine"));
      case "all":
      default:
        return allItems;
    }
  }, [activeTab, allItems, bestsellers, hotsellers]);

  const handleAddToCart = (product: Product) => {
    addProduct(product, 1);
    addToast(`${product.name} ${t("added_to_cart")}`);
  };

  const handleToggleFavorite = (product: Product) => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
    } else {
      addFavorite(product);
      addToast(`${product.name} ${t("added_to_favorites")}`, "info");
    }
  };

  if (!loading && allItems.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5 md:mb-6">
        <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">
          {t("flash_sales_title", { defaultValue: "Ventes flash" })}
        </h2>

        {/* Tab bar: All / Newest / Popular / Men / Women */}
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
          style={{ scrollbarWidth: "none" }}
        >
          {TAB_KEYS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-4 h-9 flex items-center rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-gold/15 border-gold/40 text-gold"
                  : "bg-foreground/5 border-foreground/10 text-foreground/70 hover:border-gold/30 hover:text-gold"
              }`}
            >
              {t(tab.labelKey, { defaultValue: tab.defaultLabel })}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : visibleProducts.length === 0 ? (
          <p className="col-span-full text-center text-sm text-foreground/50 py-10">
            {t("flash_sales_empty", { defaultValue: "Aucun produit dans cette catégorie pour le moment." })}
          </p>
        ) : (
          visibleProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04 }}
            >
              <ProductCard
                product={product}
                onAddToCart={handleAddToCart}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite(product.id)}
              />
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}