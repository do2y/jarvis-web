import { http, HttpResponse } from "msw";
import { BASE } from "../shared";

// ── 판매자 페이지 목 (pages/seller/types.ts 계약) ──

const PAGE_SIZE = 7;

type SellerOrderStatusMock =
  | "NEW"
  | "PREPARING"
  | "SHIPPING"
  | "DELIVERED"
  | "CLAIM";

const SELLER_IMG_A =
  "https://image.msscdn.net/thumbnails/images/goods_img/20260415/6317871/6317871_17811631352969_big.jpg?w=1200";
const SELLER_IMG_B =
  "https://image.msscdn.net/thumbnails/images/goods_img/20251015/5593843/5593843_17652503983820_big.png?w=1200";

const MOCK_SELLER_ORDERS: {
  orderId: string;
  productName: string;
  productImageUrl: string;
  extraItemCount: number;
  ordererName: string;
  amount: number;
  payMethod: string;
  orderedAt: string;
  status: SellerOrderStatusMock;
}[] = [
  {
    orderId: "20260716-0342",
    productName: "벨티드 린넨 원피스",
    productImageUrl: SELLER_IMG_A,
    extraItemCount: 1,
    ordererName: "김서연",
    amount: 89000,
    payMethod: "카드",
    orderedAt: "07-16 09:42",
    status: "NEW",
  },
  {
    orderId: "20260716-0339",
    productName: "오버핏 코튼 블라우스",
    productImageUrl: SELLER_IMG_B,
    extraItemCount: 0,
    ordererName: "박지현",
    amount: 45000,
    payMethod: "네이버페이",
    orderedAt: "07-16 09:15",
    status: "NEW",
  },
  {
    orderId: "20260716-0331",
    productName: "화이트 코튼 셔츠",
    productImageUrl: SELLER_IMG_A,
    extraItemCount: 2,
    ordererName: "이민정",
    amount: 142000,
    payMethod: "카드",
    orderedAt: "07-16 08:57",
    status: "NEW",
  },
  {
    orderId: "20260715-0318",
    productName: "플리츠 미디 스커트",
    productImageUrl: SELLER_IMG_B,
    extraItemCount: 0,
    ordererName: "최유진",
    amount: 58000,
    payMethod: "카카오페이",
    orderedAt: "07-15 22:40",
    status: "PREPARING",
  },
  {
    orderId: "20260715-0294",
    productName: "크롭 트위드 자켓",
    productImageUrl: SELLER_IMG_A,
    extraItemCount: 0,
    ordererName: "정하윤",
    amount: 128000,
    payMethod: "카드",
    orderedAt: "07-15 18:03",
    status: "SHIPPING",
  },
  {
    orderId: "20260714-0261",
    productName: "와이드 데님 팬츠",
    productImageUrl: SELLER_IMG_B,
    extraItemCount: 0,
    ordererName: "한지우",
    amount: 62000,
    payMethod: "토스페이",
    orderedAt: "07-14 15:22",
    status: "DELIVERED",
  },
  {
    orderId: "20260714-0248",
    productName: "슬림 핏 원피스",
    productImageUrl: SELLER_IMG_A,
    extraItemCount: 0,
    ordererName: "송민서",
    amount: 76000,
    payMethod: "카드",
    orderedAt: "07-14 11:08",
    status: "CLAIM",
  },
  {
    orderId: "20260713-0233",
    productName: "베이직 니트 가디건",
    productImageUrl: SELLER_IMG_B,
    extraItemCount: 1,
    ordererName: "임수아",
    amount: 54000,
    payMethod: "카드",
    orderedAt: "07-13 16:31",
    status: "SHIPPING",
  },
  {
    orderId: "20260713-0219",
    productName: "린넨 셋업 자켓",
    productImageUrl: SELLER_IMG_A,
    extraItemCount: 0,
    ordererName: "오예린",
    amount: 134000,
    payMethod: "네이버페이",
    orderedAt: "07-13 10:12",
    status: "DELIVERED",
  },
];

const MOCK_SELLER_PRODUCTS: {
  productId: number;
  name: string;
  imageUrl: string;
  code: string;
  price: number;
  stock: number;
  salesCount: number;
  status: "ON_SALE" | "SOLD_OUT" | "HIDDEN";
  categoryName: string;
  createdAt: string;
}[] = [
  {
    productId: 301,
    name: "벨티드 린넨 원피스",
    imageUrl: SELLER_IMG_A,
    code: "GLT-OP-0412",
    price: 89000,
    stock: 4,
    salesCount: 1204,
    status: "ON_SALE",
    categoryName: "원피스",
    createdAt: "2026-07-01",
  },
  {
    productId: 302,
    name: "오버핏 코튼 블라우스",
    imageUrl: SELLER_IMG_B,
    code: "GLT-BL-0398",
    price: 45000,
    stock: 7,
    salesCount: 986,
    status: "ON_SALE",
    categoryName: "블라우스",
    createdAt: "2026-06-24",
  },
  {
    productId: 303,
    name: "플리츠 미디 스커트",
    imageUrl: SELLER_IMG_A,
    code: "GLT-SK-0385",
    price: 58000,
    stock: 126,
    salesCount: 742,
    status: "ON_SALE",
    categoryName: "스커트",
    createdAt: "2026-06-18",
  },
  {
    productId: 304,
    name: "크롭 트위드 자켓",
    imageUrl: SELLER_IMG_B,
    code: "GLT-JK-0371",
    price: 128000,
    stock: 0,
    salesCount: 1532,
    status: "SOLD_OUT",
    categoryName: "아우터",
    createdAt: "2026-06-10",
  },
  {
    productId: 305,
    name: "와이드 데님 팬츠",
    imageUrl: SELLER_IMG_A,
    code: "GLT-PT-0362",
    price: 62000,
    stock: 88,
    salesCount: 1108,
    status: "ON_SALE",
    categoryName: "팬츠",
    createdAt: "2026-06-02",
  },
  {
    productId: 306,
    name: "슬림 핏 원피스",
    imageUrl: SELLER_IMG_B,
    code: "GLT-OP-0355",
    price: 76000,
    stock: 54,
    salesCount: 890,
    status: "ON_SALE",
    categoryName: "원피스",
    createdAt: "2026-05-27",
  },
  {
    productId: 307,
    name: "베이직 니트 가디건",
    imageUrl: SELLER_IMG_A,
    code: "GLT-KN-0341",
    price: 54000,
    stock: 37,
    salesCount: 312,
    status: "HIDDEN",
    categoryName: "니트",
    createdAt: "2026-05-14",
  },
  {
    productId: 308,
    name: "린넨 셋업 자켓",
    imageUrl: SELLER_IMG_B,
    code: "GLT-JK-0330",
    price: 134000,
    stock: 3,
    salesCount: 205,
    status: "ON_SALE",
    categoryName: "아우터",
    createdAt: "2026-05-02",
  },
];

const MOCK_SELLER_DASHBOARD = {
  todo: {
    totalCount: 31,
    orderSummaries: [
      {
        status: "NEW",
        label: "새 주문",
        count: 28,
        caption: "오늘 발송 마감 18:00",
        primary: true,
      },
      {
        status: "PREPARING",
        label: "배송 준비",
        count: 46,
        caption: "송장 입력 대기 12",
      },
      {
        status: "SHIPPING",
        label: "배송 중",
        count: 173,
        caption: "평균 배송 1.8일",
      },
      {
        status: "DELIVERED",
        label: "배송 완료",
        count: 95,
        caption: "오늘 기준",
      },
    ],
    // 재고 부족 = 남아있지만 곧 소진될 것. 재고 0은 '품절'이라 상품 목록이 다루므로 제외
    lowStock: MOCK_SELLER_PRODUCTS.filter(
      (p) => p.stock > 0 && p.stock <= 10,
    ).slice(0, 3),
  },
  metrics: [
    {
      key: "revenue",
      label: "오늘 매출",
      value: 12480000,
      unit: "KRW",
      deltaRate: 8.2,
      caption: "어제 대비",
    },
    {
      key: "orders",
      label: "주문 건수",
      value: 342,
      unit: "COUNT",
      deltaRate: 5.1,
      caption: "어제 대비",
    },
    {
      key: "aov",
      label: "객단가",
      value: 36500,
      unit: "KRW",
      deltaRate: 2.9,
      caption: "어제 대비",
    },
    {
      key: "visitors",
      label: "실시간 방문자",
      value: 1284,
      unit: "COUNT",
      caption: "활성 세션 417",
    },
  ],
  revenueTrend: [
    { x: "월", y: 7120000 },
    { x: "화", y: 8340000 },
    { x: "수", y: 7980000 },
    { x: "목", y: 9450000 },
    { x: "금", y: 8870000 },
    { x: "토", y: 10240000 },
    { x: "일", y: 12480000 },
  ],
  aiRevenue: { amount: 3270000, deltaRate: 11.4, contributionRate: 26.2 },
};

export const sellerHandlers = [
  http.get(`${BASE}/api/seller/dashboard`, () =>
    HttpResponse.json(MOCK_SELLER_DASHBOARD),
  ),

  // 주문 목록 — 상태 탭 필터 + 페이지네이션 동작(검색·정렬은 UI만, 계약 확정 후 연결)
  http.get(`${BASE}/api/seller/orders`, ({ request }) => {
    const url = new URL(request.url);
    const status = (url.searchParams.get("status") ?? "ALL") as
      | SellerOrderStatusMock
      | "ALL";
    const page = Number(url.searchParams.get("page") ?? 1);

    const filtered =
      status === "ALL"
        ? MOCK_SELLER_ORDERS
        : MOCK_SELLER_ORDERS.filter((o) => o.status === status);

    const counts = { ALL: MOCK_SELLER_ORDERS.length } as Record<string, number>;
    for (const s of ["NEW", "PREPARING", "SHIPPING", "DELIVERED", "CLAIM"]) {
      counts[s] = MOCK_SELLER_ORDERS.filter((o) => o.status === s).length;
    }

    return HttpResponse.json({
      orders: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      page,
      totalPages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
      counts,
    });
  }),

  // 상품 목록 — 상태 탭 필터 + 페이지네이션 동작
  http.get(`${BASE}/api/seller/products`, ({ request }) => {
    const url = new URL(request.url);
    const tab = url.searchParams.get("tab") ?? "ALL";
    const page = Number(url.searchParams.get("page") ?? 1);

    const filtered =
      tab === "ALL"
        ? MOCK_SELLER_PRODUCTS
        : MOCK_SELLER_PRODUCTS.filter((p) => p.status === tab);

    return HttpResponse.json({
      products: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      page,
      totalPages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
      counts: {
        ALL: MOCK_SELLER_PRODUCTS.length,
        ON_SALE: MOCK_SELLER_PRODUCTS.filter((p) => p.status === "ON_SALE")
          .length,
        SOLD_OUT: MOCK_SELLER_PRODUCTS.filter((p) => p.status === "SOLD_OUT")
          .length,
        HIDDEN: MOCK_SELLER_PRODUCTS.filter((p) => p.status === "HIDDEN")
          .length,
      },
    });
  }),
];
