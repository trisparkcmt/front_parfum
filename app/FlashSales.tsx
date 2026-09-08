"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { productService } from "@/services/productService";
import { Product, ProduitFiniEssence } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useToastStore } from "@/store/useToastStore";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeletons";
import { EssenceSizePickerModal } from "@/components/ui/EssenceSizePickerModal";

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

  const [selectedEssence, setSelectedEssence] = useState<Product | null>(null);
  const [essenceLoading, setEssenceLoading] = useState(false);

  const handleAddToCart = async (product: Product) => {
    if (
      product.category === 'huile' ||
      product.category === 'produit-fini-essence' ||
      product.taille_ml !== undefined
    ) {
      // If we already have the formats loaded, open directly
      if (product.produits_finis && product.produits_finis.length > 0) {
        setSelectedEssence(product);
        return;
      }
      // Otherwise fetch the full essence (including produits_finis) first
      setEssenceLoading(true);
      try {
        const fullProduct = await productService.getProductById(product.essence_id ? String(product.essence_id) : product.id);
        setSelectedEssence(fullProduct ?? product);
      } catch {
        setSelectedEssence(product);
      } finally {
        setEssenceLoading(false);
      }
      return;
    }
    addProduct(product, 1);
    import('@/lib/gtag').then(({ trackAddToCart }) => {
      trackAddToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category ?? 'Produit',
        quantity: 1,
      });
    });
  };

  const handleConfirmEssenceSize = async (essence: Product, items: { variant: ProduitFiniEssence; quantity: number }[]) => {
    for (const item of items) {
      const { variant, quantity } = item;
      const cartProduct: Product = {
        id: String(variant.id),
        name: `${essence.name} - ${variant.taille_ml}ml`,
        description: essence.description || '',
        price: variant.prix_actuel,
        originalPrice: variant.prix_promotionnel ? parseFloat(variant.prix_promotionnel) : undefined,
        taux_reduction:
          variant.prix_promotionnel && parseFloat(variant.prix_promotionnel) > variant.prix_actuel
            ? String(Math.round((1 - variant.prix_actuel / parseFloat(variant.prix_promotionnel)) * 100))
            : undefined,
        category: 'huile',
        images: essence.images,
        brand: essence.brand,
        inStock: true,
        volume: `${variant.taille_ml}ml`,
        taille_ml: variant.taille_ml,
        stock_total_ml: essence.stock_total_ml,
        essence_id: Number(essence.id),
        createdAt: new Date().toISOString(),
      };

      await addProduct(cartProduct, quantity);
      import('@/lib/gtag').then(({ trackAddToCart }) => {
        trackAddToCart({
          id: cartProduct.id,
          name: cartProduct.name,
          price: cartProduct.price,
          category: 'Huile',
          quantity,
        });
      }).catch(() => {});
    }

    const totalCount = items.reduce((s, it) => s + it.quantity, 0);
    addToast(
      `${essence.name} (${totalCount} flacon${totalCount > 1 ? 's' : ''}) ${isEn ? 'added to cart' : 'ajouté au panier'}`,
      'success'
    );
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

      {essenceLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-background border border-white/10 px-6 py-4 shadow-2xl">
            <svg className="animate-spin h-5 w-5 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-sm font-semibold text-foreground/80 uppercase tracking-widest">
              {isEn ? 'Loading formats…' : 'Chargement des formats…'}
            </span>
          </div>
        </div>
      )}

      {selectedEssence && (
        <EssenceSizePickerModal
          product={selectedEssence}
          onConfirm={handleConfirmEssenceSize}
          onClose={() => setSelectedEssence(null)}
        />
      )}
    </section>
  );
}