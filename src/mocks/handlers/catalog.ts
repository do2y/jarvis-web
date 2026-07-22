import { http, HttpResponse } from "msw";
import type { RecentProduct } from "@/pages/mypage/types";
import { BASE, fail, ok } from "../shared";
import { MOCK_PRODUCT_OPTIONS, POPULAR_PRODUCTS } from "../data";

// 상품 후기 목 — product/types.ts ProductReview 계약(P-3). status=VISIBLE만 내려온다는 전제.
const MOCK_PRODUCT_REVIEWS = [
  {
    reviewId: 7,
    rating: 5,
    content: "재질이 좋고 마감도 깔끔해요. 사이즈는 평소대로 골랐습니다.",
    authorNickname: "지영",
    createdAt: "2026-07-01T12:00:00+09:00",
  },
  {
    reviewId: 6,
    rating: 4,
    content: "색상은 사진과 거의 비슷해요. 배송이 조금 느린 게 아쉬웠어요.",
    authorNickname: "소현",
    createdAt: "2026-06-24T09:12:00+09:00",
  },
  {
    reviewId: 5,
    rating: 5,
    content: "가격 대비 만족스러워요. 재구매 의사 있습니다.",
    authorNickname: "라서",
    createdAt: "2026-06-18T18:40:00+09:00",
  },
  {
    reviewId: 4,
    rating: 3,
    content: "무난합니다. 특별히 좋지도 나쁘지도 않아요.",
    authorNickname: "수아",
    createdAt: "2026-06-02T11:05:00+09:00",
  },
];

// 최근 본 상품 목 — mypage/types.ts RecentProduct 계약(찜 목록과 동일한 카드 필드).
// 서버가 product_view에서 중복 제거해 최신순으로 준 것을 그대로 쓴다(viewedAt 없음).
const MOCK_RECENT_PRODUCTS: RecentProduct[] = [
  {
    productId: 301,
    name: "에센셜 크루넥 반팔 티셔츠",
    brandName: "더센트",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20230724/3421211/3421211_17803608469427_big.jpg?w=1200",
    price: 92000,
    originalPrice: 230000,
    rating: 4.9,
    reviewCount: 2847,
    purchasable: true,
  },
  {
    productId: 203,
    name: "피그먼트 워시드 오버핏 티셔츠 EH2241",
    brandName: "에르모사",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20240328/4002805/4002805_17331895953907_big.jpg?w=1200",
    price: 145000,
    originalPrice: 145000,
    rating: 4.8,
    reviewCount: 1204,
    purchasable: true,
  },
  {
    productId: 306,
    name: "소프트 코튼 크루넥 반팔 티셔츠",
    brandName: "르블랑",
    imageUrl:
      "https://img.29cm.co.kr/item/202606/11f16f98cff926419090358d89120339.png?width=1440&format=webp",
    price: 89000,
    originalPrice: 112000,
    rating: 4.5,
    reviewCount: 640,
    purchasable: true,
  },
  {
    productId: 202,
    name: "코튼 릴렉스 반팔 티셔츠 NVOP3300",
    brandName: "라인어디션",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20251015/5593843/5593843_17652503983820_big.png?w=1200",
    price: 118000,
    originalPrice: 148000,
    rating: 4.6,
    reviewCount: 812,
    purchasable: true,
  },
  {
    productId: 205,
    name: "드롭숄더 하프 슬리브 티셔츠 FL7788",
    brandName: "라인어디션",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20260505/6421311/6421311_17779600135524_big.jpg?w=1200",
    price: 108000,
    originalPrice: 135000,
    rating: 4.4,
    reviewCount: 356,
    purchasable: true,
  },
  {
    productId: 204,
    name: "코튼 오버핏 반팔 티셔츠 CH1020",
    brandName: "데일리로브",
    imageUrl:
      "https://img.29cm.co.kr/item/202604/11f132e7cad3859a9ec501cbcc2e8a97.jpg?width=720&format=webp",
    price: 64000,
    originalPrice: 79000,
    rating: 4.3,
    reviewCount: 211,
    purchasable: true,
  },
  {
    productId: 303,
    name: "헤비웨이트 오버핏 티셔츠 TSKN1801",
    brandName: "더센트",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20260618/6694104/6694104_17817540562281_big.jpg?w=1200",
    price: 89000,
    originalPrice: 112000,
    rating: 4.7,
    reviewCount: 933,
    purchasable: true,
  },
  {
    productId: 206,
    name: "가먼트 다잉 포켓 티셔츠 DT3311",
    brandName: "쁘띠메종",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/prd_img/20260618/6694104/detail_6694104_17817540680127_big.jpg?w=1200",
    price: 73000,
    originalPrice: 89000,
    rating: 4.2,
    reviewCount: 97,
    purchasable: false,
  },
];

// ⚠ 등록 순서 주의: /api/products/popular·recommended·recent 같은 고정 경로는
// /api/products/:productId 캐치올보다 먼저 있어야 한다(뒤에 두면 상세로 잡혀 404).
export const catalogHandlers = [
  // 카테고리 2단 트리 — API 명세: { success, data: { categories: [...] } }.
  // emoji는 백엔드 미제공 → 프론트 categoryEmoji 매핑.
  http.get(`${BASE}/api/categories`, () =>
    HttpResponse.json(
      ok({
        categories: [
          {
            id: 1,
            name: "패션",
            children: [
              { id: 11, name: "남성 상의" },
              { id: 12, name: "여성 상의" },
              { id: 13, name: "신발" },
            ],
          },
          {
            id: 2,
            name: "뷰티",
            children: [
              { id: 14, name: "스킨케어" },
              { id: 15, name: "메이크업" },
              { id: 16, name: "헤어케어" },
            ],
          },
          {
            id: 3,
            name: "식품",
            children: [
              { id: 17, name: "건강식품" },
              { id: 18, name: "간편식" },
              { id: 19, name: "음료" },
            ],
          },
          {
            id: 4,
            name: "가전",
            children: [
              { id: 20, name: "주방가전" },
              { id: 21, name: "생활가전" },
              { id: 22, name: "음향기기" },
            ],
          },
        ],
      }),
    ),
  ),

  // 인기상품 (P-4) — 파라미터는 size(기본 12, 1~50)뿐. 범위 밖은 400 VALIDATION_ERROR.
  http.get(`${BASE}/api/products/popular`, ({ request }) => {
    const params = new URL(request.url).searchParams;
    const sizeParam = params.get("size");
    const size = sizeParam === null ? 12 : Number(sizeParam);
    if (!Number.isInteger(size) || size < 1 || size > 50) {
      return HttpResponse.json(
        fail("VALIDATION_ERROR", "size는 1~50 사이여야 합니다."),
        { status: 400 },
      );
    }
    // API 명세: { success, data: { items: [...] } }
    return HttpResponse.json(ok({ items: POPULAR_PRODUCTS.slice(0, size) }));
  }),

  // 상품 후기 (P-3) — distribution은 페이지와 무관한 전체 별점 분포.
  http.get(`${BASE}/api/products/:productId/reviews`, ({ request, params }) => {
    const id = Number(params.productId);
    if (!POPULAR_PRODUCTS.some((p) => p.productId === id)) {
      return HttpResponse.json(
        fail("PRODUCT_NOT_FOUND", "상품을 찾을 수 없습니다."),
        { status: 404 },
      );
    }
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 10);
    const sort = url.searchParams.get("sort") ?? "latest";

    const sorted =
      sort === "rating"
        ? [...MOCK_PRODUCT_REVIEWS].sort((a, b) => b.rating - a.rating)
        : [...MOCK_PRODUCT_REVIEWS].sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt),
          );
    const start = page * size;

    // distribution은 page=0 응답에만 포함(명세) — FE가 0페이지 값을 재사용하는지
    // 목에서도 검증되도록 page>=1에서는 생략한다.
    const distribution =
      page === 0
        ? MOCK_PRODUCT_REVIEWS.reduce(
            (acc, r) => {
              acc[String(r.rating) as keyof typeof acc] += 1;
              return acc;
            },
            { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
          )
        : undefined;

    return HttpResponse.json(
      ok({
        content: sorted.slice(start, start + size),
        ...(distribution ? { distribution } : {}),
        page,
        size,
        totalElements: MOCK_PRODUCT_REVIEWS.length,
        totalPages: Math.ceil(MOCK_PRODUCT_REVIEWS.length / size),
      }),
    );
  }),

  // 개인화 추천 (P-5) — 로그인 필수. AT 없으면 401.
  // FastAPI 실패·신규 회원은 백엔드가 인기상품으로 대체하므로 목도 항상 200 + items.
  http.get(`${BASE}/api/products/recommended`, ({ request }) => {
    if (!request.headers.get("Authorization")) {
      // AT 자체가 없음 → 재발급 대상이 아니므로 AUTH_REQUIRED (401 2종 규약).
      // AUTH_TOKEN_EXPIRED는 AT가 있으나 만료된 경우에만 쓴다.
      return HttpResponse.json(fail("AUTH_REQUIRED", "로그인이 필요합니다."), {
        status: 401,
      });
    }
    // 인기상품과 다른 셋임을 눈으로 구분하려고 뒤에서부터 4개
    return HttpResponse.json(ok({ items: POPULAR_PRODUCTS.slice(-4) }));
  }),

  // 최근 본 상품 — 로그인 필요. behavior_events의 product_view 기반(중복 제거 후 최신 20개).
  http.get(`${BASE}/api/products/recent`, ({ request }) => {
    if (!request.headers.get("Authorization")) {
      return HttpResponse.json(fail("AUTH_REQUIRED", "로그인이 필요합니다."), {
        status: 401,
      });
    }
    return HttpResponse.json(ok({ items: MOCK_RECENT_PRODUCTS.slice(0, 20) }));
  }),

  // 상품 상세 (P-2) — 인기상품 목에서 기본 정보를 빌려 상세 계약 형태로 조립.
  // 없는 ID는 404 PRODUCT_NOT_FOUND.
  http.get(`${BASE}/api/products/:productId`, ({ params }) => {
    const id = Number(params.productId);
    const base = POPULAR_PRODUCTS.find((p) => p.productId === id);
    if (!base) {
      return HttpResponse.json(
        fail("PRODUCT_NOT_FOUND", "상품을 찾을 수 없습니다."),
        { status: 404 },
      );
    }
    return HttpResponse.json(
      ok({
        id: base.productId,
        name: base.name,
        imageUrl: base.imageUrl,
        price: base.price,
        originalPrice: base.originalPrice,
        // 담기(C-2)와 같은 재고 소스를 봐야 "재고 부족" 검증이 일관된다.
        stockQuantity: base.stock,
        purchasable: base.purchasable,
        status: "ON_SALE",
        summary: `${base.name} 상품 요약`,
        description: "<p>상세 설명</p>",
        attributes: { 소재: "코튼 100%", 핏: "오버핏" },
        category: { id: 1, name: "패션" },
        brand: { id: 1, name: base.brandName, logoUrl: base.imageUrl },
        options: MOCK_PRODUCT_OPTIONS,
        rating: { average: base.rating, count: base.reviewCount },
      }),
    );
  }),
];
