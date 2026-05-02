'use client';

import Link from 'next/link';
import { Gem, Camera, Globe, MessageCircle, Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-deep-black text-cream/70 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Gem className="h-7 w-7 text-gold" />
              <span className="font-display text-lg font-bold">
                <span className="text-gold">Accessories</span>{' '}
                <span className="text-cream">Exclusif</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-cream/50">
              Votre destination luxe pour accessoires premium et parfums d&apos;exception.
              Découvrez l&apos;atelier Numba et créez votre signature olfactive.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-gold/10 hover:text-gold transition-colors" aria-label="Instagram">
                <Camera size={18} />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-gold/10 hover:text-gold transition-colors" aria-label="Facebook">
                <Globe size={18} />
              </a>
              <a href="https://wa.me/237680254243" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-gold/10 hover:text-gold transition-colors">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-display text-sm font-semibold text-cream mb-4 uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-3">
              {[
                { label: 'Accueil', href: '/' },
                { label: 'Accessoires', href: '/shop/accessories' },
                { label: 'Parfumerie', href: '/shop/perfumes' },
                { label: 'Atelier Numba', href: '/numba' },
                { label: 'Mon Panier', href: '/cart' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display text-sm font-semibold text-cream mb-4 uppercase tracking-wider">Services</h4>
            <ul className="space-y-3">
              {[
                'Parfums de Marque',
                'Dupes Premium',
                'Créations Numba',
                'Parfum sur Mesure',
                'Sommelier IA',
              ].map((item) => (
                <li key={item} className="text-sm">{item}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-sm font-semibold text-cream mb-4 uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-gold" />
                +237 680 254 243
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-gold" />
                contact@accessoiresexclusif.cm
              </li>
              <li className="flex items-start gap-2 text-sm">
                <MapPin size={14} className="text-gold mt-0.5" />
                Douala, Cameroun
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cream/30">
            © {new Date().getFullYear()} Accessories Exclusif. Tous droits réservés.
          </p>
          <p className="text-xs text-cream/30">
            Fait avec ✨ au Cameroun
          </p>
        </div>
      </div>
    </footer>
  );
}
