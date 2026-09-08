'use client';

/**
 * @file components/ui/AdminTableSkeleton.tsx
 * @description Skeleton loader for admin tables during data loading
 * Provides visual feedback while data is being fetched
 */

export const AdminTableSkeleton = ({
  columns = 5,
  rows = 8,
}: {
  columns?: number;
  rows?: number;
}) => (
  <div className="w-full overflow-hidden">
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/10 bg-white/5">
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-5 py-3">
              <div className="h-4 w-24 bg-foreground/10 rounded animate-pulse" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <tr
            key={rowIdx}
            className="border-b border-white/5 hover:bg-white/5 transition-colors"
          >
            {Array.from({ length: columns }).map((_, colIdx) => (
              <td key={colIdx} className="px-5 py-4">
                <div className="h-4 w-full max-w-xs bg-foreground/5 rounded animate-pulse" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
