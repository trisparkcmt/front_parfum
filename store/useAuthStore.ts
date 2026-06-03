'use client';

/**
 * @file store/useAuthStore.ts
 * @description Centralized Authentication & User Session Store integrated with Backend API.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { authService } from '@/services/apiService';
import { api } from '@/services/api';
import { useToastStore } from './useToastStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (loginInput: string, password: string) => Promise<boolean>;
  register: (data: { firstName: string; lastName: string; email: string; phone: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  hasRole: (role: UserRole) => boolean;
  updateProfile: (data: { firstName?: string; lastName?: string; email?: string; phone?: string }) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      login: async (loginInput, password) => {
        set({ isLoading: true });
        const addToast = useToastStore.getState().addToast;
        
        try {
          // Use authService.webLogin which handles HttpOnly cookies on the backend
          await authService.webLogin(loginInput, password);
          
          // Fetch full detailed me profile
          let meUser: User | null = null;
          try {
            const meResponse = await api.get('/auth/me/');
            const meData = meResponse.data;
            meUser = {
              id: String(meData.user.id),
              firstName: meData.user.first_name,
              lastName: meData.user.last_name,
              email: meData.user.email,
              phone: meData.user.telephone,
              role: meData.user.role as UserRole,
              createdAt: meData.client?.date_creation || new Date().toISOString(),
            };
          } catch (meError) {
            // Fallback user details from login endpoint if /me/ fails
            // If /auth/me/ fails, we can't reliably get user data for web clients
            // as tokens aren't in JS state. This indicates a backend or session issue.
            console.error('Failed to fetch user details after login:', meError);
            addToast('Échec de la récupération des détails utilisateur après connexion.', 'error');
            set({ isLoading: false });
            return false;
          }

          set({
            user: meUser,
            isAuthenticated: true,
            isLoading: false,
          });
          addToast(`Bienvenue, ${meUser.firstName} !`, 'success');
          return true;
        } catch (error: any) {
          console.error('Login failed:', error);
          set({ isLoading: false });
          addToast(error.response?.data?.detail || 'Échec de la connexion', 'error');
          return false;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        const addToast = useToastStore.getState().addToast;

        const payload = {
          email: data.email,
          telephone: data.phone,
          password: data.password,
          password_confirm: data.password,
          first_name: data.firstName,
          last_name: data.lastName,
        };

        try {
          // Use authService.register
          await authService.register(payload);
          
          // Fetch full detailed me profile
          let meUser: User | null = null;
          try {
            const meResponse = await api.get('/auth/me/');
            const meData = meResponse.data;
            meUser = {
              id: String(meData.user.id),
              firstName: meData.user.first_name,
              lastName: meData.user.last_name,
              email: meData.user.email,
              phone: meData.user.telephone || meData.user.phone || data.phone,
              role: meData.user.role as UserRole,
              createdAt: meData.client?.date_creation || new Date().toISOString(),
            };
          } catch (meError) {
            console.error('Failed to fetch user details after registration:', meError);
            // Fallback: registration succeeded, so we can construct a partial user
            meUser = {
              id: 'temp',
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
              role: 'user' as UserRole,
              createdAt: new Date().toISOString(),
            };
            addToast('Compte créé, mais certains détails n\'ont pas pu être chargés.', 'info');
          }

          set({
            user: meUser,
            isAuthenticated: true,
            isLoading: false,
          });
          addToast(`Bienvenue, ${meUser.firstName} !`, 'success');
          return true;
        } catch (error) {
          console.error('Backend registration failed:', error);
          set({ isLoading: false });
          addToast('Échec de l\'inscription. Veuillez réessayer.', 'error');
          return false;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout/');
        } catch (e) {
          console.warn('Backend logout failed, clearing local session anyway.', e);
        }
        useToastStore.getState().addToast('Déconnexion réussie.', 'success');
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true });
      },

      hasRole: (role) => {
        return get().user?.role === role;
      },

      updateProfile: async (data) => {
        set({ isLoading: true });
        const addToast = useToastStore.getState().addToast;
        try {
          // Match fields documented in PUT/PATCH /auth/me/
          const response = await api.patch('/auth/me/', {
            email: data.email,
            telephone: data.phone,
            first_name: data.firstName,
            last_name: data.lastName,
          });

          const meData = response.data;
          const updatedUser: User = {
            id: String(meData.id),
            firstName: meData.first_name,
            lastName: meData.last_name,
            email: meData.email,
            phone: meData.telephone,
            role: meData.role as UserRole,
            createdAt: get().user?.createdAt || new Date().toISOString(),
          };

          set({ user: updatedUser, isLoading: false });
          addToast('Profil mis à jour avec succès.', 'success');
          return true;
        } catch (error) {
          console.error('Backend profile update failed:', error);
          set({ isLoading: false });
          addToast('Échec de la mise à jour du profil.', 'error');
          return false;
        }
      },
    }),
    {
      name: 'ae-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
