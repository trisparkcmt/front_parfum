'use client';

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
