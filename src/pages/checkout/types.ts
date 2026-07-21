import type { Address } from "@/shared/types/address";
import type { CheckoutItem } from "@/shared/types/checkout";

// 주문 항목 전달 계약(CheckoutItem·CheckoutState)은 상세·장바구니에서도 만들므로
// shared/types/checkout.ts로 승격됨. 이 파일에는 checkout 내부 계약만 남긴다.
export type { CheckoutItem, CheckoutState } from "@/shared/types/checkout";

// ── 주문 생성 (O-1) ────────────────────────────────────────────
// 라인아이템 출처는 cartItemIds / items 중 정확히 하나만 보낸다(둘 다·둘 다 없음 400).
// 금액 필드는 보내지 않는다 — 서버가 스냅샷 가격으로 재계산(클라이언트 신뢰 안 함).

export interface OrderAddressInput {
  recipient: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2?: string;
}

export interface DirectOrderItem {
  productId: number;
  optionId?: number;
  quantity: number;
}

export interface CreateOrderRequest {
  cartItemIds?: number[];
  items?: DirectOrderItem[];
  addressId?: number;
  address?: OrderAddressInput;
  deliveryRequest?: string;
  paymentMethod: PaymentMethod;
}

// MOCK_FAIL은 무조건 실패(시연 재현용), 그 외는 무조건 성공 — 랜덤 실패 없음.
export type PaymentMethod = "MOCK_CARD" | "MOCK_FAIL";

// 결제 성공·실패 모두 HTTP 200. 결과는 status로 구분한다.
export interface CreateOrderResponse {
  orderId: number;
  orderNo: string;
  status: "PAID" | "PAYMENT_FAILED";
}

// 배송지 타입은 마이페이지와 공유 — shared/types/address.ts 참조.

// 결제 완료 후 완료 화면으로 넘기는 주문 결과.
// orderId·orderNo는 서버가 발급한 값. 금액은 화면 표시용(정본은 주문 상세 API).
export interface OrderResult {
  orderId: number;
  orderNo: string;
  items: CheckoutItem[];
  address: Address;
  method: string;
  itemsTotal: number;
  discount: number;
  finalTotal: number;
}

// navigate("/checkout/complete", { state })로 전달되는 페이로드.
export interface OrderCompleteState {
  order: OrderResult;
}
