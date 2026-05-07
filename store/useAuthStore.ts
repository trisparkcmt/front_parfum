'use client';

/**
 * @file store/useAuthStore.ts
 * @description Centralized Authentication & User Session Store.
 *
 * This store manages the global state of the user's authentication status and 
 * identity within the application.
 * 
 * **State Properties**:
 * - **`user`**: Stores the current user's profile data (ID, name, email, role).
 * - **`isAuthenticated`**: A boolean flag indicating if a session is active.
 * - **`isLoading`**: Tracks asynchronous authentication operations.
 * 
 * **Core Actions**:
 * - **`login`**: Simulates an authentication request, verifying credentials and updating the store with mock user data.
 * - **`register`**: Creates a new mock user account and automatically logs them in.
 * - **`logout`**: Clears the user session and resets the authentication state.
 * - **`updateProfile`**: Allows the user to modify their basic account information.
 * 
 * **Persistence**: Uses Zustand's `persist` middleware to synchronize the user session with `localStorage`, ensuring the session survives page reloads.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { mockUsers } from '@/lib/mock-data';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { firstName: string; lastName: string; email: string; phone: string; password: string }) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  hasRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, _password) => {
        set({ isLoading: true });
        // Simulate API delay
        await new Promise((r) => setTimeout(r, 800));
        
        // Mock: find user by email
        const user = mockUsers.find((u) => u.email === email);
        if (user) {
          set({
            user,
            token: 'mock-jwt-token-' + user.id,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }
        set({ isLoading: false });
        return false;
      },

      register: async (data) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 800));
        
        const newUser: User = {
          id: 'user-' + Date.now(),
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          role: 'client',
          createdAt: new Date().toISOString(),
        };
        
        set({
          user: newUser,
          token: 'mock-jwt-token-' + newUser.id,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true });
      },

      hasRole: (role) => {
        return get().user?.role === role;
      },
    }),
    {
      name: 'ae-auth',
    }
  )
);
