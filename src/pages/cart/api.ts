import { api } from "@/shared/api/client";
import type { CartRecommendation } from "./types";

export async function fetchCartRecommendations(): Promise<
  CartRecommendation[]
> {
  const { data } = await api.get<{ products: CartRecommendation[] }>(
    "/api/cart/recommendations",
  );
  return data.products;
}

// 담기(addCartItem)는 상세·챗봇·찜에서도 쓰므로 shared/api/cart.ts로 승격됨.

// 수량 변경 (C-3) — 게스트 허용(본인 소유 아이템만). quantity 1~99.
// 남의 아이템이면 403 AUTH_FORBIDDEN, 없는 항목이면 404 CART_ITEM_NOT_FOUND.
export async function updateCartQuantity(
  cartItemId: number,
  quantity: number,
): Promise<{ cartItemId: number; quantity: number }> {
  const { data } = await api.patch<{ cartItemId: number; quantity: number }>(
    `/api/cart/items/${cartItemId}`,
    { quantity },
  );
  return data;
}

export async function removeCartItem(cartItemId: number): Promise<void> {
  await api.delete(`/api/cart/items/${cartItemId}`);
}
