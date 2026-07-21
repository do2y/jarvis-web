import { http, HttpResponse } from "msw";
import type { WishlistProduct } from "@/shared/types/wishlist";
import { BASE, fail, ok } from "../shared";
import { POPULAR_PRODUCTS } from "../data";

// 찜한 상품 목 — shared/types/wishlist.ts WishlistProduct 계약(W-1).
// 정렬은 서버가 최신순으로 내려준 것을 그대로 쓴다(응답에 wishedAt은 없음).
// let: 찜 추가·해제에서 배열을 갈아끼워 목에도 반영.
let mockWishlist: WishlistProduct[] = [
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
  // 품절 케이스 — 찜 목록에는 남고 구매만 막힌다
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

export const wishlistHandlers = [
  // 찜 목록 (W-1) — 로그인 필요. 응답 키는 items(명세).
  http.get(`${BASE}/api/wishlist`, ({ request }) => {
    if (!request.headers.get("Authorization")) {
      return HttpResponse.json(fail("AUTH_REQUIRED", "로그인이 필요합니다."), {
        status: 401,
      });
    }
    return HttpResponse.json(ok({ items: mockWishlist }));
  }),

  // 찜 추가 (W-2) — 이미 찜한 상품이면 409 WISHLIST_DUPLICATE.
  http.post(`${BASE}/api/wishlist`, async ({ request }) => {
    if (!request.headers.get("Authorization")) {
      return HttpResponse.json(fail("AUTH_REQUIRED", "로그인이 필요합니다."), {
        status: 401,
      });
    }
    const { productId } = (await request.json()) as { productId: number };
    if (mockWishlist.some((p) => p.productId === productId)) {
      return HttpResponse.json(
        fail("WISHLIST_DUPLICATE", "이미 찜한 상품입니다."),
        { status: 409 },
      );
    }
    const base = POPULAR_PRODUCTS.find((p) => p.productId === productId);
    if (!base) {
      return HttpResponse.json(
        fail("PRODUCT_NOT_FOUND", "상품을 찾을 수 없습니다."),
        { status: 404 },
      );
    }
    // 최신순이므로 맨 앞에 추가
    mockWishlist = [base, ...mockWishlist];
    return HttpResponse.json(ok({ productId }));
  }),

  // 찜 해제 (W-3) — wishlistId가 아니라 productId 기준. 200 + data: null.
  // 찜하지 않은 상품이면 404. 목에서도 반영되도록 모듈 배열에서 제거한다.
  http.delete(`${BASE}/api/wishlist/:productId`, ({ params, request }) => {
    if (!request.headers.get("Authorization")) {
      return HttpResponse.json(fail("AUTH_REQUIRED", "로그인이 필요합니다."), {
        status: 401,
      });
    }
    const id = Number(params.productId);
    if (!mockWishlist.some((p) => p.productId === id)) {
      return HttpResponse.json(
        fail("WISHLIST_NOT_FOUND", "찜하지 않은 상품입니다."),
        { status: 404 },
      );
    }
    mockWishlist = mockWishlist.filter((p) => p.productId !== id);
    return HttpResponse.json(ok(null));
  }),
];
