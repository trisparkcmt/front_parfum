'use client';

import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FormModal } from '@/components/ui/FormModal';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sizeMap: Record<NonNullable<SlideOverProps['size']>, 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: '3xl',
  full: 'full',
};

export function SlideOver({
  isOpen,
  onClose,
  title,
  description,
  size = 'xl',
  children,
  footer,
  className,
}: SlideOverProps) {
  const portalTarget = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return document.body;
  }, []);

  if (!portalTarget) return null;

  return createPortal(
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={description}
      size={sizeMap[size]}
      className={className}
      footer={footer}
    >
      {children}
    </FormModal>,
    portalTarget
  );
}
