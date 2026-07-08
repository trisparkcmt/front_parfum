'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShopRedirectClient() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/shop/perfumes');
  }, [router]);

  return null;
}
