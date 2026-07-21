import type { SeededProductCard } from "@/shared/types/product";

// 결제 화면으로 넘기는 주문 항목 계약 — 상세 "바로 구매"와 장바구니 두 곳에서
// 만들어 checkout이 소비하므로 shared에 둔다(페이지 간 임포트 방지).
// 상품 원본(가격/이미지/브랜드)은 카드 데이터를 그대로 승계해 재조회 없이 렌더.
export interface CheckoutItem {
  product: Pick<
    SeededProductCard,
    "productId" | "name" | "price" | "originalPrice" | "imageUrl"
  > &
    Partial<Pick<SeededProductCard, "brandName">>;
  // 옵션 표기는 진입 경로에 따라 다르다:
  // 상세 "바로 구매"는 그룹명→선택값 맵, 장바구니 경유는 서버가 준 optionName 문자열.
  options?: Record<string, string>;
  optionName?: string | null;
  // 주문 생성 시 서버로 보내는 옵션 식별자. 옵션 없는 상품은 null.
  optionId?: number | null;
  // 장바구니 경유 주문이면 이 값으로 cartItemIds[]를 만든다(바로 구매는 없음).
  cartItemId?: number;
  quantity: number;
}

// navigate("/checkout", { state })로 전달되는 페이로드.
// 새로고침 시 state가 사라지는 건 의도된 동작(주문 데이터는 서버 원본이 아직 없음).
export interface CheckoutState {
  items: CheckoutItem[];
}
