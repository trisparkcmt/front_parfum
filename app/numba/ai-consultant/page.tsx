import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GeminiChat } from '@/components/perfume/GeminiChat';

export default function AiConsultantPage() {
  return (
    <div className="min-h-[85vh] bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/numba" className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-gold mb-8 transition-colors">
          <ArrowLeft size={16} /> Retour à l'accueil Numba
        </Link>
        
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold mb-4">Le Sommelier IA</h1>
          <p className="text-foreground/60 max-w-xl mx-auto">
            Confiez vos envies à notre intelligence artificielle experte en parfumerie. Elle analysera vos préférences pour créer une formule unique sur mesure.
          </p>
        </div>

        <GeminiChat />
      </div>
    </div>
  );
}
