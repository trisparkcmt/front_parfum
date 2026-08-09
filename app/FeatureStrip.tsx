"use client";

import { Truck, RotateCcw, Headphones, Medal } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function FeatureStrip() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith("en");

  const items = [
    {
      icon: Truck,
      title: isEn ? "Ultra fast delivery" : "Livraison ultra rapide",
      desc: isEn ? "Fast and secure shipping" : "Expédition rapide et sécurisée",
    },
    {
      icon: RotateCcw,
      title: isEn ? "Easy returns" : "Retours faciles",
      desc: isEn ? "30 days to change your mind" : "30 jours pour changer d’avis",
    },
    {
      icon: Headphones,
      title: isEn ? "24/7 Support" : "Support 24/7",
      desc: isEn ? "A dedicated team at your service" : "Une équipe à votre écoute",
    },
    {
      icon: Medal,
      title: isEn ? "Loyalty program" : "Programme de fidélité",
      desc: isEn ? "Earn loyalty points" : "Gagnez des points fidélité",
    },
  ];

  return (
    <section className="px-4 lg:px-10 pb-7 lg:pb-10">
      <div className="mx-auto max-w-7xl grid grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 lg:p-8">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-4">
            <div className="size-11 rounded-full bg-gold/10 text-gold flex items-center justify-center shrink-0">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs text-foreground/60">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}