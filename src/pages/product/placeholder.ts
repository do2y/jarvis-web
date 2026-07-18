const IMG = (seed: string) => `https://picsum.photos/seed/${seed}/600/600`;

// 연관 추천 2종(함께 구매/대체)은 계약 미확정(05 OPEN).
// GET /api/products/{id}/related 확정 시 이 파일을 지우고 API로 교체한다.
// 갤러리·옵션·스펙·리뷰는 실 API로 연결 완료.
export const PLACEHOLDER_DETAIL = {
  frequentlyBought: [
    {
      productId: 9001,
      name: "골드 미니 클러치백",
      brandName: "르블랑",
      price: 49000,
      imageUrl: IMG("fb-1"),
    },
    {
      productId: 9002,
      name: "스틸레토 앵클 스트랩 힐",
      brandName: "슈에드",
      price: 89000,
      imageUrl: IMG("fb-2"),
    },
    {
      productId: 9003,
      name: "펄 드롭 이어링",
      brandName: "아뜨리에",
      price: 28000,
      imageUrl: IMG("fb-3"),
    },
    {
      productId: 9004,
      name: "쉬어 메시 스타킹",
      brandName: "필로프트",
      price: 18000,
      imageUrl: IMG("fb-4"),
    },
  ],

  alternatives: [
    {
      productId: 9101,
      name: "플리츠 새틴 롱 원피스 EH2241",
      brandName: "에포모사",
      price: 145000,
      imageUrl: IMG("alt-1"),
      reason: "비슷한 우아한 분위기에 소재가 더 고급스러워요.",
    },
    {
      productId: 9102,
      name: "오프숄더 시폰 미디 드레스 LB-D221",
      brandName: "르블랑",
      price: 89000,
      imageUrl: IMG("alt-2"),
      reason: "조금 더 로맨틱한 분위기를 원하신다면요.",
    },
    {
      productId: 9103,
      name: "새틴 드레이프 원피스 NVOP3300",
      brandName: "라인에디션",
      price: 118000,
      imageUrl: IMG("alt-3"),
      reason: "광택 소재로 더 드레시한 느낌을 줄 수 있어요.",
    },
  ],
};
