// 홈 화면 데이터 계약 — mocks/handlers.ts와 1:1. 변경 시 목과 함께 갱신.

export interface Category {
  categoryId: number;
  name: string; // 표시명 (칩은 #{name} 형태로 렌더)
  emoji: string; // 시안의 카테고리 아이콘 (임의 아이콘 대신 이모지 사용)
  productCount: number;
}

// 인기상품 카드 — 상세 캐시 시딩용 완전 데이터(브랜드/정가/할인/평점/이유 포함)
export interface PopularProduct {
  productId: number;
  name: string;
  brand: string;
  imageUrl: string;
  price: number; // 판매가
  listPrice: number; // 정가 (할인 전)
  discountRate: number; // %, 0이면 할인 없음
  rating: number;
  reviewCount: number;
  badge: string | null; // "추천" | "인기" 등, 없으면 null
  reason: string; // 추천 이유 한 줄
}
