// 마이페이지 데이터 계약 — mocks/handlers.ts와 1:1. 변경 시 목과 함께 갱신.

// 주문 상태 — 아이템 단위 상태. 주문 대표 상태(representativeStatus)도 같은 값을 쓴다.
// 명세에는 한국어 표시 문자열("배송중")로 적혀 있으나 실제 응답은 영문 enum이라
// 여기에 맞추고 표시 문자열은 프론트에서 매핑한다(ORDER_STATUS_LABEL).
// 취소·반품은 주문 상태가 아니라 클레임(Claim)으로 관리된다. 주문 쪽은 진행 여부만
// CLAIM_IN_PROGRESS로 알리고, 취소/반품 구분과 처리 단계는 Claim이 답한다.
export type OrderStatus =
  | "PENDING" // 결제 대기
  | "PAYMENT_FAILED" // 결제 실패 — 재결제 가능
  | "ORDERED" // 주문 완료
  | "SHIPPING" // 배송중
  | "DELIVERED" // 배송 완료
  | "CONFIRMED" // 구매확정
  | "CLAIM_IN_PROGRESS" // 취소·반품 처리 중
  | "COMPLETED"; // 처리 완료(클레임 종결 포함)

// 알 수 없는 상태가 와도 화면이 깨지지 않도록 fallback을 둔다
// (백엔드가 상태를 추가해도 목록은 계속 뜨게).
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "결제 대기",
  PAYMENT_FAILED: "결제 실패",
  ORDERED: "주문 완료",
  SHIPPING: "배송중",
  DELIVERED: "배송 완료",
  CONFIRMED: "구매확정",
  CLAIM_IN_PROGRESS: "취소/반품 처리중",
  COMPLETED: "처리 완료",
};

// 주문 항목 — 상세 캐시 시딩을 위해 카드 수준 데이터를 포함(이미지/가격).
export interface OrderItem {
  orderItemId: number;
  productId: number;
  productName: string;
  imageUrl: string;
  optionName: string | null; // 옵션 없는 상품은 null
  quantity: number;
  price: number; // 주문 시점 스냅샷 단가
  status: OrderStatus;
}

export interface Order {
  orderId: number;
  orderNo: string; // "ORD-20260713-1001" — 파생값(저장 안 함)
  orderedAt: string; // ISO 일시
  representativeStatus: OrderStatus; // 아이템 상태들에서 도출한 대표 상태
  totalAmount: number;
  items: OrderItem[];
}

// 페이지네이션 응답 — GET /api/orders는 { content, page, size, ... } 형태.
export interface OrderPage {
  content: Order[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// 주문 배송지 스냅샷 — 주문 시점 배송 정보(현재 배송지 관리와 별개로 고정 저장).
export interface OrderShipping {
  recipient: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2?: string | null;
}

// 주문 결제 상태 — 배송 진행 상태(OrderStatus)와 별개 축이다.
export type OrderPaymentStatus = "PENDING" | "PAID" | "PAYMENT_FAILED";

// 주문 상세 아이템 — 목록 아이템에 원가와 액션 가능 여부가 더해진다.
export interface OrderDetailItem extends OrderItem {
  originalPrice: number;
  canCancel: boolean;
  canReturn: boolean;
  canReview: boolean;
}

// 주문 상세 — 단건 조회 응답. 금액 분해(할인·배송비)는 서버가 주지 않아
// 화면에서 items로 계산한다.
export interface OrderDetail extends Omit<Order, "items"> {
  status: OrderPaymentStatus;
  paymentMethod: string; // "MOCK_CARD" 등
  paidAt: string | null;
  // 주문 1회성 배송 지시 — 값이 없으면 키 자체가 생략된다.
  deliveryRequest?: string;
  address: OrderShipping;
  items: OrderDetailItem[];
}

// 최근 본 상품 — behavior_events의 product_view 기반(중복 제거 후 최신 20개).
// 정렬은 서버가 최신순으로 내려준 것을 그대로 쓴다(응답에 viewedAt은 없음).
// 필드 구성은 찜 목록(WishlistProduct)과 동일한 카드 계약이다.
export interface RecentProduct {
  productId: number;
  name: string;
  brandName: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  purchasable: boolean; // HIDDEN 상품도 목록에 유지되므로 false일 수 있다
}

// 찜 타입은 상품 상세·챗봇과 공유 — shared/types/wishlist.ts 참조.

// 취소·반품 신청 종류
export type ClaimType =
  | "CANCEL" // 취소 (배송 전)
  | "RETURN"; // 반품(환불)

// 신청 처리 상태 (스크린샷: 처리중 / 완료)
export type ClaimStatus =
  | "REQUESTED" // 접수
  | "PROCESSING" // 처리중
  | "COMPLETED" // 완료
  | "REJECTED"; // 반려

// 취소·반품 내역 항목 — GET /api/claims 계약.
// 상품 식별은 orderItemId(주문 줄)이며 productId는 내려오지 않는다.
export interface Claim {
  claimId: number;
  orderNo: string; // 원 주문번호 "ORD-20260713-1001"
  type: ClaimType;
  status: ClaimStatus;
  reason: string; // 사유 표시값 "단순 변심"
  requestedAt: string; // ISO 일시(+09:00) — 최신순 정렬 기준
  processedAt: string | null; // 미처리 시 null
  orderItemId: number;
  productName: string;
  optionName: string | null;
  quantity: number;
  refundAmount: number; // price × quantity
}

// 페이지네이션 응답 — GET /api/claims는 { content, page, size, ... } 형태.
export interface ClaimPage {
  content: Claim[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// 취소·반품 신청 요청 — POST /api/order-items/{orderItemId}/claims 계약.
// 대상은 path의 orderItemId로 지정하므로 body에는 종류·사유만 담는다.
// (같은 상품을 옵션만 다르게 담은 주문에서 orderId+productId는 줄을 특정하지 못한다)
export interface CreateClaimRequest {
  type: ClaimType;
  reason?: string;
}

// 신청 접수 응답 — 목록의 Claim과 달리 id가 number다(백엔드 PK).
export interface CreateClaimResponse {
  claimId: number;
  orderItemId: number;
  type: ClaimType;
  status: ClaimStatus;
  requestedAt: string; // ISO 일시(+09:00)
}

// 문의 처리 상태 (스크린샷: 처리중 / 답변완료) — 문의 챗봇에서 접수, 읽기 전용.
export type InquiryStatus =
  | "PENDING" // 처리중 (관리자 답변 대기)
  | "ANSWERED"; // 답변완료

// 문의 내역 — 문의 챗봇(9번)에서 접수한 문의. 답변완료 시 answer 포함.
export interface Inquiry {
  inquiryId: string; // "INQ-20250602"
  title: string; // "환불 처리 기간이 얼마나 걸리나요?"
  status: InquiryStatus;
  content: string; // 문의 본문
  answer: string | null; // 답변 (PENDING이면 null)
  createdAt: string; // ISO 날짜 (YYYY-MM-DD) — 최신순 정렬 기준
  answeredAt: string | null; // 답변 일시 (PENDING이면 null)
}

// 후기 작성 요청 — POST /api/reviews 계약. 대상은 주문 줄(orderItemId) 기준.
// 등록만 지원하며 수정·삭제 API는 없다(02 D29). 사진은 백엔드 붙을 때 필드 추가.
export interface CreateReviewRequest {
  orderItemId: number;
  rating: number; // 1~5 정수
  content: string; // 최대 2000자
}

// 후기 등록 응답 — 작성 후 상품 리뷰 캐시 무효화에 productId가 필요하다.
export interface CreateReviewResponse {
  reviewId: number;
  orderItemId: number;
  productId: number;
  rating: number;
  content: string;
  createdAt: string; // ISO 일시(+09:00)
}

// 배송지 타입은 결제 화면과 공유 — shared/types/address.ts 참조.
