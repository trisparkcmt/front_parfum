'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface BlurImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
  blurDataURL?: string;
  containerClassName?: string;
  showBlurWhileLoading?: boolean;
}

/**
 * BlurImage: Enhanced Next.js Image with progressive loading
 * - Automatic blur-up placeholder effect (LQIP)
 * - Smooth fade-in transition when image loads
 * - Optional shimmer skeleton while loading
 * - Fallback to gradient blur if no blurDataURL provided
 */
export function BlurImage({
  src,
  alt,
  blurDataURL,
  containerClassName,
  showBlurWhileLoading = true,
  className,
  ...props
}: BlurImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center',
          containerClassName
        )}
      >
        <span className="text-xs text-foreground/40">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {/* Loading state with blur effect */}
      {isLoading && showBlurWhileLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/10 to-foreground/5 animate-pulse z-10" />
      )}

      {/* Image with blur-up effect */}
      <Image
        src={src}
        alt={alt}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL || undefined}
        onLoadingComplete={handleLoadingComplete}
        onError={handleError}
        className={cn(
          'transition-opacity duration-500',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        {...props}
      />
    </div>
  );
}
