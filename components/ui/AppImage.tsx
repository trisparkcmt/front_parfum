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
    if (src.startsWith('data:')) return src;

    const apiRoot = process.env.NEXT_PUBLIC_API_URL || API_BASE_URL || '';
    let urlStr = src;

    if (src.startsWith('http://') || src.startsWith('https://')) {
      try {
        const parsedUrl = new URL(src);
        const apiHost = apiRoot ? new URL(apiRoot).host : '';
        // If image URL host is local but the API root is remote, rewrite host to API root to load uploaded assets
        if (
          (parsedUrl.hostname === '127.0.0.1' || parsedUrl.hostname === 'localhost') &&
          apiHost &&
          !apiHost.includes('127.0.0.1') &&
          !apiHost.includes('localhost')
        ) {
          const apiURLObj = new URL(apiRoot);
          parsedUrl.protocol = apiURLObj.protocol;
          parsedUrl.host = apiURLObj.host;
          urlStr = parsedUrl.toString();
        }
      } catch (e) {
        // Fallback to original src if URL parsing fails
      }
      return urlStr;
    }

    if (src.startsWith('/')) return src;

    if (!apiRoot) return src;
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
