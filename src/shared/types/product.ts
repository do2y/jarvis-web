// 상세 캐시 시딩용 카드 계약 — ['products', id] 캐시 값의 형태.
// 챗봇·찜·최근 본·홈 카드가 이 형태로 시딩하고, 상세 페이지가 상세 응답 도착 전
// 렌더에 그대로 사용한다. 필드가 하나라도 빠지면 상세 렌더가 깨지므로
// 시딩은 반드시 useGoToProduct(shared/hooks)를 거쳐 이 타입으로 강제한다.
export interface SeededProductCard {
  productId: number;
  name: string;
  brandName: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
}
