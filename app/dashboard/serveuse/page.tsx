'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ServeuseEntryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/serveuse/dashboard');
  }, [router]);

  return null;
}
