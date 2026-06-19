'use client';

/**
 * @file hooks/useRole.ts
 * @description Role-Based Authorization Utility Hook.
 *
 * This hook provides a convenient interface for checking the current user's 
 * role and authentication status across the application.
 * 
 * **Functionalities**:
 * - **`hasRole(role)`**: Checks if the user is authenticated and possesses a specific `UserRole`.
 * - **`isAnyOf(roles)`**: Validates if the user's role matches any in the provided array.
 * - **Convenience Flags**: Provides pre-computed booleans like `isAdmin`, `isClient`, `isPartner`, and `isDelivery`.
 * - **State Passthrough**: Returns `user`, `isAuthenticated`, and `isLoading` from the `useAuthStore`.
 * 
 * **Usage**: Used in components to conditionally render UI elements based on the logged-in user's capabilities.
 */
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/types';

export function useRole() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const roles = user?.roles || (user?.role ? [user.role] : []);

  const hasRole = (role: UserRole) => {
    return isAuthenticated && roles.includes(role);
  };

  const isAnyOf = (roles: UserRole[]) => {
    return isAuthenticated && !!user && roles.some((role) => hasRole(role));
  };

  return {
    user,
    role: user?.role,
    roles,
    isAuthenticated,
    isLoading,
    hasRole,
    isAnyOf,
    isAdmin: hasRole('superadmin'),
    isServeuse: hasRole('serveuse'),
    isClient: hasRole('client'),
    isPartner: hasRole('partner'),
    isDelivery: hasRole('delivery'),
    isStaff: isAuthenticated && (hasRole('superadmin') || hasRole('serveuse')),
  };
}
