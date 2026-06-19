import type { UserRole } from '@/types';

const ROLE_ALIAS: Record<string, UserRole> = {
  client: 'client',
  superadmin: 'superadmin',
  admin: 'superadmin',
  serveuse: 'serveuse',
  prestataire: 'partner',
  partner: 'partner',
  livreur: 'delivery',
  delivery: 'delivery',
};

const ROLE_PRIORITY: UserRole[] = ['superadmin', 'serveuse', 'partner', 'delivery', 'client'];

export function normalizeRole(input: unknown): UserRole | null {
  if (!input) return null;
  const key = String(input).trim().toLowerCase();
  return ROLE_ALIAS[key] || null;
}

export function normalizeRoles(inputs: unknown[]): UserRole[] {
  const set = new Set<UserRole>();
  inputs.forEach((value) => {
    const role = normalizeRole(value);
    if (role) set.add(role);
  });
  set.add('client');
  return ROLE_PRIORITY.filter((role) => set.has(role));
}

export function resolvePrimaryRole(roles: UserRole[]): UserRole {
  return roles[0] || 'client';
}

export function roleToDashboardSegment(role: UserRole): string {
  switch (role) {
    case 'superadmin':
      return 'admin';
    case 'partner':
      return 'partner';
    case 'delivery':
      return 'delivery';
    case 'serveuse':
      return 'serveuse';
    case 'client':
    default:
      return 'client';
  }
}

export function getRoleDashboardPath(role: UserRole): string {
  const segment = roleToDashboardSegment(role);
  if (segment === 'admin' || segment === 'serveuse') return `/dashboard/${segment}/dashboard`;
  return `/dashboard/${segment}`;
}

export function getProfilePathFromRoles(roles?: UserRole[]): string {
  const primary = resolvePrimaryRole(roles || ['client']);
  const segment = roleToDashboardSegment(primary);
  return `/dashboard/${segment}/profile`;
}
