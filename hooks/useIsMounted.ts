'use client';

import { useEffect, useState } from 'react';

/**
 * useIsMounted: Hook to prevent hydration mismatches
 * 
 * Returns false on server and during initial hydration,
 * then returns true once component is mounted on client.
 * 
 * Use this to conditionally render client-only content
 * to avoid hydration mismatches between server and client.
 * 
 * @example
 * const isMounted = useIsMounted();
 * 
 * // Render client content only after hydration
 * if (!isMounted) return null;
 * 
 * return <ClientOnlyComponent />;
 */
export function useIsMounted(): boolean {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}
