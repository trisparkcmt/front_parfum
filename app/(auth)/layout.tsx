import Link from 'next/link';
import { Gem } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left side - Image/Branding */}
      <div className="hidden md:flex md:w-1/2 bg-charcoal relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-transparent to-transparent" />
        
        <div className="relative z-10 w-full p-12 flex flex-col justify-between h-full">
          <Link href="/" className="flex items-center gap-2 group w-fit">
            <Gem className="h-8 w-8 text-gold group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-display text-2xl font-bold tracking-tight text-white">
              <span className="text-gold">Accessories</span> Exclusif
            </span>
          </Link>

          <div>
            <h2 className="font-display text-4xl text-white font-bold mb-4">L'art de l'élégance.</h2>
            <p className="text-cream/70 text-lg max-w-md">
              Rejoignez notre espace membre exclusif pour accéder à vos créations sur mesure, sauvegarder vos envies et suivre vos commandes.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
