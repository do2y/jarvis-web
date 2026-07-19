import { api } from "./client";
import type { WishlistProduct } from "@/shared/types/wishlist";

// 찜 API (W-1~3) — 전부 로그인 필요. 게스트는 찜을 쓸 수 없다(구매·찜은 로그인 필요).

export async function fetchWishlist(): Promise<WishlistProduct[]> {
  const { data } = await api.get<{ items: WishlistProduct[] }>("/api/wishlist");
  return data.items;
}

// 찜 추가 — 이미 찜한 상품이면 409 WISHLIST_DUPLICATE.
// 챗봇 상품 카드의 찜 버튼도 LLM을 거치지 않고 이 API를 직접 호출한다.
export async function addWishlistItem(productId: number): Promise<void> {
  await api.post("/api/wishlist", { productId });
}

export async function removeWishlistItem(productId: number): Promise<void> {
  await api.delete(`/api/wishlist/${productId}`);
}