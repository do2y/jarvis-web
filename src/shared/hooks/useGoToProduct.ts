import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { SeededProductCard } from "@/shared/types/product";

// 카드 → 상세 진입(캐시 승계, CLAUDE.md). 카드 데이터를 ['products', id]에 시딩해
// 상세를 즉시 렌더하고 부족분만 백그라운드 페칭한다.
// 흩어져 있던 setQueryData 호출을 모아 시딩 필드 누락(상세 렌더 크래시)을 타입으로 막는다.
// 카드 데이터가 SeededProductCard를 채우지 못하면 시딩 없이 navigate만 할 것.
export function useGoToProduct() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return (card: SeededProductCard) => {
    queryClient.setQueryData<SeededProductCard>(
      ["products", card.productId],
      card,
    );
    navigate(`/products/${card.productId}`);
  };
}
