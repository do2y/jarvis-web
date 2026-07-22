import { useQuery } from "@tanstack/react-query";
import { selectIsAuthReady, useAuthStore } from "@/shared/stores/authStore";
import { fetchOrder, fetchOrders } from "./api";

// 주문 내역 — 서버 원본, 배송 상태가 바뀔 수 있어 staleTime 0 (CLAUDE.md 규칙)
// 페이지가 키에 들어가야 페이지 이동 시 각각 캐시된다.
// 로그인 필수 자원 — 복원 완료 전에 보내면 AT 없이 나가 401 → 로그인으로 튕긴다.
export function useOrders(page = 0, size = 10) {
  const isAuthReady = useAuthStore(selectIsAuthReady);

  return useQuery({
    queryKey: ["orders", { page, size }],
    queryFn: () => fetchOrders(page, size),
    staleTime: 0,
    enabled: isAuthReady,
  });
}

// 주문 상세 — 단건. 목록과 별개 키로 두어 배송지·결제 정보까지 캐시.
export function useOrder(orderId: number) {
  const isAuthReady = useAuthStore(selectIsAuthReady);

  return useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => fetchOrder(orderId),
    staleTime: 0,
    enabled: isAuthReady && Number.isFinite(orderId),
  });
}
