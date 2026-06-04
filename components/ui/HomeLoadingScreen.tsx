'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function HomeLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-gold/5">
      {/* Animated Background Elements */}
      <motion.div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-20 left-10 w-72 h-72 bg-gold/10 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl"
        />
      </motion.div>

      {/* Main Loading Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center gap-8"
      >
        {/* Logo Animation */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="flex items-center justify-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-2xl shadow-gold/30">
            <Sparkles size={40} className="text-black" />
          </div>
        </motion.div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2 font-display">
            Accessoires Exclusifs
          </h1>
          <p className="text-foreground/60 font-medium">
            Préparation de votre expérience...
          </p>
        </motion.div>

        {/* Animated Dots */}
        <motion.div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
              }}
              className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-gold to-gold-dark shadow-lg shadow-gold/50"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
