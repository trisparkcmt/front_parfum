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
      a: "Les commandes standard sont livrées sous 2 à 5 jours ouvrés. Les créations sur mesure nécessitent un délai supplémentaire de 2 à 3 jours pour la fabrication.",
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
      q: "Les paiements sont-ils sécurisés ?",
      a: "Oui, toutes les transactions sont chiffrées via SSL et traitées par des prestataires de paiement certifiés. Vos données bancaires ne sont jamais stockées sur nos serveurs.",
    },
    {
      q: "Proposez-vous des coffrets cadeaux ?",
      a: "Absolument. Vous pouvez ajouter un emballage cadeau personnalisé à n'importe quelle commande depuis le panier. Un message manuscrit peut également être inclus.",
    },
  ],
  en: [
    {
      q: "How do I create a custom perfume?",
      a: "Head to our online atelier in the 'Create your perfume' section. You choose your essences, bottle, and composition — our team assembles everything and ships it to you.",
    },
    {
      q: "What are the delivery times?",
      a: "Standard orders are delivered within 2 to 5 business days. Custom creations require an additional 2 to 3 days for production.",
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
      q: "Are payments secure?",
      a: "Yes, all transactions are SSL-encrypted and processed by certified payment providers. Your banking details are never stored on our servers.",
    },
    {
      q: "Do you offer gift sets?",
      a: "Absolutely. You can add personalised gift wrapping to any order directly from the cart. A handwritten message can also be included.",
    },
  ],
};

export default function HomeFAQ() {
  const { i18n } = useTranslation();
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
            {isEn ? "Got questions?" : "Des questions ?"}
          </p>
          <h2 className="font-display text-2xl lg:text-4xl font-bold text-foreground leading-tight">
            {isEn ? "Frequently asked questions" : "Questions fréquentes"}
          </h2>
          <p className="mt-3 text-sm text-foreground/50 max-w-md mx-auto">
            {isEn
              ? "Can't find your answer? Our AI assistant is always here to help."
              : "Vous ne trouvez pas votre réponse ? Notre assistant IA est là pour vous."}
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
            {isEn ? "Still have questions?" : "Encore des questions ?"}
          </span>
          <Link
            href="/numba/ai-consultant"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold uppercase tracking-widest hover:bg-gold/20 hover:border-gold/50 transition-all duration-200"
          >
            <Sparkles size={13} strokeWidth={1.8} />
            {isEn ? "Ask our AI" : "Demander à notre IA"}
          </Link>
        </div>
      </div>
    </section>
  );
}
