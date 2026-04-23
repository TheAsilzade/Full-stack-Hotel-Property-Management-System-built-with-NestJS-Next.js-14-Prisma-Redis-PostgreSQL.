import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserDto, AuthTokens } from '@Noblesse/shared';

interface AuthState {
  user: UserDto | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  _hydrated: boolean;
  setAuth: (user: UserDto, tokens: AuthTokens) => void;
  updateTokens: (tokens: AuthTokens) => void;
  clearAuth: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      _hydrated: false,

      setAuth: (user, tokens) =>
        set({ user, tokens, isAuthenticated: true }),

      updateTokens: (tokens) =>
        set({ tokens }),

      clearAuth: () => {
        // Clear the auth cookie used by middleware
        if (typeof document !== 'undefined') {
          document.cookie = 'Noblesse-auth-token=; path=/; max-age=0; SameSite=Lax';
        }
        set({ user: null, tokens: null, isAuthenticated: false });
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        if (user.permissions.includes('*')) return true;
        return user.permissions.includes(permission);
      },
    }),
    {
      name: 'Noblesse-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true;
      },
    },
  ),
);