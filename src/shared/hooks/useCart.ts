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

// 재고 부족 — 서버가 합산 후 수량과 재고를 비교해 반환(02 D33). 프론트 수량 제한을
// 통과해도(이미 담긴 양 + 이번 요청 > 재고) 발생하므로 API 응답으로 최종 판정한다.
export function isStockInsufficientError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "CART_STOCK_INSUFFICIENT";
}

function toAddCartMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "CART_OPTION_REQUIRED") return "옵션을 선택해주세요.";
    if (error.code === "CART_OPTION_INVALID")
      return "선택한 옵션을 찾을 수 없어요.";
    if (error.code === "PRODUCT_NOT_FOUND") return "상품을 찾을 수 없어요.";
    // 재고 수량은 응답에 실려 오지 않을 수 있어(백엔드 정책) 수치 없이 안내한다.
    if (error.code === "CART_STOCK_INSUFFICIENT") return "재고가 부족해요.";
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
    // 재고 부족은 인라인이 아니라 다이얼로그로 알린다(상세 페이지에서 분기).
    isStockError: isStockInsufficientError(mutation.error),
  };
}
