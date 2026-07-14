// 장바구니 데이터 계약 — mocks/handlers.ts와 1:1. 변경 시 목과 함께 갱신.

// 장바구니 항목 — 상세 캐시 시딩·결제 이동을 위해 카드 수준 데이터를 포함.
export interface CartItem {
  cartItemId: string; // 장바구니 라인 식별(같은 상품 다른 옵션 구분)
  productId: number;
  name: string;
  brand: string;
  imageUrl: string;
  price: number; // 판매가(할인 적용가)
  originalPrice: number; // 정가 — 할인 표시·합산용
  options: Record<string, string>; // { 컬러: "아이보리", 사이즈: "S" }
  quantity: number;
}

// 함께 구매 추천 상품 — 카드 표시용.
export interface CartRecommendation {
  productId: number;
  name: string;
  brand: string;
  imageUrl: string;
  price: number;
}
