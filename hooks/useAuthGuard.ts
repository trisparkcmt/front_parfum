'use client';

/**
 * @file hooks/useAuthGuard.ts
 * @description Authentication-Based Route Protection Hook.
 *
 * This hook provides a centralized mechanism for securing pages that require 
 * authentication or specific user roles.
 * 
 * **Key Logic**:
 * - **Authentication Check**: Monitors the `isAuthenticated` state from `useAuthStore`.
 * - **Role Authorization**: (Optional) Validates if the current user possesses an allowed role (e.g., 'admin', 'partner').
 * - **Dynamic Redirection**: If the user is unauthorized, it automatically triggers a redirect to the `/login` page, preserving the original URL as a `redirect` query parameter for post-login return.
 * - **Hydration Safety**: Ensures that redirection only occurs on the client-side after the initial mount.
 * 
 * **Usage**: Applied in the `layout.tsx` of the dashboard or on specific protected page components.
 */
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/types';

export function useAuthGuard(allowedRoles?: UserRole[]) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, _hasHydrated } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Wait for hydration and avoid running during auth operations
    if (!_hasHydrated || isLoading) return;

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
