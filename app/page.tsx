'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Droplets, Watch } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-deep-black z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
          <div className="absolute inset-0 animate-pulse-gold opacity-30" />
          {/* Placeholder image that looks like luxury fashion/perfume */}
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-2/3 bg-[url('https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
              L'Élégance <br />
              <span className="text-gradient-gold">Sans Compromis</span>
            </h1>
            <p className="text-lg md:text-xl text-cream/80 mb-10 leading-relaxed font-light">
              Découvrez notre collection exclusive d'accessoires de luxe et plongez dans l'art de la haute parfumerie avec notre atelier de création sur mesure Numba.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/shop/accessories">
                <Button size="lg" className="w-full sm:w-auto">
                  Découvrir la Boutique
                </Button>
              </Link>
              <Link href="/numba">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto" rightIcon={<Sparkles size={18} />}>
                  Atelier Olfactif
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-cream dark:bg-deep-black transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">L'Expérience Exclusif</h2>
            <div className="h-1 w-20 bg-gold mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 rounded-2xl glass-dark border border-white/5 group bg-charcoal"
            >
              <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mb-6 text-gold group-hover:scale-110 transition-transform">
                <Watch size={28} />
              </div>
              <h3 className="text-xl font-bold text-cream mb-3">Accessoires d'Exception</h3>
              <p className="text-cream/60 leading-relaxed mb-6">
                Montres, bijoux et maroquinerie sélectionnés pour leur qualité irréprochable et leur design intemporel.
              </p>
              <Link href="/shop/accessories" className="inline-flex items-center text-gold font-medium hover:gap-2 transition-all">
                Explorer <ArrowRight size={16} className="ml-1" />
              </Link>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 rounded-2xl border border-gold/20 relative overflow-hidden group bg-gold/5 dark:bg-gold/10"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 text-gold scale-150 rotate-12">
                <Droplets size={100} />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gold text-deep-black flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-gold/30">
                  <Droplets size={28} />
                </div>
                <h3 className="text-xl font-bold text-deep-black dark:text-cream mb-3">Parfumerie & Dupes</h3>
                <p className="text-charcoal/70 dark:text-cream/70 leading-relaxed mb-6">
                  Les plus grandes fragrances mondiales et nos inspirations (dupes) premium créées par des maîtres parfumeurs.
                </p>
                <Link href="/shop/perfumes" className="inline-flex items-center text-deep-black dark:text-gold font-bold hover:gap-2 transition-all">
                  Découvrir <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 rounded-2xl glass-dark border border-white/5 group bg-charcoal"
            >
              <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mb-6 text-gold group-hover:scale-110 transition-transform">
                <Sparkles size={28} />
              </div>
              <h3 className="text-xl font-bold text-cream mb-3">Atelier Numba & IA</h3>
              <p className="text-cream/60 leading-relaxed mb-6">
                Créez votre parfum sur mesure avec l'aide de notre Sommelier IA ou composez-le vous-même avec nos essences rares.
              </p>
              <Link href="/numba" className="inline-flex items-center text-gold font-medium hover:gap-2 transition-all">
                Lancer l'expérience <ArrowRight size={16} className="ml-1" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
