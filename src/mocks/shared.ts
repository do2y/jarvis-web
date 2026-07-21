export const BASE = import.meta.env.VITE_API_BASE_URL;

// 백엔드 공통 응답 봉투 헬퍼 — 실제 API와 동일하게 { success, data } / { success, error }.
// client.ts 인터셉터가 이 봉투를 언래핑하므로 목도 반드시 이 형태를 지켜야 함.
export function ok<T>(data: T) {
  return { success: true as const, data };
}

export function fail(code: string, message: string) {
  return { success: false as const, error: { code, message } };
}
