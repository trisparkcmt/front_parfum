'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { API_BASE_URL } from '@/lib/constants';

interface AppImageProps {
  src?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean;
  priority?: boolean;
}

export const AppImage: React.FC<AppImageProps> = ({
  src,
  alt = '',
  width = 200,
  height = 200,
  className,
  style,
  fill = false,
  priority = false,
}) => {
  const [errored, setErrored] = useState(false);

  const resolved = useMemo(() => {
    if (!src) return null;
    // Data URLs are fine
    if (src.startsWith('data:')) return src;
    // Absolute URLs are already fine
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) return src;
    // Otherwise treat as relative path from API base URL
    const apiRoot = process.env.NEXT_PUBLIC_API_URL || API_BASE_URL || '';
    if (!apiRoot) return src;
    // ensure no duplicate slashes
    return `${apiRoot.replace(/\/+$|^\/+/, '')}/${src.replace(/^\/+/, '')}`;
  }, [src]);

  const placeholder = '/icons/icon-192x192.jpeg';
  const finalSrc = errored || !resolved ? placeholder : resolved;

  // Use native <img> when using fill to avoid styling constraints with next/image in some layouts
  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={finalSrc}
        alt={alt}
        className={className}
        style={{ objectFit: 'cover', width: '100%', height: '100%', ...(style || {}) }}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <Image
      src={finalSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      unoptimized
      priority={priority}
      onError={() => setErrored(true)}
    />
  );
};

export default AppImage;
