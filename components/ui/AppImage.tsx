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
  sizes?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Hosts that should be loaded directly by the browser without going through
 * Next.js's image optimization proxy (/_next/image).
 *
 * When Next.js optimizes an external image, it fetches it server-side from
 * Vercel. If the CDN has a strict Referrer-Policy or CORS rules, or if the
 * Vercel optimizer simply times out, the image fails — even though opening
 * the URL directly in a browser tab works perfectly.
 *
 * Setting `unoptimized={true}` makes Next.js render a plain <img> tag, so
 * the browser fetches the image directly, bypassing the proxy entirely.
 */
const UNOPTIMIZED_HOSTS = ['cloudfront.net'];

function shouldBypassOptimizer(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return UNOPTIMIZED_HOSTS.some(
      (h) => hostname === h || hostname.endsWith(`.${h}`)
    );
  } catch {
    return false;
  }
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
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  loading = 'lazy',
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
        // If image URL host is local but the API root is remote, rewrite host
        // to the production API root so uploaded assets load correctly.
        if (
          (parsedUrl.hostname === '127.0.0.1' ||
            parsedUrl.hostname === 'localhost') &&
          apiHost &&
          !apiHost.includes('127.0.0.1') &&
          !apiHost.includes('localhost')
        ) {
          const apiURLObj = new URL(apiRoot);
          parsedUrl.protocol = apiURLObj.protocol;
          parsedUrl.host = apiURLObj.host;
          urlStr = parsedUrl.toString();
        }
      } catch {
        // Fallback to original src if URL parsing fails
      }
      return urlStr;
    }

    if (src.startsWith('/')) return src;

    if (!apiRoot) return src;
    return `${apiRoot.replace(/\/+$|^\/+/, '')}/${src.replace(/^\/+/, '')}`;
  }, [src]);

  const placeholder = '/parfume1.png';
  const finalSrc = errored || !resolved ? placeholder : resolved;

  // Bypass the Next.js optimizer for CloudFront URLs so the browser loads the
  // image directly — identical to opening the URL in a new tab.
  const unoptimized =
    typeof finalSrc === 'string' && shouldBypassOptimizer(finalSrc);

  if (fill) {
    return (
      <Image
        src={finalSrc}
        alt={alt}
        fill
        unoptimized={unoptimized}
        className={className}
        style={{ objectFit: 'cover', ...(style || {}) }}
        sizes={sizes}
        priority={priority}
        quality={80}
        loading={priority ? undefined : loading}
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
      unoptimized={unoptimized}
      className={className}
      style={style}
      priority={priority}
      sizes={sizes}
      quality={80}
      loading={priority ? 'eager' : loading}
      onError={() => setErrored(true)}
    />
  );
};

export default AppImage;
