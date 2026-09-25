"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface FAQItem {
  q: string;
  a: string;
}

const faqData: { fr: FAQItem[]; en: FAQItem[] } = {
  fr: [
    {
      q: "Comment créer mon parfum sur mesure ?",
      a: "Rendez-vous dans notre atelier en ligne via la section « Créez votre parfum ». Vous choisissez vos essences, votre flacon et votre composition — notre équipe les assemble et vous les livre.",
    },
    {
      q: "Quels sont les délais de livraison ?",
      a: "Les livraisons sont généralement effectuées le jour même ou le lendemain si c'est un jour ouvré. Les commandes passées en dehors des jours ouvrés peuvent être traitées le premier jour ouvré suivant.",
    },
    {
      q: "Puis-je retourner un article ?",
      a: "Oui, vous disposez de 30 jours à compter de la réception pour retourner tout article non personnalisé dans son emballage d'origine. Les parfums sur mesure ne sont pas éligibles au retour.",
    },
    {
      q: "Comment fonctionne l'assistant IA ?",
      a: "Notre assistant IA analyse vos préférences olfactives, votre humeur et l'occasion pour vous recommander des parfums et compositions adaptés. Il est disponible 24h/24 et vous guide pas à pas.",
    },
    {
      q: "Proposez-vous des coffrets cadeaux ?",
      a: "Oui, nous proposons des coffrets cadeaux. Les livraisons se font généralement le jour même ou le lendemain si c’est un jour ouvré, selon le moment où la commande est passée.",
    },
  ],
  en: [
    {
      q: "How do I create a custom perfume?",
      a: "Head to our online atelier in the 'Create your perfume' section. You choose your essences, bottle, and composition — our team assembles everything and ships it to you.",
    },
    {
      q: "What are the delivery times?",
      a: "Deliveries are generally made the same day or the next day if it is a business day. Orders placed outside business days are usually processed on the next business day.",
    },
    {
      q: "Can I return an item?",
      a: "Yes, you have 30 days from receipt to return any non-personalised item in its original packaging. Custom-made perfumes are not eligible for returns.",
    },
    {
      q: "How does the AI assistant work?",
      a: "Our AI assistant analyses your scent preferences, mood, and occasion to recommend fitting perfumes and compositions. It's available 24/7 and guides you step by step.",
    },
    {
      q: "Do you offer gift sets?",
      a: "Yes, we offer gift sets. Deliveries are generally made the same day or the next day if it is a business day, depending on when the order is placed.",
    },
  ],
};

export default function HomeFAQ() {
  const { i18n, t } = useTranslation();
  const isEn = i18n.language?.startsWith("en");
  const items = isEn ? faqData.en : faqData.fr;

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section className="px-4 lg:px-10 py-14 lg:py-20">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10 lg:mb-14">
          <p className="text-[10px] tracking-[0.3em] uppercase text-gold mb-3">
            {t('faq_heading_prefix')}
          </p>
          <h2 className="font-display text-2xl lg:text-4xl font-bold text-foreground leading-tight">
            {t('faq_heading')}
          </h2>
          <p className="mt-3 text-sm text-foreground/50 max-w-md mx-auto">
            {t('faq_subtitle')}
          </p>
        </div>

        {/* Accordion */}
        <div className="divide-y divide-foreground/8 border border-foreground/10 rounded-2xl overflow-hidden bg-foreground/[0.02]">
          {items.map((item, i) => (
            <div key={i}>
              <button
                type="button"
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 lg:px-6 lg:py-5 text-left group"
                aria-expanded={openIndex === i}
              >
                <span className="text-sm lg:text-base font-medium text-foreground group-hover:text-gold transition-colors duration-200">
                  {item.q}
                </span>
                <motion.span
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="shrink-0 size-6 rounded-full bg-foreground/6 flex items-center justify-center text-foreground/40 group-hover:bg-gold/10 group-hover:text-gold transition-colors duration-200"
                >
                  <ChevronDown size={14} strokeWidth={2.5} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 lg:px-6 pb-4 lg:pb-5 text-sm text-foreground/60 leading-relaxed">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* CTA to AI */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <span className="text-sm text-foreground/50">
            {t('faq_still_questions')}
          </span>
          <Link
            href="/numba/ai-consultant"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold uppercase tracking-widest hover:bg-gold/20 hover:border-gold/50 transition-all duration-200"
          >
            <Sparkles size={13} strokeWidth={1.8} />
            {t('faq_ask_ai')}
          </Link>
        </div>
      </div>
    </section>
  );
}
