import { api } from "@/shared/api/client";
import type { ProductDetail, ProductReviewPage, ReviewSort } from "./types";

export async function fetchProductDetail(id: number): Promise<ProductDetail> {
  const { data } = await api.get<ProductDetail>(`/api/products/${id}`);
  return data;
}

// 상품 후기 (P-3) — 인증 불필요. 없는 상품이면 404 PRODUCT_NOT_FOUND.
// distribution은 명세엔 없으나 실제 응답에 포함된다(전체 별점 분포, 페이지와 무관).
export async function fetchProductReviews(
  id: number,
  params: { page?: number; size?: number; sort?: ReviewSort } = {},
): Promise<ProductReviewPage> {
  const { data } = await api.get<ProductReviewPage>(
    `/api/products/${id}/reviews`,
    { params },
  );
  return data;
}
