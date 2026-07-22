import { useQuery } from "@tanstack/react-query";
import { selectIsAuthReady, useAuthStore } from "@/shared/stores/authStore";
import { fetchRecentProducts } from "./api";

// 최근 본 상품 — 서버 원본. 조회 즉시 갱신될 수 있어 staleTime 0.
// 게스트는 401이라 아예 호출하지 않는다(찜 목록과 동일).
export function useRecentProducts() {
  const isAuthReady = useAuthStore(selectIsAuthReady);

  return useQuery({
    // 키 컨벤션(소문자 배열 세그먼트) 통일 — 엔드포인트 /api/products/recent와 대응
    queryKey: ["products", "recent"],
    queryFn: fetchRecentProducts,
    staleTime: 0,
    enabled: isAuthReady,
  });
}
