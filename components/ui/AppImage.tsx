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
  /**
   * Loading strategy (two-pass):
   *
   *   Pass 1 – `optimized`:
   *     Next.js proxies the image through /_next/image (resizes + WebP).
   *     Fast and bandwidth-efficient when it works.
   *     If the optimizer fails (e.g. Vercel can't reach CloudFront due to
   *     Referrer-Policy or CORS) onError fires → move to pass 2.
   *
   *   Pass 2 – `direct`:
   *     unoptimized={true} → plain <img> tag → browser fetches the URL
   *     directly, exactly like opening it in a new tab. Always works.
   *     Slower / heavier than pass 1, but correct.
   *
   *   Pass 3 – `fallback`:
   *     Both passes failed (genuinely broken URL). Show placeholder.
   */
  const [loadState, setLoadState] = useState<'optimized' | 'direct' | 'fallback'>('optimized');

  // Reset loading state if the source URL changes
  React.useEffect(() => {
    setLoadState('optimized');
  }, [src]);

  const resolved = useMemo(() => {
    if (!src) return null;
    if (src.startsWith('data:')) return src;

    const apiRoot = process.env.NEXT_PUBLIC_API_URL || API_BASE_URL || '';
    let urlStr = src;

    if (src.startsWith('http://') || src.startsWith('https://')) {
      try {
        const parsedUrl = new URL(src);
        const apiHost = apiRoot ? new URL(apiRoot).host : '';
        // Rewrite localhost/127.0.0.1 image URLs to the production API host
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
  const finalSrc = loadState === 'fallback' || !resolved ? placeholder : resolved;
  const unoptimized = loadState === 'direct';

  const handleError = () => {
    if (loadState === 'optimized') {
      // First failure: optimizer couldn't fetch it → retry loading directly
      setLoadState('direct');
    } else {
      // Second failure: URL itself is broken → show placeholder
      setLoadState('fallback');
    }
  };

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
        onError={handleError}
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
      onError={handleError}
    />
  );
};

export default AppImage;
