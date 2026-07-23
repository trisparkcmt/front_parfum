'use client';

/**
 * @file components/ui/DiffuseurCard.tsx
 * @description Luxury product card designed exclusively for the Diffuseurs catalog.
 */
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Wifi, Zap, Flame, Droplets } from 'lucide-react';
import type { Product } from '@/types';

/* ── Tech badge config ── */
const TECH_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  ultrasons: {
    label: 'Ultrasons',
    icon: <Droplets size={11} strokeWidth={2} />,
    color: '#8fbc8f',
  },
  nebulisation: {
    label: 'Nébulisation',
    icon: <Zap size={11} strokeWidth={2} />,
    color: '#8fbc8f',
  },
  chaleur: {
    label: 'Chaleur douce',
    icon: <Flame size={11} strokeWidth={2} />,
    color: '#8fbc8f',
  },
  connecte: {
    label: 'Connecté',
    icon: <Wifi size={11} strokeWidth={2} />,
    color: '#8fbc8f',
  },
};

function getTechBadge(type?: string) {
  if (!type || type === 'all') return null;
  const config = TECH_CONFIG[type.toLowerCase()];
  if (!config) return null;
  return config;
}

function formatPrice(price: number | string | undefined): string {
  if (price === undefined || price === null) return '—';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

interface DiffuseurCardProps {
  product: Product;
  index?: number;
}

export function DiffuseurCard({ product, index = 0 }: DiffuseurCardProps) {
  const tech = getTechBadge(product.type_technologie);
  const isNew = product.is_new || product.est_nouveau;
  const isBestseller = product.is_bestseller || product.est_bestseller;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1] as const,
      }}
    >
      <Link
        href={`/shop/diffuseurs/${product.slug || product.id}`}
        className="group block bg-[#141414] border border-[rgba(201,169,110,0.12)] rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1.5 hover:border-[rgba(201,169,110,0.25)] hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5),0_0_40px_-10px_rgba(201,169,110,0.1)]"
      >
        {/* ── Image ── */}
        <div className="relative aspect-[4/5] bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] overflow-hidden">
          {product.image_principale || product.images?.[0] ? (
            <Image
              src={product.image_principale || product.images[0]}
              alt={product.nom || product.name || 'Diffuseur'}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.06]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#333"
                strokeWidth="1"
              >
                <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
              </svg>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Tag */}
          {(isNew || isBestseller) && (
            <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-lg bg-[rgba(10,10,10,0.7)] backdrop-blur-md border border-[rgba(201,169,110,0.15)] text-[10px] font-medium tracking-[0.08em] uppercase text-[#c9a96e]">
              {isNew ? 'Nouveau' : 'Best-seller'}
            </span>
          )}

          {/* Quick action on hover */}
          <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
            <span className="block w-full text-center py-2.5 rounded-xl bg-[#c9a96e] text-[#0a0a0a] text-[12px] font-semibold tracking-wide">
              Voir le produit
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-5">
          <h3 className="font-serif text-[17px] font-medium leading-snug text-[#f5f0e8] mb-1.5 line-clamp-1">
            {product.nom || product.name || 'Diffuseur'}
          </h3>

          <p className="text-[12px] text-[#57534e] leading-relaxed mb-4 line-clamp-2">
            {product.description_courte || product.description || ''}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-[18px] font-semibold text-[#c9a96e] font-variant-numeric tabular-nums">
              {formatPrice(product.prix_unitaire || product.price)}
              <span className="text-[12px] font-normal text-[#57534e] ml-0.5">€</span>
            </span>

            {tech && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a2e1a] border border-[#2a4a2a] text-[10px] font-medium tracking-[0.05em] uppercase" style={{ color: tech.color }}>
                {tech.icon}
                {tech.label}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
