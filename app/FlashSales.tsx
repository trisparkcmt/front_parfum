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

const GENDERLESS_COUNTS_AS_BOTH = true;

export default function FlashSales() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith("en");

  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [hotsellers, setHotsellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FlashTab>("all");

  const { addProduct } = useCartStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { addToast } = useToastStore();

  const tabs: { key: FlashTab; label: string }[] = [
    { key: "all", label: isEn ? "All" : "Tout" },
    { key: "newest", label: isEn ? "New Arrivals" : "Nouveautés" },
    { key: "popular", label: isEn ? "Popular" : "Populaire" },
    { key: "men", label: isEn ? "Men" : "Homme" },
    { key: "women", label: isEn ? "Women" : "Femme" },
  ];

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const [fetchedBestsellers, fetchedHotsellers] = await Promise.all([
          productService.getBestsellerPerfumes().catch(() => []),
          productService.getHotsellerPerfumes().catch(() => []),
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

  const matchesGender = (product: Product, target: "masculine" | "feminine") => {
    if (!product.gender) return GENDERLESS_COUNTS_AS_BOTH;
    return product.gender === target || product.gender === "unisex";
  };

  const interleavedAll = useMemo(() => {
    const seen = new Set<string>();
    const result: Product[] = [];
    const maxLen = Math.max(bestsellers.length, hotsellers.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < hotsellers.length && !seen.has(hotsellers[i].id)) {
        seen.add(hotsellers[i].id);
        result.push(hotsellers[i]);
      }
      if (i < bestsellers.length && !seen.has(bestsellers[i].id)) {
        seen.add(bestsellers[i].id);
        result.push(bestsellers[i]);
      }
    }
    return result;
  }, [bestsellers, hotsellers]);

  const visibleProducts = useMemo(() => {
    switch (activeTab) {
      case "newest":
        return hotsellers;
      case "popular":
        return bestsellers;
      case "men":
        return interleavedAll.filter((p) => matchesGender(p, "masculine"));
      case "women":
        return interleavedAll.filter((p) => matchesGender(p, "feminine"));
      case "all":
      default:
        return interleavedAll;
    }
  }, [activeTab, interleavedAll, bestsellers, hotsellers]);

  const handleAddToCart = (product: Product) => {
    addProduct(product, 1);
  };

  const handleToggleFavorite = (product: Product) => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
    } else {
      addFavorite(product);
      addToast(
        `${product.name} ${isEn ? "added to favorites" : "ajouté aux favoris"}`,
        "info"
      );
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5 md:mb-6">
        <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">
          {isEn ? "Flash Sales" : "Ventes flash"}
        </h2>

        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
          style={{ scrollbarWidth: "none" }}
        >
          {tabs.map((tab) => (
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
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : visibleProducts.length === 0 ? (
          <p className="col-span-full text-center text-sm text-foreground/50 py-10">
            {isEn
              ? "No products available in this category at the moment."
              : "Aucun produit dans cette catégorie pour le moment."}
          </p>
        ) : (
          visibleProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04 }}
              className="min-w-0"
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