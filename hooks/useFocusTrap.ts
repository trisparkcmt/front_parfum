'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * useFocusTrap: Hook to trap focus within a modal or overlay
 * 
 * Ensures keyboard navigation stays within the modal element.
 * Returns focus to trigger element when modal closes.
 * 
 * @example
 * const modalRef = useFocusTrap();
 * return <div ref={modalRef}>Modal content</div>;
 */
export function useFocusTrap(isOpen: boolean = true, onEscape?: () => void) {
  const elementRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  const getFocusableElements = useCallback(() => {
    if (!elementRef.current) return [];

    const selector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(
      elementRef.current.querySelectorAll(selector)
    ) as HTMLElement[];
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Handle keydown events
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscapeRef.current?.();
        return;
      }

      // Handle Tab key
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const activeElement = document.activeElement as HTMLElement;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab: Focus previous element
      if (e.shiftKey) {
        if (activeElement === firstElement || !elementRef.current?.contains(activeElement)) {
          e.preventDefault();
          lastElement.focus();
        }
      }
      // Tab: Focus next element
      else {
        if (activeElement === lastElement || !elementRef.current?.contains(activeElement)) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Store trigger element (element with focus before modal opened)
    triggerRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element ONLY if current focus is outside this modal
    const modalElement = elementRef.current;
    if (modalElement) {
      const activeEl = document.activeElement;
      if (!activeEl || !modalElement.contains(activeEl)) {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
      modalElement.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (modalElement) {
        modalElement.removeEventListener('keydown', handleKeyDown);
      }

      // Restore focus to trigger element
      if (triggerRef.current?.focus) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, getFocusableElements]);

  return elementRef;
}

/**
 * useAriaLive: Hook for ARIA live region announcements
 * 
 * @example
 * const { announce } = useAriaLive();
 * announce('Item deleted successfully', 'polite');
 */
export function useAriaLive() {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create live region if not exists
    if (!regionRef.current) {
      const region = document.createElement('div');
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only'; // Screen reader only
      document.body.appendChild(region);
      regionRef.current = region;
    }

    return () => {
      if (regionRef.current && regionRef.current.parentElement) {
        regionRef.current.parentElement.removeChild(regionRef.current);
      }
    };
  }, []);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (regionRef.current) {
      regionRef.current.setAttribute('aria-live', priority);
      regionRef.current.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  return { announce };
}
