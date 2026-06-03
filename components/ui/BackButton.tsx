'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  className?: string;
  label?: string;
}

export function BackButton({ className, label = "Retour" }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={cn(
        "flex items-center gap-2 text-foreground/60 hover:text-gold transition-colors group mb-6",
        className
      )}
    >
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gold/10 group-hover:scale-110 transition-all">
        <ArrowLeft size={18} />
      </div>
      <span className="text-sm font-medium uppercase tracking-widest">{label}</span>
    </button>
  );
}


