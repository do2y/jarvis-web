import { http, HttpResponse } from "msw";
import { BASE, ok } from "../shared";
import type {
  SellerOrder,
  SellerOrderStatus,
  SellerOrderTab,
  SellerProduct,
  SellerProductDisplayStatus,
  SellerProductSort,
  SellerProductTab,
  SellerSummary,
} from "@/pages/seller/types";

// ── 판매자 페이지 목 (pages/seller/types.ts 계약) ──

const ORDER_PAGE_SIZE = 20; // 주문 목록 계약 기본 size
const PRODUCT_PAGE_SIZE = 20; // 상품 목록 계약 기본 size

const SELLER_IMG_A =
  "https://image.msscdn.net/thumbnails/images/goods_img/20260415/6317871/6317871_17811631352969_big.jpg?w=1200";
const SELLER_IMG_B =
  "https://image.msscdn.net/thumbnails/images/goods_img/20251015/5593843/5593843_17652503983820_big.png?w=1200";

// 주문 단위 목(2026-07-21 개정). status는 대표상태(6종), claimStatus 있으면 배지 덮어씀.
// 금액·건수는 자사 아이템만 집계된 값이라고 가정한다.
const MOCK_SELLER_ORDERS: SellerOrder[] = [
  {
    orderId: 342,
    orderNo: "ORD-20260716-0342",
    orderedAt: "2026-07-16T09:42:00+09:00",
    recipientName: "김서연",
    paymentMethod: "MOCK_CARD",
    myItemsAmount: 89000,
    myItemCount: 2,
    representativeProduct: {
      productId: 301,
      name: "벨티드 린넨 원피스",
      imageUrl: SELLER_IMG_A,
      optionName: "블루/M",
    },
    status: "ORDERED",
    claimStatus: null,
  },
  {
    orderId: 339,
    orderNo: "ORD-20260716-0339",
    orderedAt: "2026-07-16T09:15:00+09:00",
    recipientName: "박지현",
    paymentMethod: "MOCK_CARD",
    myItemsAmount: 45000,
    myItemCount: 1,
    representativeProduct: {
      productId: 302,
      name: "오버핏 코튼 블라우스",
      imageUrl: SELLER_IMG_B,
      optionName: "화이트/L",
    },
    status: "ORDERED",
    claimStatus: null,
  },
  {
    orderId: 331,
    orderNo: "ORD-20260716-0331",
    orderedAt: "2026-07-16T08:57:00+09:00",
    recipientName: "이민정",
    paymentMethod: "MOCK_CARD",
    myItemsAmount: 142000,
    myItemCount: 3,
    representativeProduct: {
      productId: 305,
      name: "와이드 데님 팬츠",
      imageUrl: SELLER_IMG_A,
      optionName: "인디고/28",
    },
    status: "ORDERED",
    claimStatus: null,
  },
  {
    orderId: 294,
    orderNo: "ORD-20260715-0294",
    orderedAt: "2026-07-15T18:03:00+09:00",
    recipientName: "정하윤",
    paymentMethod: "MOCK_CARD",
    myItemsAmount: 128000,
    myItemCount: 1,
    representativeProduct: {
      productId: 304,
      name: "크롭 트위드 자켓",
      imageUrl: SELLER_IMG_A,
      optionName: "아이보리/S",
    },
    status: "SHIPPING",
    claimStatus: null,
  },
  {
    orderId: 233,
    orderNo: "ORD-20260713-0233",
    orderedAt: "2026-07-13T16:31:00+09:00",
    recipientName: "임수아",
    paymentMethod: "MOCK_CARD",
    myItemsAmount: 54000,
    myItemCount: 2,
    representativeProduct: {
      productId: 307,
      name: "베이직 니트 가디건",
      imageUrl: SELLER_IMG_B,
      optionName: "그레이/M",
    },
    status: "SHIPPING",
    claimStatus: null,
  },
  {
    orderId: 261,
    orderNo: "ORD-20260714-0261",
    orderedAt: "2026-07-14T15:22:00+09:00",
    recipientName: "한지우",
    paymentMethod: "MOCK_CARD",
    myItemsAmount: 62000,
    myItemCount: 1,
    representativeProduct: {
      productId: 305,
      name: "와이드 데님 팬츠",
      imageUrl: SELLER_IMG_A,
      optionName: "블랙/30",
    },
    status: "DELIVERED",
    claimStatus: null,
  },
  {
    orderId: 219,
    orderNo: "ORD-20260713-0219",
    orderedAt: "2026-07-13T10:12:00+09:00",
    recipientName: "오예린",
    paymentMethod: "MOCK_CARD",
    myItemsAmount: 134000,
    myItemCount: 1,
    representativeProduct: {
      productId: 308,
      name: "린넨 셋업 자켓",
      imageUrl: SELLER_IMG_B,
      optionName: "베이지/M",
    },
    status: "CONFIRMED",
    claimStatus: null,
  },
  {
    orderId: 198,
    orderNo: "ORD-20260712-0198",
    orderedAt: "2026-07-12T22:40:00+09:00",
    recipientName: "최유진",
    paymentMethod: "MOCK_CARD",
    myItemsAmount: 58000,
    myItemCount: 1,
    representativeProduct: {
      productId: 303,
      name: "플리츠 미디 스커트",
      imageUrl: SELLER_IMG_A,
      optionName: "네이비/M",
    },
    // 활성 취소요청 — status는 아직 ORDERED지만 claimStatus가 배지를 덮어쓴다
    status: "ORDERED",
    claimStatus: "CANCEL_REQUESTED",
  },
  {
    orderId: 248,
    orderNo: "ORD-20260714-0248",
    orderedAt: "2026-07-14T11:08:00+09:00",
    recipientName: "송민서",
    paymentMethod: "MOCK_CARD",
    myItemsAmount: 76000,
    myItemCount: 1,
    representativeProduct: {
      productId: 306,
      name: "슬림 핏 원피스",
      imageUrl: SELLER_IMG_B,
      optionName: "핑크/S",
    },
    // 활성 반품요청 — 배송완료 후 반품 신청
    status: "DELIVERED",
    claimStatus: "RETURN_REQUESTED",
  },
];

// 대표상태·claim을 탭 하나로 접는 규칙(계약 §탭↔상태 매핑).
// 활성 claim이 있으면 무조건 CLAIM 탭으로 분류된다.
function tabOf(o: SellerOrder): Exclude<SellerOrderTab, "ALL"> {
  if (o.claimStatus) return "CLAIM";
  switch (o.status) {
    case "ORDERED":
      return "ORDERED";
    case "SHIPPING":
      return "SHIPPING";
    case "DELIVERED":
    case "CONFIRMED":
      return "DELIVERED";
    case "CANCELLED":
    case "RETURNED":
      return "CLAIM";
  }
}

// 목 내부 표현. code는 계약(S-3)에서 제외되지만 대시보드 등 다른 목 소비처가 있어 남겨둔다.
// status는 원본 2종만(SOLD_OUT은 displayStatus 파생값이라 여기 없음). createdAt은 ISO.
const MOCK_SELLER_PRODUCTS: {
  productId: number;
  name: string;
  imageUrl: string;
  code: string;
  price: number;
  stock: number;
  salesCount: number;
  status: "ON_SALE" | "HIDDEN";
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
    // 재고 0 + 원본 ON_SALE → displayStatus는 SOLD_OUT으로 파생된다
    productId: 304,
    name: "크롭 트위드 자켓",
    imageUrl: SELLER_IMG_B,
    code: "GLT-JK-0371",
    price: 128000,
    stock: 0,
    salesCount: 1532,
    status: "ON_SALE",
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

// 목 내부 표현 → S-3 응답(SellerProduct). displayStatus를 재고·원본status로 파생한다.
// (계약 §표시 상태: HIDDEN이 재고보다 우선 / ON_SALE+재고0 → SOLD_OUT)
type MockProductRaw = (typeof MOCK_SELLER_PRODUCTS)[number];

function displayStatusOf(p: MockProductRaw): SellerProductDisplayStatus {
  if (p.status === "HIDDEN") return "HIDDEN";
  return p.stock === 0 ? "SOLD_OUT" : "ON_SALE";
}

function toSellerProduct(p: MockProductRaw): SellerProduct {
  return {
    productId: p.productId,
    name: p.name,
    imageUrl: p.imageUrl,
    category: p.categoryName,
    price: p.price,
    originalPrice: p.price, // 목은 할인 없음 — 정가=판매가
    stockQuantity: p.stock,
    displayedSalesCount: p.salesCount,
    status: p.status,
    displayStatus: displayStatusOf(p),
    createdAt: `${p.createdAt}T00:00:00+09:00`,
    updatedAt: `${p.createdAt}T00:00:00+09:00`,
  };
}

// ── 대시보드 (S-1 GET /api/seller/summary, 2026-07-21 개정) ──
// 진입 1회 호출로 전 블록을 덮는다. 상태 카운트는 주문 목록에서 도출해 정합을 맞춘다.
const LOW_STOCK_THRESHOLD = 10;

function orderStatusCounts(): Record<SellerOrderStatus, number> {
  const counts: Record<SellerOrderStatus, number> = {
    ORDERED: 0,
    SHIPPING: 0,
    DELIVERED: 0,
    CONFIRMED: 0,
    CANCELLED: 0,
    RETURNED: 0,
  };
  for (const o of MOCK_SELLER_ORDERS) counts[o.status] += 1;
  // 목 주문은 표본이 적어 화면 수치가 빈약하므로, 활성 상태만 데모용으로 부풀린다.
  counts.ORDERED += 28;
  counts.SHIPPING += 173;
  counts.DELIVERED += 95;
  counts.CONFIRMED += 12;
  return counts;
}

function buildSummary(): SellerSummary {
  const counts = orderStatusCounts();
  const activeTotal =
    counts.ORDERED + counts.SHIPPING + counts.DELIVERED + counts.CONFIRMED;

  // 재고 부족 = 남아있지만 곧 소진될 것. 재고 0은 '품절'이라 상품 목록이 다루므로 제외. 재고 오름차순.
  const lowStockItems = MOCK_SELLER_PRODUCTS.filter(
    (p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD,
  )
    .sort((a, b) => a.stock - b.stock)
    .map((p) => ({
      productId: p.productId,
      name: p.name,
      imageUrl: p.imageUrl,
      stockQuantity: p.stock,
    }));

  const points = [
    { date: "2026-07-15", sales: 7120000 },
    { date: "2026-07-16", sales: 8340000 },
    { date: "2026-07-17", sales: 7980000 },
    { date: "2026-07-18", sales: 9450000 },
    { date: "2026-07-19", sales: 8870000 },
    { date: "2026-07-20", sales: 10240000 },
    { date: "2026-07-21", sales: 12480000 },
  ];

  return {
    period: { from: "2026-07-21", to: "2026-07-21" },
    orderStatus: {
      counts,
      activeTotal,
      avgDeliveryDays: 1.8,
    },
    today: {
      sales: 12480000,
      orderCount: 342,
      avgOrderValue: 36500,
      activeVisitors: 1284,
      // 어제 데이터가 있으면 number, 없으면(어제 0 등) null → 화면은 "— 어제 대비"로 표기.
      // null 경로를 눈으로 보려면 아래 값 중 하나를 null로 바꿔 확인.
      salesChangeRate: 8.2,
      orderCountChangeRate: 5.1,
      avgOrderValueChangeRate: 2.9,
    },
    salesTrend: {
      total: points.reduce((sum, p) => sum + p.sales, 0),
      points,
    },
    lowStock: {
      threshold: LOW_STOCK_THRESHOLD,
      count: lowStockItems.length,
      items: lowStockItems,
    },
    products: MOCK_SELLER_PRODUCTS.map((p) => ({
      productId: p.productId,
      name: p.name,
      viewCount: p.salesCount * 25,
      cartCount: Math.round(p.salesCount * 1.5),
      salesCount: p.salesCount,
    })),
  };
}

export const sellerHandlers = [
  http.get(`${BASE}/api/seller/summary`, () =>
    HttpResponse.json(ok(buildSummary())),
  ),

  // 주문 목록(주문 단위) — 탭 필터 + 0-base 페이지네이션. tabCounts는 전량 기준.
  // (검색 keyword는 예약 필드라 값이 와도 무시)
  http.get(`${BASE}/api/seller/orders`, ({ request }) => {
    const url = new URL(request.url);
    // status 미전송(=ALL) 또는 CLAIM 등 탭 값. 서버는 status 파라미터명을 쓴다.
    const tab = (url.searchParams.get("status") ?? "ALL") as SellerOrderTab;
    const page = Number(url.searchParams.get("page") ?? 0); // 0-base
    const size = Number(url.searchParams.get("size") ?? ORDER_PAGE_SIZE);

    const filtered =
      tab === "ALL"
        ? MOCK_SELLER_ORDERS
        : MOCK_SELLER_ORDERS.filter((o) => tabOf(o) === tab);

    // 탭 카운트는 필터와 무관하게 항상 전량 기준
    const tabCounts: Record<SellerOrderTab, number> = {
      ALL: MOCK_SELLER_ORDERS.length,
      ORDERED: 0,
      SHIPPING: 0,
      DELIVERED: 0,
      CLAIM: 0,
    };
    for (const o of MOCK_SELLER_ORDERS) tabCounts[tabOf(o)] += 1;

    return HttpResponse.json(
      ok({
        content: filtered.slice(page * size, page * size + size),
        tabCounts,
        page,
        size,
        totalElements: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / size)),
      }),
    );
  }),

  // 상품 목록(S-3) — displayStatus 탭 필터 + 정렬 + 0-base 페이지네이션. tabCounts는 전량 기준.
  // (검색 q는 화면에서 제외 확정 — 파라미터가 와도 무시)
  http.get(`${BASE}/api/seller/products`, ({ request }) => {
    const url = new URL(request.url);
    const tab = (url.searchParams.get("status") ?? "ALL") as SellerProductTab;
    const sort = (url.searchParams.get("sort") ?? "latest") as SellerProductSort;
    const page = Number(url.searchParams.get("page") ?? 0); // 0-base
    const size = Number(url.searchParams.get("size") ?? PRODUCT_PAGE_SIZE);

    const all = MOCK_SELLER_PRODUCTS.map(toSellerProduct);

    // tabCounts는 필터와 무관하게 항상 전량 기준
    const tabCounts: Record<SellerProductTab, number> = {
      ALL: all.length,
      ON_SALE: 0,
      SOLD_OUT: 0,
      HIDDEN: 0,
    };
    for (const p of all) tabCounts[p.displayStatus] += 1;

    const filtered =
      tab === "ALL" ? all : all.filter((p) => p.displayStatus === tab);

    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "sales":
          return b.displayedSalesCount - a.displayedSalesCount;
        case "stock":
          return a.stockQuantity - b.stockQuantity;
        case "price":
          return b.price - a.price;
        default: // latest — createdAt DESC
          return b.createdAt.localeCompare(a.createdAt);
      }
    });

    return HttpResponse.json(
      ok({
        content: sorted.slice(page * size, page * size + size),
        tabCounts,
        page,
        size,
        totalElements: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / size)),
      }),
    );
  }),
];
