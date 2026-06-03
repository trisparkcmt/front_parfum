import Link from 'next/link';
import { Home, Watch, Droplets, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--t-nav-bg)]/5 backdrop-blur-lg border-t border-[var(--t-nav-border)] z-[100] md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
     {/* <nav className="sticky bottom-0 bg-white/5 backdrop-blur-md border-white/10 shadow-2xl backdrop-saturate-150"> */}
       <div className="flex justify-around items-center h-20">
        {/* Accueil */}
        <Link href="/" className='flex flex-col items-center gap-1 transition-colors text-foreground/70 active:text-gold'>
          <Home size={20} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Accueil</span>
        </Link>

        {/* Accessoires */}
        <Link href="/shop/accessories" className='flex flex-col items-center gap-1 transition-colors text-foreground/70 active:text-gold'>
          <Watch size={20} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Accessoires</span>
        </Link>

        {/* Parfumerie */}
        <Link href="/shop/perfumes" className='flex flex-col items-center gap-1 transition-colors text-foreground/70 active:text-gold'>
          <Droplets size={20} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Parfum</span>
        </Link>

        {/* Atelier */}
        <Link href="/numba" className='flex flex-col items-center gap-1 transition-colors text-foreground/70 active:text-gold'>
          <Sparkles size={20} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Atelier</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;

