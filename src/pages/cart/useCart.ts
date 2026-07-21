import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/client";
import {
  fetchCartRecommendations,
  removeCartItem,
  updateCartQuantity,
} from "./api";
import type { Cart } from "./types";

// 담기(useAddCartItem)는 상세·챗봇·찜에서도 쓰므로 shared/hooks/useCart.ts로 승격됨.
export { useCart, useCartItemCount } from "@/shared/hooks/useCart";

export function useCartRecommendations() {
  return useQuery({
    queryKey: ["cart", "recommendations"],
    queryFn: fetchCartRecommendations,
    staleTime: 5 * 60 * 1000,
  });
}

// 수량 변경·삭제 실패 메시지. 검증 실패는 필드 사유("수량은 99 이하여야 합니다.")를
// 그대로 쓰고, 소유권·존재 오류는 상황을 설명하는 문구로 바꾼다.
function toCartMutationMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "AUTH_FORBIDDEN")
      return "이 항목을 변경할 권한이 없어요.";
    if (error.code === "CART_ITEM_NOT_FOUND")
      return "이미 삭제된 항목이에요.";
    if (error.displayMessage) return error.displayMessage;
  }
  return "장바구니를 변경하지 못했어요. 잠시 후 다시 시도해주세요.";
}

export function useCartMutations() {
  const queryClient = useQueryClient();

  const setQuantity = useMutation({
    mutationFn: (args: { cartItemId: number; quantity: number }) =>
      updateCartQuantity(args.cartItemId, args.quantity),
    retry: false,
    onMutate: async (args) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previous = queryClient.getQueryData<Cart>(["cart"]);
      if (previous) {
        queryClient.setQueryData<Cart>(["cart"], {
          ...previous,
          items: previous.items.map((it) =>
            it.cartItemId === args.cartItemId
              ? { ...it, quantity: args.quantity }
              : it,
          ),
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["cart"], ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const remove = useMutation({
    mutationFn: (cartItemId: number) => removeCartItem(cartItemId),
    retry: false,
    onMutate: async (cartItemId) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previous = queryClient.getQueryData<Cart>(["cart"]);
      if (previous) {
        queryClient.setQueryData<Cart>(["cart"], {
          ...previous,
          items: previous.items.filter((it) => it.cartItemId !== cartItemId),
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["cart"], ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  // 낙관적 반영이 롤백된 이유를 사용자가 알 수 있도록 실패 사유를 함께 노출.
  // 두 뮤테이션 중 최근 실패한 쪽의 메시지를 보여준다.
  const error = setQuantity.error ?? remove.error;

  return {
    setQuantity,
    remove,
    errorMessage: error ? toCartMutationMessage(error) : null,
  };
}
