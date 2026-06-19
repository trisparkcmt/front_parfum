import type { UserRole } from '@/types';

/** Catalogue resources aligned with backend permission classes. */
export type CatalogResource =
  | 'parfums'
  | 'accessoires'
  | 'flacons'
  | 'produits_essence'
  | 'essences'
  | 'ingredients'
  | 'lots_essence'
  | 'favoris'
  | 'notifications_catalogue'
  | 'mouvements_stock';

export interface CatalogPermissions {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

function isStaff(role?: UserRole | null) {
  return role === 'superadmin' || role === 'serveuse';
}

/**
 * Permission matrix from the Catalogue walkthrough.
 * Public GET resources are readable by everyone; writes require admin or serveuse.
 * Lab ingredients/lots and stock movements require staff.
 */
export function getCatalogPermissions(
  resource: CatalogResource,
  role?: UserRole | null,
  isAuthenticated = false
): CatalogPermissions {
  const staff = isStaff(role);

  switch (resource) {
    case 'parfums':
    case 'accessoires':
    case 'flacons':
    case 'produits_essence':
    case 'essences':
      return {
        canRead: true,
        canCreate: staff,
        canUpdate: staff,
        canDelete: staff,
      };

    case 'ingredients':
    case 'lots_essence':
    case 'notifications_catalogue':
      return {
        canRead: staff,
        canCreate: staff,
        canUpdate: staff,
        canDelete: staff,
      };

    case 'mouvements_stock':
      return {
        canRead: staff,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      };

    case 'favoris':
      return {
        canRead: isAuthenticated,
        canCreate: isAuthenticated,
        canUpdate: false,
        canDelete: isAuthenticated,
      };

    default:
      return {
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      };
  }
}
