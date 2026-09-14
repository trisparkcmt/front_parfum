'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientRedirect({ fallback }: { fallback: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(fallback);
  }, [fallback, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
    </div>
  );
}
