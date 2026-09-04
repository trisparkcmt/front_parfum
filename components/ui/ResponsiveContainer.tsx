'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ResponsiveContainerProps {
  children: ReactNode;
  /** Constrain max-height on landscape */
  constrainHeight?: boolean;
  /** Max height on landscape (default: 80vh) */
  landscapeMaxHeight?: string;
  /** Custom class name */
  className?: string;
  /** Enable horizontal scrolling on small screens */
  allowHorizontalScroll?: boolean;
}

/**
 * ResponsiveContainer: Handles landscape orientation constraints
 * 
 * Features:
 * - Limits max-height in landscape to prevent content overflow
 * - Enables scroll when content exceeds constraints
 * - Touch-friendly on mobile
 * - Prevents layout jank during orientation change
 * 
 * @example
 * <ResponsiveContainer constrainHeight landscapeMaxHeight="70vh">
 *   <YourContent />
 * </ResponsiveContainer>
 */
export function ResponsiveContainer({
  children,
  constrainHeight = true,
  landscapeMaxHeight = '80vh',
  className,
  allowHorizontalScroll = true,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        'w-full',
        // Landscape constraints (height < width)
        constrainHeight && 'landscape:max-h-[80vh] landscape:overflow-y-auto',
        // Mobile landscape specifics
        'sm:landscape:max-h-[85vh]',
        allowHorizontalScroll && 'overflow-x-auto',
        className
      )}
      style={constrainHeight ? { maxHeight: landscapeMaxHeight } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * LandscapeView: Container specifically for landscape orientation
 * 
 * Only renders on landscape (height < width)
 */
export function LandscapeView({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('landscape:block hidden', className)}>
      {children}
    </div>
  );
}

/**
 * PortraitView: Container specifically for portrait orientation
 * 
 * Only renders on portrait (height > width)
 */
export function PortraitView({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('portrait:block hidden', className)}>
      {children}
    </div>
  );
}

/**
 * useOrientation: Hook to detect device orientation
 * 
 * @example
 * const { orientation, isLandscape, isPortrait } = useOrientation();
 */
export function useOrientation() {
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait');

  React.useEffect(() => {
    const updateOrientation = () => {
      const isLandscape = window.innerHeight < window.innerWidth;
      setOrientation(isLandscape ? 'landscape' : 'portrait');
    };

    updateOrientation();

    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return {
    orientation,
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait',
  };
}
