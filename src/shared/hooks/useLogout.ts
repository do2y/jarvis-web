import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { logout } from "@/shared/api/auth";
import { useAuthStore } from "@/shared/stores/authStore";

/**
 * 로그아웃 — 헤더 2곳(AppHeader·SellerHeader)에서 쓰므로 shared로 승격.
 * 한쪽만 API 호출을 빠뜨려 서버 RT가 남는 문제가 있어 훅으로 통일한다.
 */
export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return async () => {
    // 서버 RT 삭제 시도 → 성공/실패 무관하게 로컬 상태는 반드시 비우고 이동.
    // (네트워크 실패로 서버 호출이 안 돼도 로그인 상태로 남지 않도록)
    try {
      await logout();
    } finally {
      clearAuth();
      // 이전 사용자의 장바구니·주문·찜이 다음 로그인 때 잠깐 보이지 않도록 캐시 폐기
      queryClient.clear();
      navigate("/");
    }
  };
}
