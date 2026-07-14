import { api } from "@/shared/api/client";
import type { CartItem, CartRecommendation } from "./types";

export async function fetchCart(): Promise<CartItem[]> {
  const { data } = await api.get<{ items: CartItem[] }>("/api/cart");
  return data.items;
}

export async function fetchCartRecommendations(): Promise<CartRecommendation[]> {
  const { data } = await api.get<{ products: CartRecommendation[] }>(
    "/api/cart/recommendations",
  );
  return data.products;
}

export async function updateCartQuantity(
  cartItemId: string,
  quantity: number,
): Promise<void> {
  await api.patch(`/api/cart/${cartItemId}`, { quantity });
}

export async function removeCartItem(cartItemId: string): Promise<void> {
  await api.delete(`/api/cart/${cartItemId}`);
}
