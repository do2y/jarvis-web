import { api } from "@/shared/api/client";
import type {
  Claim,
  CreateClaimRequest,
  CreateClaimResponse,
  CreateReviewRequest,
  Inquiry,
  OrderDetail,
  OrderPage,
  RecentProduct,
} from "./types";

// 주문 목록 — 페이지네이션. 응답이 { content, page, ... } 형태라 그대로 반환한다.
export async function fetchOrders(page = 0, size = 10): Promise<OrderPage> {
  const { data } = await api.get<OrderPage>("/api/orders", {
    params: { page, size },
  });
  return data;
}

export async function fetchOrder(orderId: number): Promise<OrderDetail> {
  const { data } = await api.get<OrderDetail>(`/api/orders/${orderId}`);
  return data;
}

export async function fetchRecentProducts(): Promise<RecentProduct[]> {
  const { data } = await api.get<{ products: RecentProduct[] }>(
    "/api/mypage/recent-products",
  );
  return data.products;
}


export async function fetchClaims(): Promise<Claim[]> {
  const { data } = await api.get<{ claims: Claim[] }>("/api/mypage/claims");
  return data.claims;
}

// 취소·반품 신청 접수 — 대상은 orderItemId(path). 성공 시 훅에서 claims 캐시 무효화.
// 허용 여부는 서버가 아이템 상태×타입 매트릭스로 판정한다(FE에서 중복 판단하지 않음).
export async function createClaim(
  orderItemId: number,
  body: CreateClaimRequest,
): Promise<CreateClaimResponse> {
  const { data } = await api.post<CreateClaimResponse>(
    `/api/order-items/${orderItemId}/claims`,
    body,
  );
  return data;
}

export async function createReview(body: CreateReviewRequest): Promise<void> {
  await api.post("/api/reviews", body);
}

// 문의 내역 — 읽기 전용(문의 챗봇에서 접수). 답변은 관리자가 등록.
export async function fetchInquiries(): Promise<Inquiry[]> {
  const { data } = await api.get<{ inquiries: Inquiry[] }>(
    "/api/mypage/inquiries",
  );
  return data.inquiries;
}

// 배송지 관리는 결제 화면과 같은 /api/addresses를 쓴다 — shared/api/address.ts 참조.
// (기존 /api/mypage/addresses는 백엔드에 없는 경로였음)
