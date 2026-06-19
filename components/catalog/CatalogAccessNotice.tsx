'use client';

import { ShieldAlert, Eye } from 'lucide-react';
import type { CatalogPermissions } from '@/lib/catalogPermissions';

interface CatalogAccessNoticeProps {
  permissions: CatalogPermissions;
  resourceLabel: string;
}

/** Shows staff write access or read-only notice on catalogue pages. */
export default function CatalogAccessNotice({
  permissions,
  resourceLabel,
}: CatalogAccessNoticeProps) {
  if (!permissions.canRead) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
        <ShieldAlert size={16} />
        Accès refusé à {resourceLabel}.
      </div>
    );
  }

  if (!permissions.canCreate && !permissions.canUpdate && !permissions.canDelete) {
    return (
      <div className="flex items-center gap-2 text-sm text-foreground/50 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
        <Eye size={16} />
        Consultation seule — vous n&apos;avez pas les droits de modification sur {resourceLabel}.
      </div>
    );
  }

  return null;
}
