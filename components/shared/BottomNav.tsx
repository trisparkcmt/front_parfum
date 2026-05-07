import Link from 'next/link';
import { Home, Watch, Droplets, Sparkles } from 'lucide-react';

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-deep-black/95 backdrop-blur-lg border-t border-white/5 z-[100] md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex justify-around items-center h-16">
        {/* Accueil */}
        <Link href="/" className='flex flex-col items-center gap-1 transition-colors text-white active:text-gold'>
          <Home size={20} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Accueil</span>
        </Link>

        {/* Accessoires */}
        <Link href="/shop/accessories" className='flex flex-col items-center gap-1 transition-colors text-white active:text-gold'>
          <Watch size={20} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Luxe</span>
        </Link>

        {/* Parfumerie */}
        <Link href="/shop/perfumes" className='flex flex-col items-center gap-1 transition-colors text-white active:text-gold'>
          <Droplets size={20} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Parfum</span>
        </Link>

        {/* Atelier */}
        <Link href="/numba" className='flex flex-col items-center gap-1 transition-colors text-white active:text-gold'>
          <Sparkles size={20} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Atelier</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;