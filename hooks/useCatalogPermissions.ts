'use client';

import { useAuthStore } from '@/store/useAuthStore';
import {
  getCatalogPermissions,
  type CatalogResource,
  type CatalogPermissions,
} from '@/lib/catalogPermissions';

export function useCatalogPermissions(resource: CatalogResource): CatalogPermissions {
  const { user, isAuthenticated } = useAuthStore();
  return getCatalogPermissions(resource, user?.role, isAuthenticated);
}
