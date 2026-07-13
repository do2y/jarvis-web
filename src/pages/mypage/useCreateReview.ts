import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReview } from "./api";
import type { CreateReviewRequest } from "./types";

// 후기 작성 — CLAUDE.md: 자동 재시도 금지(중복 등록 방지). 실패 시 화면에서 재시도.
// 성공 시 주문/상품 리뷰 캐시 무효화(작성 여부·평점 반영). 복귀 이동은 호출부에서.
export function useCreateReview() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (body: CreateReviewRequest) => createReview(body),
    retry: false,
    onSuccess: (_data, body) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products", body.productId] });
    },
  });

  return {
    ...mutation,
    errorMessage: mutation.isError
      ? "후기 등록에 실패했어요. 잠시 후 다시 시도해주세요."
      : null,
  };
}
