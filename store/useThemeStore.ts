'use client';

/**
 * @file store/useThemeStore.ts
 * @description Global Theme Management Store with System Theme Detection and Viewport Syncing.
 *
 * This store manages the application's visual theme (dark/light mode) and:
 * - Persists the user's preference to localStorage
 * - Detects system theme preference on app load
 * - Listens to system theme changes in real-time
 * - Synchronizes the browser window/notch theme-color with the active UI state
 *
 * **State Management**:
 * - **`theme`**: The current active theme ('dark' | 'light').
 *
 * **Core Actions**:
 * - **`setTheme`**: Directly sets the theme.
 * - **`toggleTheme`**: Switches between dark and light modes.
 * - **`initTheme`**: Reads saved preference or detects system theme.
 */
import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

// Helper to keep the mobile browser's toolbar synchronized with the interface
function updateViewportThemeColor(theme: Theme) {
  if (typeof window === 'undefined') return;
  
  const colors: Record<Theme, string> = {
    dark: '#0b0b0b',  // Adjust this hex to match your layout's deep background color
    light: '#ffffff', // Adjust this hex to match your layout's light background color
  };

  let metaTag = document.querySelector('meta[name="theme-color"]');
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute('name', 'theme-color');
    document.head.appendChild(metaTag);
  }
  metaTag.setAttribute('content', colors[theme]);
}

// Helper to detect system theme preference
function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',

  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('ae-theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      updateViewportThemeColor(theme);
    }
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  initTheme: () => {
    if (typeof window !== 'undefined') {
      // Check if user has a saved preference
      const saved = localStorage.getItem('ae-theme') as Theme | null;
      
      // If no saved preference, detect system theme
      const theme = saved || getSystemTheme();
      
      set({ theme });
      document.documentElement.setAttribute('data-theme', theme);
      updateViewportThemeColor(theme);

      // Listen to system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        // Only apply system theme if user hasn't set an explicit preference
        if (!localStorage.getItem('ae-theme')) {
          const newTheme = e.matches ? 'dark' : 'light';
          set({ theme: newTheme });
          document.documentElement.setAttribute('data-theme', newTheme);
          updateViewportThemeColor(newTheme);
        }
      };

      // Support both old and new browser API
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
      }

      // Cleanup listener
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else if (mediaQuery.removeListener) {
          mediaQuery.removeListener(handleChange);
        }
      };
    }
  },
}));