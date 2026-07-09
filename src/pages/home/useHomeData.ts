import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchPopularProducts } from "./api";

const THIRTY_MIN = 30 * 60 * 1000;

// 카테고리는 정적 데이터 → staleTime 30분 (CLAUDE.md React Query 규칙)
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: THIRTY_MIN,
  });
}

// 인기상품도 자주 바뀌지 않는 큐레이션 → 30분
export function usePopularProducts() {
  return useQuery({
    queryKey: ["products", "popular"],
    queryFn: fetchPopularProducts,
    staleTime: THIRTY_MIN,
  });
}
