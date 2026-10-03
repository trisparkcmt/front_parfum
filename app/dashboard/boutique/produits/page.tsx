'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BoutiqueProduitsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/boutique/perfume');
  }, [router]);

  return null;
}
