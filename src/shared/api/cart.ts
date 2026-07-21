import { api } from "./client";
import type { Cart } from "@/shared/types/cart";

// 장바구니 조회 (C-1) — 게스트도 가능(guest_id 쿠키). client의 withCredentials로 쿠키 동봉.
// 헤더 뱃지가 여러 페이지에서 이 데이터를 쓰므로 shared에 둔다(장바구니 페이지 전용 아님).
export async function fetchCart(): Promise<Cart> {
  const { data } = await api.get<Cart>("/api/cart");
  return data;
}

// 담기 (C-2) — 동일 상품+옵션이 이미 있으면 서버가 수량을 합산한다.
// 응답 quantity는 합산 결과라 요청 수량과 다를 수 있다.
// 상품 상세·챗봇 카드·찜 목록이 함께 쓰므로 shared에 둔다.
export async function addCartItem(body: {
  productId: number;
  optionId?: number | null;
  quantity: number;
}): Promise<{ cartItemId: number; quantity: number }> {
  const { productId, optionId, quantity } = body;
  const { data } = await api.post<{ cartItemId: number; quantity: number }>(
    "/api/cart/items",
    {
      productId,
      quantity,
      ...(optionId != null ? { optionId } : {}),
    },
  );
  return data;
}
