'use client';

/**
 * @file store/useAuthStore.ts
 * @description Centralized Authentication & User Session Store integrated with Backend API.
 */
import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { authService } from '@/services/apiService';
import { api, rawApi } from '@/services/api';
import { useToastStore } from './useToastStore';
import { useCartStore } from './useCartStore';
import { normalizeRoles, resolvePrimaryRole } from '@/lib/roleUtils';

function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
}

function extractUserRoles(userObj: any, token?: string | null): UserRole[] {
  const rolesToCheck: string[] = [];

  // 1. Check direct role and other fields from user object
  if (userObj?.role) {
    rolesToCheck.push(String(userObj.role));
  }
  if (userObj?.type_utilisateur) {
    rolesToCheck.push(String(userObj.type_utilisateur));
  }
  if (userObj?.is_superuser || userObj?.is_staff) {
    rolesToCheck.push('superadmin');
  }

  // 2. Check roles array from user object
  if (Array.isArray(userObj?.roles)) {
    userObj.roles.forEach((r: any) => rolesToCheck.push(String(r)));
  }

  // 3. Check roles from JWT token if available
  if (token) {
    const decoded = decodeJwt(token);
    if (decoded) {
      if (decoded.role) {
        rolesToCheck.push(String(decoded.role));
      }
      if (decoded.type_utilisateur) {
        rolesToCheck.push(String(decoded.type_utilisateur));
      }
      if (decoded.is_superuser || decoded.is_staff) {
        rolesToCheck.push('superadmin');
      }
      if (Array.isArray(decoded.roles)) {
        decoded.roles.forEach((r: any) => rolesToCheck.push(String(r)));
      }
      if (decoded.role_list) {
        if (Array.isArray(decoded.role_list)) {
          decoded.role_list.forEach((r: any) => rolesToCheck.push(String(r)));
        } else {
          rolesToCheck.push(String(decoded.role_list));
        }
      }
    }
  }

  return normalizeRoles(rolesToCheck);
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (loginInput: string, password: string) => Promise<boolean>;
  loginWithGoogle: (accessToken: string, code?: string) => Promise<boolean>;
  register: (data: { firstName: string; lastName: string; email: string; phone: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  hasRole: (role: UserRole) => boolean;
  updateProfile: (data: { firstName?: string; lastName?: string; email?: string; phone?: string }) => Promise<boolean>;
  refreshUser: () => Promise<User | null>;
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

        const payload = loginInput.includes('@')
          ? { email: loginInput, password }
          : { telephone: loginInput, password };

        try {
          // Clear stale tokens/cookies before login so they don't override fresh credentials
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            delete api.defaults.headers.common['Authorization'];
            try {
              await axios.post(`${rawApi.defaults.baseURL}auth/logout/`, {}, { withCredentials: true });
            } catch {
              // Best-effort: ignore if no session exists
            }
          }

          // Use web login with cookies for refresh token (backend sets HttpOnly cookie)
          const loginResponse = await rawApi.post('auth/web/login/', payload, { withCredentials: true });
          const loginData = loginResponse.data;

          if (typeof window !== 'undefined') {
            // Store only access token; refresh token comes via HttpOnly cookie
            localStorage.setItem('auth_token', loginData.access);
            api.defaults.headers.common['Authorization'] = `Bearer ${loginData.access}`;
          }

          const mapUser = (userObj: any, meData?: any): User => ({
            ...(function () {
              const roles = extractUserRoles(userObj, loginData.access);
              return {
                role: resolvePrimaryRole(roles),
                roles,
              };
            })(),
            id: String(userObj.id),
            firstName: userObj.first_name || '',
            lastName: userObj.last_name || '',
            email: userObj.email || '',
            phone: userObj.telephone || userObj.phone || '',
            createdAt: meData?.client?.date_creation || userObj.date_creation || new Date().toISOString(),
          });

          // Fetch full profile via rawApi to avoid the refresh interceptor during login
          let meUser: User | null = null;
          try {
            const meResponse = await rawApi.get('auth/me/', {
              headers: { Authorization: `Bearer ${loginData.access}` },
            });
            const meData = meResponse.data;
            const userObj = meData.user || meData;
            meUser = mapUser(userObj, meData);
          } catch (meError) {
            if (loginData.user) {
              console.warn('Failed to fetch /auth/me/, using login response user:', meError);
              meUser = mapUser(loginData.user);
            } else {
              console.error('Failed to fetch user details after login:', meError);
              addToast('Échec de la récupération des détails utilisateur après connexion.', 'error');
              set({ isLoading: false });
              return false;
            }
          }

          set({
            user: meUser,
            isAuthenticated: true,
            isLoading: false,
          });
          addToast(`Bienvenue, ${meUser.firstName} !`, 'success');

          // Clear stale cart and sync fresh cart from backend after login
          // NOTE: Cart sync disabled until backend orders/panier endpoints are implemented
          const cartStore = useCartStore.getState();
          cartStore.clearCart();
          // Uncomment when backend has /api/v1/orders/panier/ endpoints:
          // try {
          //   await cartStore.syncCart();
          // } catch (cartError) {
          //   console.warn('Failed to sync cart after login:', cartError);
          // }

          return true;
        } catch (error: any) {
          console.error('Login failed:', error);
          set({ isLoading: false });
          addToast(error.response?.data?.detail || 'Échec de la connexion', 'error');
          return false;
        }
      },

      loginWithGoogle: async (accessToken, code) => {
        set({ isLoading: true });
        const addToast = useToastStore.getState().addToast;

        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            delete api.defaults.headers.common['Authorization'];
          }

          const googleResponse = await rawApi.post('auth/google/', {
            access_token: accessToken,
            code: code || undefined,
          }, { withCredentials: true });
          const loginData = googleResponse.data || {};
          const access = loginData.access || loginData.access_token;

          if (!access) {
            set({ isLoading: false });
            addToast('Connexion Google échouée (jeton absent).', 'error');
            return false;
          }

          if (typeof window !== 'undefined') {
            // Store only access token; refresh token comes via HttpOnly cookie
            localStorage.setItem('auth_token', access);
            api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
          }

          const mapUser = (userObj: any, meData?: any): User => {
            const roles = extractUserRoles(userObj, access);
            return {
              id: String(userObj.id),
              firstName: userObj.first_name || '',
              lastName: userObj.last_name || '',
              email: userObj.email || '',
              phone: userObj.telephone || userObj.phone || '',
              role: resolvePrimaryRole(roles),
              roles,
              createdAt: meData?.client?.date_creation || userObj.date_creation || new Date().toISOString(),
            };
          };

          let meUser: User | null = null;
          try {
            const meResponse = await rawApi.get('auth/me/', {
              headers: { Authorization: `Bearer ${access}` },
            });
            const meData = meResponse.data;
            const userObj = meData.user || meData;
            meUser = mapUser(userObj, meData);
          } catch (meError) {
            if (loginData.user) {
              meUser = mapUser(loginData.user);
            } else {
              console.error('Failed to fetch user details after Google login:', meError);
              addToast('Échec de la récupération du profil après connexion Google.', 'error');
              set({ isLoading: false });
              return false;
            }
          }

          set({
            user: meUser,
            isAuthenticated: true,
            isLoading: false,
          });
          addToast(`Bienvenue, ${meUser.firstName} !`, 'success');
          useCartStore.getState().clearCart();
          return true;
        } catch (error: any) {
          console.error('Google login failed:', error);
          set({ isLoading: false });
          addToast(error.response?.data?.detail || 'Échec de la connexion Google', 'error');
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
          // Use rawApi (no cookies, no interceptors) for public registration endpoint
          await rawApi.post('auth/registration/', payload);

          // Registration successful - user needs to verify email
          // DO NOT auto-login - user must verify email first
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          console.error('Backend registration failed:', error?.response?.data || error);
          set({ isLoading: false });

          const status = error?.response?.status;
          const errData = error?.response?.data;

          // Network / server unreachable
          if (!error?.response) {
            addToast('Impossible de contacter le serveur. Vérifiez votre connexion.', 'error');
            return false;
          }

          // Server crash – Django returns an HTML error page
          const isHtml = typeof errData === 'string' && (errData.trimStart().startsWith('<') || errData.includes('<!DOCTYPE'));
          if (isHtml || status >= 500) {
            addToast('Erreur serveur. Veuillez réessayer dans quelques instants.', 'error');
            return false;
          }

          // Extract the most helpful validation error from the backend JSON
          let msg = 'Échec de l\'inscription. Veuillez réessayer.';
          if (errData) {
            if (errData.detail) {
              msg = errData.detail;
            } else if (errData.email?.[0]) {
              msg = `Email : ${errData.email[0]}`;
            } else if (errData.telephone?.[0]) {
              msg = `Téléphone : ${errData.telephone[0]}`;
            } else if (errData.password?.[0]) {
              msg = `Mot de passe : ${errData.password[0]}`;
            } else if (errData.password_confirm?.[0]) {
              msg = `Confirmation : ${errData.password_confirm[0]}`;
            } else if (errData.non_field_errors?.[0]) {
              msg = errData.non_field_errors[0];
            } else {
              const allErrors = Object.entries(errData)
                .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs[0] : errs}`)
                .join(' | ');
              if (allErrors) msg = allErrors;
            }
          }
          addToast(msg, 'error');
          return false;
        }
      },

      logout: async () => {
        try {
          await api.post('auth/logout/');
        } catch (e) {
          console.warn('Backend logout failed, clearing local session anyway.', e);
        }
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          delete api.defaults.headers.common['Authorization'];
        }
        useToastStore.getState().addToast('Déconnexion réussie.', 'success');
        // Clear cart on logout
        useCartStore.getState().clearCart();
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true });
      },

      hasRole: (role) => {
        return !!get().user?.roles?.includes(role);
      },

      updateProfile: async (data) => {
        set({ isLoading: true });
        const addToast = useToastStore.getState().addToast;
        
        try {
          // Use authService.updateProfile which handles the API call correctly
          const response = await authService.updateProfile({
            telephone: data.phone,
            first_name: data.firstName,
            last_name: data.lastName,
          });

          // Parse the response to create updated user object
          const meData = response.user || response;
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
          const roles = extractUserRoles(meData, token);

          const updatedUser: User = {
            id: String(meData.id),
            firstName: meData.first_name,
            lastName: meData.last_name,
            email: meData.email,
            phone: meData.telephone || meData.phone,
            role: resolvePrimaryRole(roles),
            roles,
            createdAt: get().user?.createdAt || new Date().toISOString(),
          };

          set({ user: updatedUser, isLoading: false });
          addToast('Profil mis à jour avec succès.', 'success');
          return true;
        } catch (error: any) {
          console.error('Backend profile update failed:', error);
          
          // Handle specific error messages from API
          const errorMsg = 
            error.response?.data?.detail ||
            error.response?.data?.email?.[0] ||
            error.response?.data?.telephone?.[0] ||
            error.response?.data?.first_name?.[0] ||
            error.response?.data?.last_name?.[0] ||
            error.response?.data?.message ||
            'Échec de la mise à jour du profil.';
          
          set({ isLoading: false });
          addToast(errorMsg, 'error');
          return false;
        }
      },

      refreshUser: async () => {
        // Use rawApi (no interceptors) so a 401 here never triggers the global
        // isRefreshing lock or poisons the failedQueue.
        const tokenAtStart =
          typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!tokenAtStart) {
          set({ user: null, isAuthenticated: false });
          return null;
        }
        try {
          const meResponse = await rawApi.get('auth/me/', {
            headers: { Authorization: `Bearer ${tokenAtStart}` },
          });
          const meData = meResponse.data;
          const userObj = meData.user || meData;

          const roles = extractUserRoles(userObj, tokenAtStart);

          const meUser: User = {
            id: String(userObj.id),
            firstName: userObj.first_name || '',
            lastName: userObj.last_name || '',
            email: userObj.email || '',
            phone: userObj.telephone || userObj.phone || '',
            role: resolvePrimaryRole(roles),
            roles,
            createdAt: meData.client?.date_creation || userObj.date_creation || new Date().toISOString(),
          };

          set({ user: meUser, isAuthenticated: true });
          return meUser;
        } catch (error: any) {
          // 401 / Network error: token expired or server unreachable — fail silently.
          // Do NOT clear auth state here; the user may still navigate fine
          // and the main interceptor will handle refresh on the next real API call.
          if (error?.response?.status === 401) {
            // Prevent a race condition: if a login happened while this refresh was in-flight,
            // then the token in localStorage will have changed and we must not wipe it.
            const currentToken =
              typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (currentToken !== tokenAtStart) {
              return null;
            }

            // Token is expired — clear persisted state so next page load is clean
            set({ user: null, isAuthenticated: false });
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth_token');
            }
          }
          return null;
        }
      },
    }),
    {
      name: 'ae-auth',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);

          // If the hydrated user state has an invalid/undefined role, reset it
          if (
            state.isAuthenticated &&
            state.user &&
            (
              !state.user.roles ||
              !Array.isArray(state.user.roles) ||
              state.user.roles.length === 0 ||
              !state.user.role
            )
          ) {
            console.warn('Hydrated user role is invalid/undefined. Resetting auth state.');
            state.user = null;
            state.isAuthenticated = false;
            return;
          }

          // Only attempt a background refresh if a real token exists in storage.
          // If there is no token we already know the session is dead — reset immediately
          // rather than firing a doomed request that would lock isRefreshing and
          // interfere with a concurrent login attempt.
          if (state.isAuthenticated) {
            // When you're on the login page, avoid background refreshes that might
            // clear tokens while a login is being performed.
            if (typeof window !== 'undefined' && window.location.pathname.includes('/login')) {
              return;
            }

            const hasToken =
              typeof window !== 'undefined' && !!localStorage.getItem('auth_token');

            if (hasToken) {
              // refreshUser uses rawApi (no interceptors) — safe to call in background
              state.refreshUser().catch(() => {});
            } else {
              // No token in storage → clear persisted auth state immediately
              state.user = null;
              state.isAuthenticated = false;
            }
          }
        }
      },
    }
  )
);
