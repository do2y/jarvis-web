import { useEffect } from "react";
import axios from "axios";
import { fetchMe } from "@/shared/api/auth";
import type { ApiEnvelope } from "@/shared/api/client";
import { useAuthStore } from "@/shared/stores/authStore";

/**
 * 부팅 시 세션 복원 — AT를 localStorage에 두지 않으므로 새로고침마다 필요하다.
 *
 * RT 쿠키로 AT를 재발급받고(/api/auth/refresh), 성공하면 /api/auth/me로 신원·역할을
 * 확인한다. me를 한 번 더 부르는 이유: persist된 user는 사용자가 편집 가능해서
 * role을 그대로 믿으면 가드가 뚫린다(백엔드가 최종 방어선이긴 하나 화면이 열리는 건 막아야 함).
 *
 * refresh는 api 인스턴스를 쓰지 않는다 — 게스트는 RT가 없어 401이 정상인데,
 * 인터셉터를 타면 /login으로 리다이렉트되어 게스트가 홈에 못 머문다.
 */
async function restore(): Promise<void> {
  // persist 리하이드레이션은 비동기라 mount 시점엔 user가 아직 null일 수 있다.
  // 기다리지 않고 user를 읽으면 "로그인한 적 없음"으로 오판해 refresh를 건너뛰고,
  // 잠시 뒤 user만 복원돼 "user는 있는데 AT는 없는" 상태로 굳는다
  // → 인증 쿼리가 전부 막히거나 401을 맞아 새로고침 때마다 로그인으로 튕긴다.
  if (!useAuthStore.persist.hasHydrated()) {
    await new Promise<void>((resolve) => {
      const unsub = useAuthStore.persist.onFinishHydration(() => {
        unsub();
        resolve();
      });
    });
  }

  const { user, setAccessToken, setUser, clearAuth } = useAuthStore.getState();

  // 로그인한 적이 없으면 이을 세션이 없다 → refresh를 부르지 않는다.
  // 부르면 RT가 없어 401이 정상 응답인데, 게스트가 앱을 열 때마다 콘솔에 에러가 쌓인다.
  if (!user) return;

  let token: string;
  try {
    const res = await axios.post<ApiEnvelope<{ accessToken: string }>>(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`,
      null,
      { withCredentials: true },
    );
    const issued = res.data.data?.accessToken;
    if (!issued) throw new Error("no accessToken in refresh response");
    token = issued;
  } catch {
    // RT 없음/만료 = 비로그인 상태. 캐시된 user를 지워 가드가 통과시키지 않게 한다.
    clearAuth();
    return;
  }

  setAccessToken(token);

  try {
    setUser(await fetchMe());
  } catch {
    // AT는 받았는데 me가 실패 → 신원 불명이므로 로그인 상태로 취급하지 않는다.
    clearAuth();
  }
}

// StrictMode는 이펙트를 2회 실행한다. 그대로 두면 refresh가 두 번 나가고,
// 백엔드가 RT를 회전시키므로 두 번째 호출이 첫 번째가 받은 토큰을 무효화할 수 있다.
// 모듈 레벨에 프라미스를 두어 실제 복원은 1회만 수행한다(client.ts의 refreshing과 같은 방식).
let restoring: Promise<void> | null = null;

/** App 최상단에서 1회 실행. 완료 전까지 isRestoring=true라 가드는 판정을 보류한다. */
export function useRestoreSession(): void {
  useEffect(() => {
    restoring ??= restore();
    restoring.finally(() => {
      useAuthStore.getState().finishRestore();
    });
  }, []);
}
