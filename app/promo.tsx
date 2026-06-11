"use client";

import { motion } from "framer-motion";
import { ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "@/store/useThemeStore";
import { useEffect, useState } from 'react';
import { shopService } from "@/services/apiService";

export default function PromoSection() {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const [promoItem, setPromoItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const fetchPromotions = async () => {
      try {
        const [perfumeCategoriesRes, accessoryTypesRes] = await Promise.all([
          shopService.getPerfumeCategories(),
          shopService.getAccessoryTypes()
        ]);

        // Handle potentially paginated data (DRF standard)
        const perfumeCategories = Array.isArray(perfumeCategoriesRes) ? perfumeCategoriesRes : (perfumeCategoriesRes.results || perfumeCategoriesRes.resultats || []);
        const accessoryTypes = Array.isArray(accessoryTypesRes) ? accessoryTypesRes : (accessoryTypesRes.results || accessoryTypesRes.resultats || []);

        const allItems = [
          ...perfumeCategories.map((c: any) => ({ ...c, link: `/shop/perfumes?category=${c.id}` })),
          ...accessoryTypes.map((t: any) => ({ ...t, link: `/shop/accessories?type=${t.id}` }))
        ];

        // Revert to the simplified detection logic as requested
        const foundPromo = allItems.find(item => parseFloat(item.taux_reduction) > 0);
        setPromoItem(foundPromo || null);
      } catch (error) {
        console.error('Failed to fetch promotional data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  return (
    <section className="relative h-[80vh] w-full flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
        style={{
          backgroundImage: `url('${theme === 'light' ? '/promo2.png' : '/promo.png'}')`,
        }}
      />

      {/* Overlay */}
      {/* <div className="absolute inset-0 bg-gradient-to-r from-deep-black via-deep-black/60 to-transparent z-10" /> */}
      <div className="absolute inset-0 bg-black/20 z-10" />

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest mb-6">
              <Tag size={14} />
              {t('exclusive_offer')}
            </div>

            <h2 className="font-display text-5xl md:text-7xl font-bold text-foreground leading-tight mb-6">
              {promoItem ? (
                <>{promoItem.nom || promoItem.nom_type} <span className="text-gradient-gold block">-{parseFloat(promoItem.taux_reduction)}%</span></>
              ) : (
                t('privilege_title').split(' ').map((word, i) => (
                  word === 'Privilège' || word === 'Privilege' ? <span key={i} className="text-gradient-gold block">{word}</span> : <span key={i}>{word} </span>
                ))
              )}
            </h2>

            <p className="text-lg md:text-xl text-foreground/80 mb-10 leading-relaxed font-light">
              {promoItem ? (
                promoItem.description && promoItem.description.trim() !== '' ?
                  promoItem.description :
                  t('promo_generic_description', { name: promoItem.nom || promoItem.nom_type, discount: parseFloat(promoItem.taux_reduction) })
              ) : (
                t('privilege_subtitle')
              )}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href={promoItem?.link || "/numba/atelier"}>
                <Button size="md" className="md:w-auto min-w-[200px]">
                  {t('create_my_perfume')}
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute bottom-0 right-0 p-12 opacity-10 pointer-events-none hidden lg:block">
        <Tag size={300} className="text-foreground -rotate-12" />
      </div>
    </section>
  );
}
