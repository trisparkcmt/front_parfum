'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/types';

export function useAuthGuard(allowedRoles?: UserRole[]) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Avoid running on server or during initial hydration
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      setIsAuthorized(false);
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Rediriger vers l'accueil si le rôle n'est pas autorisé
      router.replace('/');
      setIsAuthorized(false);
      return;
    }

    setIsAuthorized(true);
  }, [isAuthenticated, isLoading, user, allowedRoles, router, pathname]);

  return { isAuthorized, isLoading: isLoading || isAuthorized === null };
}
