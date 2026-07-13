// 마이페이지 데이터 계약 — mocks/handlers.ts와 1:1. 변경 시 목과 함께 갱신.

// 주문 건별 배송 상태 (별도 배송 조회 페이지 없음 — 이 값으로 상태 표시)
export type OrderStatus =
  | "PREPARING" // 배송준비중
  | "SHIPPING" // 배송중
  | "DELIVERED" // 배송완료
  | "CONFIRMED"; // 구매확정

// 주문 항목 — 상세 캐시 시딩을 위해 카드 수준 데이터를 포함(브랜드/이미지/가격)
export interface OrderItem {
  productId: number;
  name: string;
  brand: string;
  imageUrl: string;
  option: string; // "아이보리 / S" 형태 표시값
  quantity: number;
  price: number; // 결제 단가
}

export interface Order {
  orderId: string; // "ORD-20250601"
  orderedAt: string; // ISO 날짜 (YYYY-MM-DD)
  status: OrderStatus;
  items: OrderItem[];
}

// 최근 본 상품 — 카드 표시용. 상세 진입 시 캐시 시딩하도록 카드 수준 데이터 포함.
// viewedAt으로 최신순 정렬(서버가 정렬해 내려주는 것을 기준으로 표시).
export interface RecentProduct {
  productId: number;
  name: string;
  brand: string;
  imageUrl: string;
  price: number;
  viewedAt: string; // ISO 일시 — 최신순 정렬 기준
}

// 찜한 상품 — 카드 표시용(상세 캐시 시딩) + 찜 등록 시각(최신순 정렬 기준).
export interface WishlistProduct {
  productId: number;
  name: string;
  brand: string;
  imageUrl: string;
  price: number;
  wishedAt: string; // ISO 일시 — 최신순 정렬 기준
}

// 취소·반품·교환 신청 종류
export type ClaimType =
  | "CANCEL" // 취소 (배송 전)
  | "RETURN" // 반품(환불)
  | "EXCHANGE"; // 교환

// 신청 처리 상태 (스크린샷: 처리중 / 완료)
export type ClaimStatus =
  | "REQUESTED" // 접수
  | "PROCESSING" // 처리중
  | "COMPLETED" // 완료
  | "REJECTED"; // 반려

export interface Claim {
  claimId: string; // "CLM-20250520"
  orderId: string; // 원 주문번호 "ORD-20250515"
  productId: number;
  productName: string;
  type: ClaimType;
  status: ClaimStatus;
  reason: string; // 사유 표시값 "단순 변심"
  requestedAt: string; // ISO 날짜 (YYYY-MM-DD) — 최신순 정렬 기준
}

// 후기 작성 요청 — 백엔드 POST /api/reviews 계약. 사진은 백엔드 붙을 때 필드 추가.
export interface CreateReviewRequest {
  orderId: string;
  productId: number;
  rating: number; // 1~5
  content: string;
}
