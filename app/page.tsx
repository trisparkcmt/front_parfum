'use client';

import { useState, useEffect } from 'react';
import HomeLoadingScreen from '@/components/ui/HomeLoadingScreen';
import HomeHeader from './HomeHeader';
import PromoCarousel from './PromoCarousel';
import CategoryPills from './CategoryPills';
import FlashSales from './FlashSales';
import ShopByCategory from './ShopByCategory';
import DualPromoBanners from './DualPromoBanners';
import FeatureStrip from './FeatureStrip';
import NewsletterBanner from './NewsletterBanner';
import EditorialQuote from './EditorialQuote';
import WelcomeMessage from './WelcomeMessage';
import StoreSection from './StoreSection';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <HomeLoadingScreen />;

  return (
    <div className="flex flex-col w-full">
      <h1 className="sr-only">Accessoires Exclusifs | Luxe & Création de Parfums</h1>
      <HomeHeader />

      {/* HERO */}
      <PromoCarousel />

      {/* Floating category pills row (like the reference) */}
      {/* <section className="md:hidden relative -mt-8 lg:-mt-14 z-10 px-4 lg:px-10">
        <div className="mx-auto max-w-7xl rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)]">
          <CategoryPills />
        </div>
      </section> */}

       {/* WELCOME MESSAGE */}
      <section className="block">   
        <WelcomeMessage />
      </section>
      {/* CATEGORY PILLS */}
      <section className="block lg:hidden">
      <CategoryPills />
      </section>
          
     

      {/* SHOP BY CATEGORY */}
      <section className="md:block hidden">   
        <ShopByCategory />
      </section>
      

      

      {/* BEST SELLERS / FLASH */}
      <FlashSales />

      {/* DUAL PROMO BANNERS */}
      <section className="hidden lg:block">   
        <DualPromoBanners />
      </section>

      <section className="block ">   
        {/* EDITORIAL / BRAND STATEMENT */}
      <EditorialQuote />
      </section>
      

      {/* TRUST FEATURES */}
      <FeatureStrip />

      {/* NEWSLETTER */}
      <NewsletterBanner />

      {/* STORE LOCATION */}
      <StoreSection />
    </div>
  );
}
