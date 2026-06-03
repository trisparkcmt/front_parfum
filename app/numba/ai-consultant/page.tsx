'use client';

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GeminiChat } from "@/components/perfume/GeminiChat";

export default function AiConsultantPage() {
  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-8 pt-24 lg:pt-32 min-h-screen relative">
      {/* Back Button */}
      <div className="absolute top-8 left-4 lg:left-0 z-20">
        <Link 
          href="/numba" 
          className="flex items-center gap-2 px-4 py-2 bg-[var(--t-input-bg)] backdrop-blur-md border border-[var(--t-border)] rounded-full text-[10px] uppercase tracking-widest text-foreground/60 hover:text-gold hover:border-gold/30 transition-all group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Retour
        </Link>
      </div>
      <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground text-center">
        Votre Sommelier <span className="text-gradient-gold">IA</span>
      </h1>
      <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-16 font-light leading-relaxed text-center">
        Décrivez votre personnalité, vos envies ou une occasion spéciale. Notre IA experte concevra la formule parfaite pour vous.
      </p>

      <div className="w-full">
        <GeminiChat />
      </div>
    </div>
  );
}


