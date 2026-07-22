import { create } from "zustand";
import { persist } from "zustand/middleware";

// 백엔드 role enum과 일치 (USER/SELLER/ADMIN)
export type UserRole = "USER" | "SELLER" | "ADMIN";

// 백엔드 member 객체 계약
export interface AuthUser {
  id: number;
  email: string;
  nickname: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  /**
   * 부팅 시 세션 복원(refresh → me)이 끝났는지. false인 동안 라우트 가드는
   * 판정을 보류한다 — 아니면 새로고침 때마다 로그인 화면이 한 번 번쩍인다.
   */
  isRestoring: boolean;
  // RT는 httpOnly 쿠키로 관리 → 클라 상태에 저장하지 않음
  setAuth: (p: { user: AuthUser; accessToken: string }) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: AuthUser) => void;
  finishRestore: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isRestoring: true,
      setAuth: (p) => set(p),
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      finishRestore: () => set({ isRestoring: false }),
      clearAuth: () => set({ user: null, accessToken: null }),
    }),
    {
      name: "jarvis-auth",
      // AT는 절대 저장하지 않는다(XSS 시 탈취 대상). 새로고침 후 AT는
      // RT 쿠키 → /api/auth/refresh 로 복원되므로 저장할 이유가 없다.
      //
      // user만 남기는 건 헤더 닉네임 등의 초기 깜빡임을 줄이기 위한 캐시일 뿐이며,
      // 신뢰 경계가 아니다 — 권한 판정은 부팅 시 /api/auth/me 응답으로 덮어쓴다.
      // (localStorage는 사용자가 편집 가능하므로 role을 그대로 믿으면 안 된다.
      //  물론 최종 방어선은 백엔드이고, 가드는 UX 차원의 1차 필터다.)
      partialize: (s) => ({ user: s.user }),
      // partialize는 앞으로의 저장만 막는다. 이 변경 전에 이미 AT가 저장된 브라우저가
      // 있으므로 version을 올려 기존 항목을 마이그레이션(=AT 폐기)한다.
      version: 1,
      migrate: (persisted) => ({ user: (persisted as { user?: AuthUser }).user ?? null }),
    },
  ),
);

/**
 * 인증이 필요한 요청을 보내도 되는 시점인지.
 *
 * `user`만 보면 안 된다 — user는 persist되지만 AT는 메모리라, 새로고침 직후엔
 * "user는 있는데 AT는 없는" 구간이 존재한다. 이때 요청을 보내면 Authorization
 * 헤더 없이 나가 401을 맞고, 인터셉터가 로그인 화면으로 튕겨버린다.
 *
 * 복원이 끝났고(isRestoring=false) AT가 실제로 있을 때만 true.
 * 인증 필요 쿼리의 `enabled`는 반드시 이걸 쓸 것.
 */
export const selectIsAuthReady = (s: AuthState) =>
  !s.isRestoring && s.accessToken !== null;
