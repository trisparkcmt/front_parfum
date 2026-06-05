'use client';

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GeminiChat } from "@/components/perfume/GeminiChat";

export default function AiConsultantPage() {
  const [chatStarted, setChatStarted] = useState(false);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 relative h-screen overflow-hidden pt-24 lg:pt-32">
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

      {/* {!chatStarted && (
        <div className="text-center mb-8 flex-shrink-0">
          <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-4">
            Votre Sommelier <span className="text-gradient-gold">IA</span>
          </h1>
          <p className="text-sm md:text-base text-foreground/70 max-w-2xl mx-auto font-light leading-relaxed">
            Décrivez votre personnalité, vos envies ou une occasion spéciale. Notre IA experte concevra la formule parfaite pour vous.
          </p>
        </div>
      )} */}

      {/* Chat container expands to full height when chat starts */}
      <div className="w-full flex-1 min-h-0">
        <GeminiChat onChatStarted={setChatStarted} />
      </div>
    </div>
  );
}
