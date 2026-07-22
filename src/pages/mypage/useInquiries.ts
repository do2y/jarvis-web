import { useQuery } from "@tanstack/react-query";
import { selectIsAuthReady, useAuthStore } from "@/shared/stores/authStore";
import { fetchInquiries } from "./api";

// 문의 내역 — 서버 원본, 답변 상태가 바뀔 수 있어 staleTime 0.
// 로그인 필수 — 복원 완료 전에 보내면 AT 없이 나가 401 → 로그인으로 튕긴다.
export function useInquiries() {
  const isAuthReady = useAuthStore(selectIsAuthReady);

  return useQuery({
    queryKey: ["inquiries"],
    queryFn: fetchInquiries,
    staleTime: 0,
    enabled: isAuthReady,
  });
}
