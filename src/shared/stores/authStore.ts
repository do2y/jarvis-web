import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "MEMBER" | "SELLER" | "ADMIN";

export interface AuthUser {
  id: number;
  nickname: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (p: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (p) => set(p),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: "jarvis-auth" },
  ),
);
