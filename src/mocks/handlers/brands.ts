import { http, HttpResponse } from "msw";
import type { Brand, BrandProduct } from "@/pages/brand/types";
import { BASE, fail, ok } from "../shared";

// 브랜드 홈 목 — pages/brand/types.ts 계약(GET /api/brands/{id}, 인증 불필요).
// 상품 이미지는 다른 목과 같은 외부 CDN을 쓴다(로컬 자산 없음).

// 목 내부 전용: 카테고리 필터를 서버처럼 처리하려면 상품이 어느 소분류인지 알아야 한다.
// 응답 계약에는 없는 필드라 내려보내기 전에 제거한다.
interface SeedProduct extends BrandProduct {
  categoryId: number;
  createdAt: string; // latest 정렬용
  salesRank: number; // popular 정렬용 (작을수록 인기)
}

const BRAND_CATEGORIES = [
  { id: 12, name: "원피스" },
  { id: 13, name: "스커트" },
  { id: 14, name: "블라우스" },
  { id: 15, name: "재킷" },
  { id: 16, name: "니트" },
  { id: 17, name: "팬츠" },
  { id: 18, name: "코트" },
];

const DESCENT: Brand = {
  id: 3,
  name: "더센트",
  logoUrl: "",
  description:
    "더센트는 현대적인 감각과 절제된 우아함을 추구하는 컨템포러리 여성 패션 브랜드입니다. 일상과 특별한 순간 모두에 어울리는 옷을 만들어요.",
  categories: BRAND_CATEGORIES,
};

const DESCENT_PRODUCTS: SeedProduct[] = [
  {
    productId: 401,
    name: "오버사이즈 울 블렌드 코트 TSCT3301",
    brandName: "더센트",
    price: 198000,
    originalPrice: 248000,
    imageUrl:
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80",
    rating: 4.9,
    reviewCount: 2104,
    purchasable: true,
    categoryId: 18,
    createdAt: "2026-05-02T10:00:00+09:00",
    salesRank: 1,
  },
  {
    productId: 402,
    name: "스테어넥 벨티드 미디 원피스 TSOP1180",
    brandName: "더센트",
    price: 92000,
    originalPrice: 230000,
    imageUrl:
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80",
    rating: 4.8,
    reviewCount: 1284,
    purchasable: true,
    categoryId: 12,
    createdAt: "2026-05-20T10:00:00+09:00",
    salesRank: 2,
  },
  {
    productId: 403,
    name: "메리노 울 터틀넥 니트 TSKN1801",
    brandName: "더센트",
    price: 89000,
    originalPrice: 112000,
    imageUrl:
      "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=80",
    rating: 4.6,
    reviewCount: 1102,
    purchasable: true,
    categoryId: 16,
    createdAt: "2026-04-11T10:00:00+09:00",
    salesRank: 3,
  },
  {
    productId: 404,
    name: "실크 터치 브이넥 블라우스 TSBL2103",
    brandName: "더센트",
    price: 54000,
    originalPrice: 72000,
    imageUrl:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
    rating: 4.7,
    reviewCount: 944,
    purchasable: true,
    categoryId: 14,
    createdAt: "2026-06-01T10:00:00+09:00",
    salesRank: 4,
  },
  {
    productId: 405,
    name: "린넨 와이드 팬츠 TSPT2201",
    brandName: "더센트",
    price: 78000,
    originalPrice: 78000,
    imageUrl:
      "https://images.unsplash.com/photo-1552874869-5c39ec9288dc?w=800&q=80",
    rating: 4.6,
    reviewCount: 832,
    purchasable: true,
    categoryId: 17,
    createdAt: "2026-07-05T10:00:00+09:00",
    salesRank: 5,
  },
  {
    productId: 406,
    name: "크롭 트위드 재킷 TSJK3205",
    brandName: "더센트",
    price: 148000,
    originalPrice: 148000,
    imageUrl:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    rating: 4.8,
    reviewCount: 713,
    purchasable: true,
    categoryId: 15,
    createdAt: "2026-07-10T10:00:00+09:00",
    salesRank: 6,
  },
  {
    productId: 407,
    name: "플리츠 미디 스커트 TSSK1402",
    brandName: "더센트",
    price: 62000,
    originalPrice: 62000,
    imageUrl:
      "https://images.unsplash.com/photo-1583496661160-fb5886a13d77?w=800&q=80",
    rating: 4.5,
    reviewCount: 561,
    purchasable: true,
    categoryId: 13,
    createdAt: "2026-03-22T10:00:00+09:00",
    salesRank: 7,
  },
  {
    productId: 408,
    name: "A라인 플레어 미니 원피스 TSOP2290",
    brandName: "더센트",
    price: 68000,
    originalPrice: 68000,
    imageUrl:
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80",
    rating: 4.4,
    reviewCount: 387,
    purchasable: true,
    categoryId: 12,
    createdAt: "2026-07-14T10:00:00+09:00",
    salesRank: 8,
  },
  {
    productId: 409,
    name: "케이블 니트 가디건 TSKN2210",
    brandName: "더센트",
    price: 112000,
    originalPrice: 140000,
    imageUrl:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80",
    rating: 4.7,
    reviewCount: 298,
    purchasable: true,
    categoryId: 16,
    createdAt: "2026-02-18T10:00:00+09:00",
    salesRank: 9,
  },
  {
    productId: 410,
    name: "테일러드 슬랙스 TSPT3120",
    brandName: "더센트",
    price: 86000,
    originalPrice: 86000,
    imageUrl:
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80",
    rating: 4.5,
    reviewCount: 214,
    purchasable: false,
    categoryId: 17,
    createdAt: "2026-06-28T10:00:00+09:00",
    salesRank: 10,
  },
];

const BRANDS: Record<number, { brand: Brand; products: SeedProduct[] }> = {
  3: { brand: DESCENT, products: DESCENT_PRODUCTS },
  // 상품 상세 목이 brand.id=1을 내려주므로(catalog.ts), 상세 → 브랜드 홈 이동이
  // 목 환경에서도 404로 끊기지 않게 같은 데이터를 1번에도 매핑해 둔다.
  1: { brand: { ...DESCENT, id: 1 }, products: DESCENT_PRODUCTS },
};

// 응답 계약에 없는 목 전용 필드(categoryId·createdAt·salesRank)를 벗긴다
function toCard(product: SeedProduct): BrandProduct {
  return {
    productId: product.productId,
    name: product.name,
    brandName: product.brandName,
    price: product.price,
    originalPrice: product.originalPrice,
    imageUrl: product.imageUrl,
    rating: product.rating,
    reviewCount: product.reviewCount,
    purchasable: product.purchasable,
  };
}

const SORTERS: Record<string, (a: SeedProduct, b: SeedProduct) => number> = {
  popular: (a, b) => a.salesRank - b.salesRank,
  latest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
};

export const brandHandlers = [
  http.get(`${BASE}/api/brands/:brandId`, ({ params, request }) => {
    const entry = BRANDS[Number(params.brandId)];
    if (!entry) {
      return HttpResponse.json(
        fail("BRAND_NOT_FOUND", "존재하지 않는 브랜드입니다."),
        { status: 404 },
      );
    }

    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const sort = url.searchParams.get("sort") ?? "popular";
    const page = Number(url.searchParams.get("page") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 20);

    const filtered = category
      ? entry.products.filter((p) => p.categoryId === Number(category))
      : entry.products;

    const sorted = [...filtered].sort(SORTERS[sort] ?? SORTERS.popular);
    const start = page * size;

    return HttpResponse.json(
      ok({
        brand: entry.brand,
        products: {
          content: sorted.slice(start, start + size).map(toCard),
          page,
          size,
          totalElements: sorted.length,
          totalPages: Math.max(1, Math.ceil(sorted.length / size)),
        },
      }),
    );
  }),
];
