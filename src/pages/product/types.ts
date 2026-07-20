// 상품 상세 데이터 계약 — 백엔드 GET /api/products/{id} 응답과 1:1.

export interface ProductOption {
  optionId: number;
  name: string; // "화이트/M" — 옵션값 조합
  extraPrice: number; // 옵션 추가금. 선택 시 단가 = price + extraPrice
}

export interface ProductBrand {
  id: number;
  name: string;
  logoUrl: string;
}

export interface ProductCategory {
  id: number;
  name: string;
}

// 리뷰 테이블 실시간 집계(status=VISIBLE만)
export interface ProductRating {
  average: number;
  count: number;
}

// 상품 후기 (P-3) — status=VISIBLE인 것만 내려온다.
export interface ProductReview {
  reviewId: number;
  rating: number;
  content: string;
  authorNickname: string;
  createdAt: string; // "2026-07-01T12:00:00+09:00" — 오프셋 포함(명세)
}

export type ReviewSort = "latest" | "rating";

// 별점 분포 — 키가 "5"~"1" 문자열로 오는 점에 주의(JSON 객체 키).
export type ReviewDistribution = Record<"1" | "2" | "3" | "4" | "5", number>;

export interface ProductReviewPage {
  content: ProductReview[];
  // page=0 응답에만 포함(후기 0개면 0값). page>=1은 생략되므로 FE가 0페이지 값을 재사용한다.
  distribution?: ReviewDistribution;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ProductDetail {
  id: number;
  name: string;
  imageUrl: string; // 대표 이미지 단일
  price: number; // 판매가
  originalPrice: number; // 정가
  summary: string;
  description: string;
  attributes: Record<string, string>; // { "소재": "린넨", "핏": "오버핏" }
  options: ProductOption[];
  brand: ProductBrand;
  category: ProductCategory;
  rating: ProductRating;
  status: string; // ON_SALE 등
  stockQuantity: number;
  purchasable: boolean;
}
