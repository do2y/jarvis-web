import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addCartItem, fetchCart } from "@/shared/api/cart";
import { ApiError } from "@/shared/api/client";

// 장바구니 — 서버 원본. 수량·구성이 자주 바뀌어 staleTime 0 (CLAUDE.md 규칙).
// 헤더 뱃지와 장바구니 페이지가 같은 ['cart'] 키를 공유하므로,
// 담기·수량변경·삭제 후 invalidateQueries(['cart'])로 함께 갱신된다.
export function useCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: fetchCart,
    staleTime: 0,
  });
}

// 헤더 뱃지용 총 수량. 구매 불가(purchasable=false) 항목도 장바구니에 담겨 있으므로
// 개수에는 포함한다(합계 금액에서만 서버가 제외).
export function useCartItemCount(): number {
  const { data } = useCart();
  return data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

function toAddCartMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "CART_OPTION_REQUIRED") return "옵션을 선택해주세요.";
    if (error.code === "CART_OPTION_INVALID")
      return "선택한 옵션을 찾을 수 없어요.";
    if (error.code === "PRODUCT_NOT_FOUND") return "상품을 찾을 수 없어요.";
    // 검증 실패는 필드 사유("수량은 99 이하여야 합니다.")가 더 구체적이라 우선
    if (error.displayMessage) return error.displayMessage;
  }
  return "장바구니에 담지 못했어요. 잠시 후 다시 시도해주세요.";
}

// 담기 — 상품 상세·챗봇 카드·찜 목록이 함께 쓰므로 shared에 둔다.
// 자동 재시도 금지(중복 담기 방지, CLAUDE.md). 성공 시 ['cart'] 무효화로 헤더 뱃지 동기화.
export function useAddCartItem() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: addCartItem,
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  return {
    ...mutation,
    errorMessage: mutation.error ? toAddCartMessage(mutation.error) : null,
  };
}
