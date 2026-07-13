import { api } from "@/shared/api/client";
import type { Order, RecentProduct, WishlistProduct } from "./types";

export async function fetchOrders(): Promise<Order[]> {
  const { data } = await api.get<{ orders: Order[] }>("/api/mypage/orders");
  return data.orders;
}

export async function fetchRecentProducts(): Promise<RecentProduct[]> {
  const { data } = await api.get<{ products: RecentProduct[] }>(
    "/api/mypage/recent-products",
  );
  return data.products;
}

export async function fetchWishlist(): Promise<WishlistProduct[]> {
  const { data } = await api.get<{ products: WishlistProduct[] }>(
    "/api/wishlist",
  );
  return data.products;
}

export async function removeWishlistItem(productId: number): Promise<void> {
  await api.delete(`/api/wishlist/${productId}`);
}
