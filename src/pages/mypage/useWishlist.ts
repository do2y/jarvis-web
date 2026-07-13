import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWishlist, removeWishlistItem } from "./api";
import type { WishlistProduct } from "./types";

// 찜한 상품 — 서버 원본. 찜 해제로 자주 바뀌어 staleTime 0.
export function useWishlist() {
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: fetchWishlist,
    staleTime: 0,
  });
}

// 찜 해제 — 낙관적 업데이트로 즉시 목록에서 제거, 실패 시 롤백.
export function useRemoveWishlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => removeWishlistItem(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });
      const previous = queryClient.getQueryData<WishlistProduct[]>(["wishlist"]);
      queryClient.setQueryData<WishlistProduct[]>(["wishlist"], (old) =>
        old?.filter((p) => p.productId !== productId),
      );
      return { previous };
    },
    onError: (_err, _productId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["wishlist"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}
