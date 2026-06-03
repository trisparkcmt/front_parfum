'use client';

/**
 * @file store/useThemeStore.ts
 * @description Global Theme Management Store.
 *
 * This store manages the application's visual theme (dark/light mode) and
 * persists the user's preference to localStorage.
 *
 * **State Management**:
 * - **`theme`**: The current active theme ('dark' | 'light').
 *
 * **Core Actions**:
 * - **`setTheme`**: Directly sets the theme.
 * - **`toggleTheme`**: Switches between dark and light modes.
 * - **`initTheme`**: Reads the persisted preference from localStorage on mount.
 */
import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',

  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('ae-theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  initTheme: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ae-theme') as Theme | null;
      const theme = saved || 'dark';
      set({ theme });
      document.documentElement.setAttribute('data-theme', theme);
    }
  },
}));
