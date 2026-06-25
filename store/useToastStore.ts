'use client';

/**
 * @file store/useToastStore.ts
 * @description Global Notification & Feedback System.
 *
 * This store manages the lifecycle of ephemeral feedback messages (Toasts) 
 * throughout the application.
 * 
 * **State Management**:
 * - **`toasts`**: An array of active notification objects (ID, message, type).
 * 
 * **Core Actions**:
 * - **`addToast`**: Creates a new notification with a specified message and type ('success', 'error', 'info', 'warning'). It automatically generates a unique ID and triggers a timer for auto-removal.
 * - **`removeToast`**: Manually removes a notification from the stack.
 * 
 * **Integration**: Consumed by the `ToastProvider` component to render the visual notification queue. It provides essential UX feedback for e-commerce actions like adding to cart or login errors.
 */
import { create } from 'zustand';

interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  href?: string;
  hrefLabel?: string;
}

interface ToastState {
  toasts: ToastData[];
  addToast: (
    message: string,
    type?: 'success' | 'error' | 'info',
    options?: { href?: string; hrefLabel?: string }
  ) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'success', options) => {
    const id = Date.now().toString();
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          message,
          type,
          href: options?.href,
          hrefLabel: options?.hrefLabel,
        },
      ],
    }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
