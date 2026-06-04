import Link from 'next/link';
import { Home, Watch, Droplets, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const BottomNav = () => {
  return (
    <nav
      className="fixed bottom-5 left-4 right-4 bg-[var(--t-nav-bg)]/95 backdrop-blur-xl border border-[var(--t-nav-border)]/50 z-[100] md:hidden shadow-2xl rounded-3xl"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0px)' }}
    >
      <div className="flex justify-around items-center h-15 px-1 py-2">
        {/* Accueil */}
        <Link
          href="/"
          className="flex flex-col items-center gap-1 transition-all text-foreground/70 hover:text-gold active:text-gold hover:scale-110 duration-200"
        >
          <Home size={22} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Accueil</span>
        </Link>

        {/* Accessoires */}
        <Link
          href="/shop/accessories"
          className="flex flex-col items-center gap-1 transition-all text-foreground/70 hover:text-gold active:text-gold hover:scale-110 duration-200"
        >
          <Watch size={22} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Accessoires</span>
        </Link>

        {/* Parfumerie */}
        <Link
          href="/shop/perfumes"
          className="flex flex-col items-center gap-1 transition-all text-foreground/70 hover:text-gold active:text-gold hover:scale-110 duration-200"
        >
          <Droplets size={22} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Parfum</span>
        </Link>

        {/* Atelier */}
        <Link
          href="/numba"
          className="flex flex-col items-center gap-1 transition-all text-foreground/70 hover:text-gold active:text-gold hover:scale-110 duration-200"
        >
          <Sparkles size={22} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Atelier</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;

