'use client';

import { Metadata } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Boutique',
  description: 'Découvrez les parfums de marque, les dupes et les accessoires de luxe sur Accessoires Exclusifs.',
  alternates: {
    canonical: 'https://accessoires-exclusifs.vercel.app/shop',
  },
};

export default function ShopPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/shop/perfumes');
  }, [router]);

  return null;
}
