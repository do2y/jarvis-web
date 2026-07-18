import { useQuery } from "@tanstack/react-query";
import type { ProductCard } from "@/shared/types/chat";
import { fetchProductDetail, fetchProductReviews } from "./api";
import type { ReviewSort } from "./types";

const FIVE_MIN = 5 * 60 * 1000;

// 상품 상세 — staleTime 5분 (CLAUDE.md React Query 규칙).
// 키를 ['products', id, 'detail']로 분리한 이유: ['products', id]에는 챗봇·마이페이지 등이
// ProductCard(부분 데이터)를 시딩해두는데 상세 응답과 구조가 달라(brandName vs brand.name,
// rating: number vs rating: {average,count}) 같은 키를 쓰면 캐시가 섞여 렌더가 깨진다.
export function useProductDetail(id: number) {
  return useQuery({
    queryKey: ["products", id, "detail"],
    queryFn: () => fetchProductDetail(id),
    enabled: Number.isFinite(id),
    staleTime: FIVE_MIN,
  });
}

// 상품 후기 — 상세와 함께 갱신되면 되므로 staleTime 5분.
// page/sort가 키에 들어가 페이지 전환 시 각각 캐시된다.
export function useProductReviews(
  id: number,
  params: { page?: number; size?: number; sort?: ReviewSort } = {},
) {
  const { page = 0, size = 10, sort = "latest" } = params;

  return useQuery({
    queryKey: ["products", id, "reviews", { page, size, sort }],
    queryFn: () => fetchProductReviews(id, { page, size, sort }),
    enabled: Number.isFinite(id),
    staleTime: FIVE_MIN,
  });
}

// 카드 시딩 데이터 — 상세 도착 전 즉시 렌더용(캐시 승계).
// queryFn이 없어 네트워크 요청을 만들지 않고, 시딩된 값이 있으면 그것만 읽는다.
export function useSeededProductCard(id: number) {
  return useQuery<ProductCard>({
    queryKey: ["products", id],
    enabled: Number.isFinite(id),
    staleTime: FIVE_MIN,
  });
}
