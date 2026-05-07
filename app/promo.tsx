"use client";

import { motion } from "framer-motion";
import { ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function PromoSection() {
  return (
    <section className="relative h-[80vh] w-full flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
        style={{ 
          backgroundImage: "url('/promo.png')",  
        }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-deep-black via-deep-black/60 to-transparent z-10" />
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
              Offre Exclusive
            </div>
            
            <h2 className="font-display text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
              L'Essence du <br />
              <span className="text-gradient-gold">Privilège</span>
            </h2>
            
            <p className="text-lg md:text-xl text-cream/80 mb-10 leading-relaxed font-light">
              Profitez d'une remise exceptionnelle de <span className="text-gold font-bold">20%</span> sur votre première création personnalisée Numba avec le code <span className="px-2 py-1 bg-white/10 rounded font-mono text-white">LUXE20</span>.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/numba/atelier">
                <Button size="md" className="md:w-auto min-w-[200px]">
                  Créer mon Parfum
                  <ArrowRight className="ml-2 size-5" />
                </Button> 
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute bottom-0 right-0 p-12 opacity-10 pointer-events-none hidden lg:block">
        <Tag size={300} className="text-white -rotate-12" />
      </div>
    </section>
  );
}