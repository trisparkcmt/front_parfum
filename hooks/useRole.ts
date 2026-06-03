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

  const hasRole = (role: UserRole) => {
    return isAuthenticated && user?.role === role;
  };

  const isAnyOf = (roles: UserRole[]) => {
    return isAuthenticated && !!user && roles.includes(user.role);
  };

  return {
    user,
    role: user?.role,
    isAuthenticated,
    isLoading,
    hasRole,
    isAnyOf,
    isAdmin: hasRole('admin'),
    isClient: hasRole('client'),
    isPartner: hasRole('partner'),
    isDelivery: hasRole('delivery'),
  };
}
