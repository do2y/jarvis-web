// 찜한 상품 — 백엔드 GET /api/wishlist 계약과 1:1.
// 마이페이지 찜 목록·상품 상세·챗봇 카드가 함께 쓰므로 shared에 둔다.
// 상세 진입 시 캐시 시딩이 가능하도록 카드 수준 데이터를 그대로 포함한다.
export interface WishlistProduct {
  productId: number;
  name: string;
  brandName: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  purchasable: boolean;
}