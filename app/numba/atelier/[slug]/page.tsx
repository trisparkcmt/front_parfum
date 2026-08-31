'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * /numba/atelier/composition-{id}
 *
 * When someone opens a shared composition link we redirect them straight to
 * the atelier with `?composition={id}` so the full builder loads with the
 * shared composition pre-filled.  The atelier page already handles that query
 * param (loadPrefilledComposition effect).
 */
export default function CompositionShareRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  useEffect(() => {
    // slug is like "composition-42" — extract the numeric id
    const compositionId = slug?.replace('composition-', '');
    if (compositionId && /^\d+$/.test(compositionId)) {
      router.replace(`/numba/atelier?composition=${compositionId}`);
    } else {
      // Malformed slug — just go to atelier
      router.replace('/numba/atelier');
    }
  }, [slug, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 size={28} className="animate-spin text-gold" />
      <p className="text-sm text-foreground/50 tracking-widest uppercase">
        Ouverture de l&apos;atelier…
      </p>
    </div>
  );
}
