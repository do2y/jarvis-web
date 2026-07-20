import { http, HttpResponse } from "msw";
import type { CartItem } from "@/shared/types/cart";
import type { Order, OrderStatus } from "@/pages/mypage/types";

const BASE = import.meta.env.VITE_API_BASE_URL;

// 백엔드 공통 응답 봉투 헬퍼 — 실제 API와 동일하게 { success, data } / { success, error }.
// client.ts 인터셉터가 이 봉투를 언래핑하므로 목도 반드시 이 형태를 지켜야 함.
function ok<T>(data: T) {
  return { success: true as const, data };
}
function fail(code: string, message: string) {
  return { success: false as const, error: { code, message } };
}

// A-1/A-2 성공 응답: AT는 body, RT는 httpOnly 쿠키(목에선 Set-Cookie 생략), user는 member 키
function authResponse(member: {
  id: number;
  email: string;
  nickname: string;
  role: "USER" | "SELLER" | "ADMIN";
}) {
  return ok({
    accessToken: `mock-access-${member.id}`,
    member,
  });
}

// 로그인 성공 계정 (비밀번호는 아무 값이나 통과 — 실패 흐름은 미등록 이메일로 테스트)
const MOCK_ACCOUNTS: Record<
  string,
  {
    id: number;
    email: string;
    nickname: string;
    role: "USER" | "SELLER" | "ADMIN";
  }
> = {
  "member@test.com": {
    id: 1,
    email: "member@test.com",
    nickname: "지영",
    role: "USER",
  },
  "seller@test.com": {
    id: 2,
    email: "seller@test.com",
    nickname: "판매자스토어",
    role: "SELLER",
  },
  "admin@test.com": {
    id: 3,
    email: "admin@test.com",
    nickname: "관리자",
    role: "ADMIN",
  },
};

// 찜한 상품 목 — mypage/types.ts WishlistProduct 계약. wishedAt 내림차순(최신순).
// let: 찜 해제 DELETE에서 배열을 갈아끼워 목에도 반영. 핸들러가 참조하
//
// 므로 배열 위에 선언.
let mockWishlist = [
  {
    productId: 202,
    name: "코튼 릴렉스 반팔 티셔츠 NVOP3300",
    brand: "라인어디션",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20251015/5593843/5593843_17652503983820_big.png?w=1200",
    price: 118000,
    wishedAt: "2025-07-12T11:02:00+09:00",
  },
  {
    productId: 203,
    name: "피그먼트 워시드 오버핏 티셔츠 EH2241",
    brand: "에르모사",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20240328/4002805/4002805_17331895953907_big.jpg?w=1200",
    price: 145000,
    wishedAt: "2025-07-11T19:20:00+09:00",
  },
  {
    productId: 301,
    name: "에센셜 크루넥 반팔 티셔츠",
    brand: "더센트",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20230724/3421211/3421211_17803608469427_big.jpg?w=1200",
    price: 92000,
    wishedAt: "2025-07-10T13:44:00+09:00",
  },
  {
    productId: 205,
    name: "드롭숄더 하프 슬리브 티셔츠 FL7788",
    brand: "라인어디션",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20260505/6421311/6421311_17779600135524_big.jpg?w=1200",
    price: 108000,
    wishedAt: "2025-07-09T10:15:00+09:00",
  },
  {
    productId: 206,
    name: "가먼트 다잉 포켓 티셔츠 DT3311",
    brand: "쁘띠메종",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/prd_img/20260618/6694104/detail_6694104_17817540680127_big.jpg?w=1200",
    price: 73000,
    wishedAt: "2025-07-08T22:03:00+09:00",
  },
];

// 배송지 목 — mypage/types.ts Address 계약. let: CRUD/기본설정 DELETE·PATCH가 갱신.
// 핸들러가 참조하므로 배열 위에 선언.
let mockAddresses = [
  {
    addressId: "ADDR-1",
    label: "집",
    recipient: "김소이",
    phone: "010-1234-5678",
    zipCode: "06292",
    address: "서울특별시 강남구 테헤란로 123 101동 302호",
    isDefault: true,
  },
  {
    addressId: "ADDR-2",
    label: "회사",
    recipient: "김소이",
    phone: "010-1234-5678",
    zipCode: "04799",
    address: "서울특별시 성동구 왕십리로 50 센터포인트빌딩 8층",
    isDefault: false,
  },
];
let nextAddressSeq = 3;

// 주문/결제용 배송지 목 (GET·POST /api/addresses) — checkout/types.ts Address 계약.
// 위 mockAddresses(/api/mypage/addresses)와 필드가 갈린다: addressId가 number이고
// 주소가 address1/address2로 분리됨. 백엔드에서 두 계약이 합쳐지면 하나로 통합할 것.
let mockOrderAddresses: {
  addressId: number;
  label: string;
  recipient: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2?: string;
  isDefault?: boolean;
}[] = [
  {
    addressId: 3,
    label: "집",
    recipient: "김소이",
    phone: "010-1234-5678",
    zipCode: "06292",
    address1: "서울특별시 강남구 테헤란로 123",
    address2: "101동 302호",
    isDefault: true,
  },
  {
    addressId: 4,
    label: "회사",
    recipient: "김소이",
    phone: "010-1234-5678",
    zipCode: "04799",
    address1: "서울특별시 성동구 왕십리로 50",
    address2: "센터포인트빌딩 8층",
    isDefault: false,
  },
];
let nextOrderAddressSeq = 5;

// 주문 id 목 증가값 — orderNo는 이 값에서 파생한다(ORD-yyyyMMdd-{id}).
let nextOrderSeq = 1001;

// 생성된 주문의 상태·장바구니 출처 — 재결제(O-2)가 상태 전이와 차감을 판단하는 데 쓴다.
// 실제 백엔드는 주문 테이블을 보지만 목은 이 맵으로 대신한다.
const mockOrders = new Map<
  number,
  { orderNo: string; status: string; cartItemIds: number[] }
>();

// 모든 목 상품이 같은 옵션 셋을 갖는다. 상세(P-2)와 담기(C-2)가 같은 값을 봐야
// "옵션 필수/유효하지 않은 옵션" 검증이 일관되므로 상수로 공유한다.
const MOCK_PRODUCT_OPTIONS = [
  { optionId: 10, name: "화이트/M", extraPrice: 0 },
  { optionId: 11, name: "블랙/L", extraPrice: 2000 },
];

// 장바구니 담기로 새로 생기는 아이템의 id 증가값(기존 픽스처가 55~57을 씀).
let nextCartItemSeq = 58;

// 장바구니 목 — cart/types.ts CartItem 계약. let: 수량 변경·삭제·담기가 갱신.
// 핸들러가 참조하므로 배열 위에 선언. 타입을 명시하는 이유: 픽스처만으로 추론하면
// optionId/optionName이 non-null로 좁혀져 옵션 없는 상품을 담을 수 없다.
let mockCart: CartItem[] = [
  {
    cartItemId: 55,
    productId: 301,
    name: "가먼트 다잉 오버핏 반팔 티셔츠 TSOP1180",
    brandId: 1,
    brandName: "톤앤보이스",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20260415/6317871/6317871_17811631352969_big.jpg?w=1200",
    optionId: 10,
    optionName: "차콜/L",
    quantity: 1,
    price: 92000,
    originalPrice: 230000,
    purchasable: true,
  },
  {
    cartItemId: 56,
    productId: 306,
    name: "소프트 코튼 크루넥 반팔 티셔츠 LB-D221",
    brandId: 2,
    brandName: "리버클래시",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20250722/5262448/5262448_17561780734495_big.jpg?w=1200",
    optionId: 11,
    optionName: "그레이/M",
    quantity: 1,
    price: 89000,
    originalPrice: 89000,
    purchasable: true,
  },
  // 구매 불가(HIDDEN) 케이스 — 목록에는 남고 합계에서만 빠지는 동작 확인용
  {
    cartItemId: 57,
    productId: 303,
    name: "헤비웨이트 오버핏 티셔츠 TSKN1801",
    brandId: 3,
    brandName: "커스텀에이드",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20260618/6694104/6694104_17817540562281_big.jpg?w=1200",
    optionId: 12,
    optionName: "카키/L",
    quantity: 2,
    price: 89000,
    originalPrice: 112000,
    purchasable: false,
  },
];

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

// 함께 구매 추천 목 — cart/types.ts CartRecommendation 계약.
const MOCK_CART_RECOMMENDATIONS = [
  {
    productId: 401,
    name: "코튼 오버핏 반팔 티셔츠",
    brand: "라인어디션",
    imageUrl:
      "https://img.29cm.co.kr/item/202607/11f17a9c4f2b986d9993179502b182f7.jpg?width=1440&format=webp",
    price: 49000,
  },
  {
    productId: 402,
    name: "워시드 크루넥 스웨트셔츠",
    brand: "더센트",
    imageUrl:
      "https://img.29cm.co.kr/item/202605/11f14e99a7e5bcd883a42f85ec813387.jpg?width=408&format=webp",
    price: 89000,
  },
  {
    productId: 403,
    name: "베이직 피그먼트 티셔츠",
    brand: "에르모사",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20251022/5625561/5625561_17610941581236_big.jpg?w=1200",
    price: 28000,
  },
  {
    productId: 404,
    name: "릴렉스핏 하프 슬리브 니트",
    brand: "울프포드",
    imageUrl:
      "https://img.29cm.co.kr/item/202606/11f16f98cff926419090358d89120339.png?width=1440&format=webp",
    price: 64000,
  },
];

export const handlers = [
  http.post(`${BASE}/api/auth/login`, async ({ request }) => {
    const { email } = (await request.json()) as {
      email: string;
      password: string;
    };
    const account = MOCK_ACCOUNTS[email];
    if (!account) {
      // 계정 존재 여부 비노출 위해 통합 401 (봉투 형태)
      return HttpResponse.json(
        fail("AUTH_LOGIN_FAILED", "이메일 또는 비밀번호가 올바르지 않습니다"),
        { status: 401 },
      );
    }
    return HttpResponse.json(authResponse(account));
  }),

  http.post(`${BASE}/api/auth/signup`, async ({ request }) => {
    const { email, nickname } = (await request.json()) as {
      email: string;
      nickname: string;
      password: string;
      gender: "MALE" | "FEMALE";
      birthDate: string;
      agreeTerms: boolean;
      agreePrivacy: boolean;
      guestId?: string;
    };
    if (MOCK_ACCOUNTS[email]) {
      return HttpResponse.json(
        fail("MEMBER_EMAIL_DUPLICATE", "이미 가입된 이메일입니다."),
        { status: 409 },
      );
    }
    // 가입 완료 시 자동 로그인 — 로그인과 동일한 토큰 응답
    return HttpResponse.json(
      authResponse({ id: 100, email, nickname, role: "USER" }),
    );
  }),

  // 로그아웃 — 멱등, 항상 성공. 실제 백엔드는 RT 쿠키 만료도 하지만 목은 성공 봉투만.
  http.post(`${BASE}/api/auth/logout`, () => HttpResponse.json(ok(null))),

  // AT 재발급 — RT 쿠키로 식별. 실제 백엔드는 RT 회전(새 RT를 Set-Cookie)까지 하지만
  // 목은 httpOnly 쿠키를 다루지 않으므로 AT만 새로 발급한다.
  // RT 만료 시나리오를 눈으로 보려면 아래 성공 응답을 401 AUTH_REQUIRED로 바꿔 테스트.
  http.post(`${BASE}/api/auth/refresh`, () =>
    HttpResponse.json(ok({ accessToken: `mock-access-refreshed-${Date.now()}` })),
  ),

  // 행동 이벤트 배치 수집 (E-1) — 202 무본문. 인증 선택(익명 허용).
  // 목에서는 적재하지 않고 수신만 확인한다.
  http.post(`${BASE}/api/events`, () => new HttpResponse(null, { status: 202 })),

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
  // ⚠ :productId 캐치올보다 먼저 등록해야 한다(뒤에 두면 "recommended"가 상세로 잡혀 404).
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
        stockQuantity: 100,
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

  http.post(`${BASE}/api/chat`, async ({ request }) => {
    const body = (await request.json()) as {
      message: string;
      channel?: "SHOPPING" | "CS" | "SELLER";
      screen?: {
        path: string;
        label: string;
        filters?: Record<string, string>;
      };
    };
    const encoder = new TextEncoder();

    const sse = (event: string, data: unknown) =>
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    const isSeller = body.channel === "SELLER";

    // 수정 확인/취소는 후속 메시지로 오므로 프리픽스로 분기 (별도 API 없음)
    const confirmMatch = body.message.match(/^\[수정 확인\] (.+)$/);
    const cancelMatch = body.message.match(/^\[수정 취소\] (.+)$/);
    // 수정 요청으로 볼 발화 — 목에선 "수정/변경/할인/가격" 포함 여부로 단순 판별
    const isEditIntent =
      isSeller && /수정|변경|할인|가격|바꿔/.test(body.message);

    const answer = isSeller
      ? sellerAnswer(body.message, {
          confirmed: !!confirmMatch,
          canceled: !!cancelMatch,
          isEditIntent,
          screen: body.screen,
        })
      : `"${body.message}"에 맞는 상품을 찾았어요. 조건을 더 좁히고 싶으시면 말씀해 주세요.`;

    const stream = new ReadableStream({
      async start(controller) {
        // 1) 텍스트 토큰 스트리밍 (한 어절씩)
        for (const word of answer.split(" ")) {
          controller.enqueue(sse("token", { text: word + " " }));
          await new Promise((r) => setTimeout(r, 40));
        }

        if (isSeller) {
          if (confirmMatch) {
            // 수정 완료 결과
            controller.enqueue(
              sse("action", {
                type: "PRODUCT_UPDATED",
                message: "상품 정보가 수정됐어요.",
                productId: MOCK_SELLER_DIFF.productId,
              }),
            );
          } else if (cancelMatch) {
            // 취소는 실패가 아니므로 action 없이 안내 문구만 — 카드는 프론트가 걷어냄
          } else if (isEditIntent) {
            // 상품 정보 변경 전·후 비교 + 최종 확인
            controller.enqueue(sse("productDiff", MOCK_SELLER_DIFF));
          } else {
            // 매출·주문 요약 → 분석 그래프 → 상품별 판매 데이터 → 재고 부족
            controller.enqueue(sse("metrics", { items: MOCK_SELLER_METRICS }));
            controller.enqueue(sse("analysis", MOCK_SELLER_ANALYSIS));
            controller.enqueue(sse("productStats", MOCK_SELLER_SALES));
            controller.enqueue(sse("productStats", MOCK_SELLER_LOW_STOCK));
          }
        } else {
          // 2) 조건 칩
          controller.enqueue(
            sse("conditions", { items: ["원피스", "기념일", "10만원 이하"] }),
          );
          // 3) 상품 카드 (shared/types/chat.ts의 ProductCard 계약)
          controller.enqueue(
            sse("products", {
              groups: [
                {
                  title: "추천 상품",
                  items: MOCK_CHAT_PRODUCTS,
                },
              ],
            }),
          );
        }

        // 4) 종료
        controller.enqueue(sse("done", { finishReason: "stop" }));
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  }),

  http.get(`${BASE}/api/mypage/orders`, () =>
    HttpResponse.json({ orders: MOCK_ORDERS }),
  ),

  // 주문 상세 — mypage/types.ts OrderDetail 계약. 목록 항목 + 배송지·결제·금액 분해.
  http.get(`${BASE}/api/mypage/orders/:orderId`, ({ params }) => {
    const order = MOCK_ORDERS.find((o) => o.orderId === params.orderId);
    if (!order) {
      return HttpResponse.json(
        { message: "주문을 찾을 수 없어요." },
        {
          status: 404,
        },
      );
    }
    return HttpResponse.json(buildOrderDetail(order));
  }),

  http.get(`${BASE}/api/mypage/recent-products`, () =>
    HttpResponse.json({ products: MOCK_RECENT_PRODUCTS }),
  ),

  http.get(`${BASE}/api/mypage/claims`, () =>
    HttpResponse.json({ claims: MOCK_CLAIMS }),
  ),

  // 반품 신청 접수 — mypage/types.ts CreateClaimRequest 계약.
  // 원 주문에서 상품명을 찾아 Claim으로 만들어 목록 맨 앞(최신순)에 추가.
  http.post(`${BASE}/api/mypage/claims`, async ({ request }) => {
    const body = (await request.json()) as {
      orderId: string;
      productId: number;
      type: "CANCEL" | "RETURN";
      reason: string;
      detail?: string;
    };
    const order = MOCK_ORDERS.find((o) => o.orderId === body.orderId);
    const item = order?.items.find((i) => i.productId === body.productId);
    if (!order || !item) {
      return HttpResponse.json(
        { message: "주문 상품을 찾을 수 없어요." },
        { status: 400 },
      );
    }
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const seq = String(nextClaimSeq++).padStart(3, "0");
    const created = {
      claimId: `CLM-NEW${seq}`,
      orderId: body.orderId,
      productId: body.productId,
      productName: item.name,
      type: body.type,
      status: "REQUESTED" as const, // 접수 → 이후 처리중/완료로 전환(목에선 고정)
      reason: body.reason,
      requestedAt: today,
    };
    MOCK_CLAIMS = [created, ...MOCK_CLAIMS];
    return HttpResponse.json(created, { status: 201 });
  }),

  // 문의 내역 — 읽기 전용. mypage/types.ts Inquiry 계약.
  http.get(`${BASE}/api/mypage/inquiries`, () =>
    HttpResponse.json({ inquiries: MOCK_INQUIRIES }),
  ),

  // ── 배송지 관리 (CRUD + 기본 설정) — mypage/types.ts Address 계약 ──
  http.get(`${BASE}/api/mypage/addresses`, () =>
    HttpResponse.json({ addresses: mockAddresses }),
  ),

  http.post(`${BASE}/api/mypage/addresses`, async ({ request }) => {
    const input = (await request.json()) as Omit<
      (typeof mockAddresses)[number],
      "addressId" | "isDefault"
    >;
    // 첫 배송지는 자동 기본. addressId는 목 증가값.
    const created = {
      ...input,
      addressId: `ADDR-${nextAddressSeq++}`,
      isDefault: mockAddresses.length === 0,
    };
    mockAddresses = [...mockAddresses, created];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(
    `${BASE}/api/mypage/addresses/:addressId`,
    async ({ params, request }) => {
      const id = String(params.addressId);
      const input = (await request.json()) as Partial<
        (typeof mockAddresses)[number]
      >;
      mockAddresses = mockAddresses.map((a) =>
        a.addressId === id ? { ...a, ...input, addressId: id } : a,
      );
      const updated = mockAddresses.find((a) => a.addressId === id);
      return updated
        ? HttpResponse.json(updated)
        : new HttpResponse(null, { status: 404 });
    },
  ),

  http.delete(`${BASE}/api/mypage/addresses/:addressId`, ({ params }) => {
    const id = String(params.addressId);
    const removed = mockAddresses.find((a) => a.addressId === id);
    mockAddresses = mockAddresses.filter((a) => a.addressId !== id);
    // 기본 배송지를 지우면 남은 첫 항목을 기본으로 승격
    if (removed?.isDefault && mockAddresses.length > 0) {
      mockAddresses = mockAddresses.map((a, i) => ({
        ...a,
        isDefault: i === 0,
      }));
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.patch(
    `${BASE}/api/mypage/addresses/:addressId/default`,
    ({ params }) => {
      const id = String(params.addressId);
      mockAddresses = mockAddresses.map((a) => ({
        ...a,
        isDefault: a.addressId === id,
      }));
      return new HttpResponse(null, { status: 204 });
    },
  ),

  // 후기 작성 — 목은 접수만 확인(사진 업로드는 백엔드 붙을 때). 성공 시 생성 결과 반환.
  http.post(`${BASE}/api/reviews`, async ({ request }) => {
    const body = (await request.json()) as {
      orderId: string;
      productId: number;
      rating: number;
      content: string;
    };
    return HttpResponse.json(
      { reviewId: `REV-${body.productId}`, ...body },
      { status: 201 },
    );
  }),

  // ── 장바구니 ──
  // 합계는 서버 계산 — purchasable:false 아이템은 합계에서 제외한다.
  http.get(`${BASE}/api/cart`, () => {
    const payable = mockCart.filter((it) => it.purchasable);
    const totalOriginal = payable.reduce(
      (sum, it) => sum + it.originalPrice * it.quantity,
      0,
    );
    const totalSale = payable.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0,
    );
    return HttpResponse.json(
      ok({
        items: mockCart,
        totalOriginal,
        totalSale,
        discount: totalOriginal - totalSale,
      }),
    );
  }),

  http.get(`${BASE}/api/cart/recommendations`, () =>
    HttpResponse.json(ok({ products: MOCK_CART_RECOMMENDATIONS })),
  ),

  // 장바구니 담기 (C-2) — 동일 상품+옵션이면 수량 합산, 합산 결과도 1~99.
  // 응답은 { cartItemId, quantity } (quantity는 합산 결과).
  http.post(`${BASE}/api/cart/items`, async ({ request }) => {
    const body = (await request.json()) as {
      productId: number;
      optionId?: number | null;
      quantity: number;
    };

    const product = POPULAR_PRODUCTS.find(
      (p) => p.productId === body.productId,
    );
    if (!product) {
      return HttpResponse.json(
        fail("PRODUCT_NOT_FOUND", "상품을 찾을 수 없습니다."),
        { status: 404 },
      );
    }

    // 목 상품은 모두 옵션이 있으므로 optionId 누락은 항상 400.
    // 실패 응답에 옵션 목록을 실어 FE가 옵션 선택 UI를 띄울 수 있게 한다(명세 detail).
    if (body.optionId == null) {
      return HttpResponse.json(
        {
          success: false as const,
          error: {
            code: "CART_OPTION_REQUIRED",
            message: "옵션을 선택해 주세요.",
            detail: { options: MOCK_PRODUCT_OPTIONS },
          },
        },
        { status: 400 },
      );
    }
    if (!MOCK_PRODUCT_OPTIONS.some((o) => o.optionId === body.optionId)) {
      return HttpResponse.json(
        fail("CART_OPTION_INVALID", "선택한 옵션을 찾을 수 없습니다."),
        { status: 400 },
      );
    }

    if (!Number.isInteger(body.quantity) || body.quantity < 1) {
      return HttpResponse.json(
        {
          success: false as const,
          error: {
            code: "VALIDATION_ERROR",
            message: "입력값이 올바르지 않습니다.",
            fields: [{ field: "quantity", message: "수량은 1 이상이어야 합니다." }],
          },
        },
        { status: 400 },
      );
    }

    const existing = mockCart.find(
      (it) => it.productId === body.productId && it.optionId === body.optionId,
    );
    const merged = (existing?.quantity ?? 0) + body.quantity;
    if (merged > 99) {
      return HttpResponse.json(
        {
          success: false as const,
          error: {
            code: "VALIDATION_ERROR",
            message: "입력값이 올바르지 않습니다.",
            fields: [
              { field: "quantity", message: "수량은 99 이하여야 합니다." },
            ],
          },
        },
        { status: 400 },
      );
    }

    if (existing) {
      existing.quantity = merged;
      return HttpResponse.json(
        ok({ cartItemId: existing.cartItemId, quantity: merged }),
      );
    }

    const option = MOCK_PRODUCT_OPTIONS.find(
      (o) => o.optionId === body.optionId,
    );
    const created = {
      cartItemId: nextCartItemSeq++,
      productId: product.productId,
      name: product.name,
      brandId: 1,
      brandName: product.brandName,
      imageUrl: product.imageUrl,
      optionId: body.optionId,
      optionName: option?.name ?? null,
      quantity: body.quantity,
      price: product.price,
      originalPrice: product.originalPrice,
      purchasable: product.purchasable,
    };
    mockCart = [...mockCart, created];
    return HttpResponse.json(
      ok({ cartItemId: created.cartItemId, quantity: created.quantity }),
    );
  }),

  // 수량 변경 (C-3) — 200 + { cartItemId, quantity }. quantity 1~99.
  http.patch(
    `${BASE}/api/cart/items/:cartItemId`,
    async ({ params, request }) => {
      const id = Number(params.cartItemId);
      const { quantity } = (await request.json()) as { quantity: number };

      if (!mockCart.some((it) => it.cartItemId === id)) {
        return HttpResponse.json(
          fail("CART_ITEM_NOT_FOUND", "장바구니 항목을 찾을 수 없습니다."),
          { status: 404 },
        );
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return HttpResponse.json(
          {
            success: false as const,
            error: {
              code: "VALIDATION_ERROR",
              message: "입력값이 올바르지 않습니다.",
              fields: [
                { field: "quantity", message: "수량은 1~99 사이여야 합니다." },
              ],
            },
          },
          { status: 400 },
        );
      }

      mockCart = mockCart.map((it) =>
        it.cartItemId === id ? { ...it, quantity } : it,
      );
      return HttpResponse.json(ok({ cartItemId: id, quantity }));
    },
  ),

  // 삭제 (C-4) — 200 + data: null. 없는 항목은 404.
  // 복수 삭제는 FE가 이 API를 반복 호출한다(bulk API 없음).
  http.delete(`${BASE}/api/cart/items/:cartItemId`, ({ params }) => {
    const id = Number(params.cartItemId);
    if (!mockCart.some((it) => it.cartItemId === id)) {
      return HttpResponse.json(
        fail("CART_ITEM_NOT_FOUND", "장바구니 항목을 찾을 수 없습니다."),
        { status: 404 },
      );
    }
    mockCart = mockCart.filter((it) => it.cartItemId !== id);
    return HttpResponse.json(ok(null));
  }),

  // ── 배송지 (M-8) — checkout 계약: address1/address2 분리, addressId는 number.
  // /api/mypage/addresses 목과는 필드·타입이 다른 별개 계약이라 배열도 따로 둔다.
  http.get(`${BASE}/api/addresses`, () =>
    HttpResponse.json(ok({ addresses: mockOrderAddresses })),
  ),

  http.post(`${BASE}/api/addresses`, async ({ request }) => {
    const input = (await request.json()) as Omit<
      (typeof mockOrderAddresses)[number],
      "addressId" | "isDefault"
    > & { isDefault?: boolean };
    // address2만 선택, 나머지는 필수
    const missing = (
      ["label", "recipient", "phone", "zipCode", "address1"] as const
    ).filter((f) => !input[f]?.trim());
    if (missing.length > 0) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "입력값을 확인해주세요.",
            fields: missing.map((f) => ({
              field: f,
              message: "필수 입력 항목입니다.",
            })),
          },
        },
        { status: 400 },
      );
    }

    const created = {
      ...input,
      addressId: nextOrderAddressSeq++,
      // 첫 배송지는 자동 기본. 명시적 기본 지정 시 기존 기본은 해제된다.
      isDefault: input.isDefault ?? mockOrderAddresses.length === 0,
    };
    if (created.isDefault) {
      mockOrderAddresses = mockOrderAddresses.map((a) => ({
        ...a,
        isDefault: false,
      }));
    }
    mockOrderAddresses = [...mockOrderAddresses, created];
    // 응답은 addressId만 (200) — 목록은 호출부가 재조회해 갱신한다.
    return HttpResponse.json(ok({ addressId: created.addressId }));
  }),

  // 주문 목록 (O-3) — page(기본 0)/size(기본 10). 로그인 필요.
  http.get(`${BASE}/api/orders`, ({ request }) => {
    if (!request.headers.get("Authorization")) {
      return HttpResponse.json(fail("AUTH_REQUIRED", "로그인이 필요합니다."), {
        status: 401,
      });
    }
    const params = new URL(request.url).searchParams;
    const page = Number(params.get("page") ?? 0);
    const size = Number(params.get("size") ?? 10);
    const start = page * size;

    return HttpResponse.json(
      ok({
        content: MOCK_ORDER_PAGE_ITEMS.slice(start, start + size),
        page,
        size,
        totalElements: MOCK_ORDER_PAGE_ITEMS.length,
        totalPages: Math.ceil(MOCK_ORDER_PAGE_ITEMS.length / size),
      }),
    );
  }),

  // 주문 상세 (O-4) — 로그인 필요. 없는 주문·타인 주문 모두 404로 존재 은닉(IDOR 관례).
  http.get(`${BASE}/api/orders/:orderId`, ({ params, request }) => {
    if (!request.headers.get("Authorization")) {
      return HttpResponse.json(fail("AUTH_REQUIRED", "로그인이 필요합니다."), {
        status: 401,
      });
    }
    const id = Number(params.orderId);
    const order = MOCK_ORDER_PAGE_ITEMS.find((o) => o.orderId === id);
    if (!order) {
      return HttpResponse.json(
        fail("ORDER_NOT_FOUND", "주문을 찾을 수 없습니다."),
        { status: 404 },
      );
    }
    return HttpResponse.json(ok(buildOrderDetailV2(order)));
  }),

  // ── 주문 생성 + 모의 결제 (O-1) ──
  // 라인아이템 출처는 cartItemIds / items 중 정확히 하나. 금액은 서버(=목)가 재계산하므로
  // body의 금액 필드는 아예 받지 않는다. 결제 성공·실패 모두 200이고 status로 구분.
  http.post(`${BASE}/api/orders`, async ({ request }) => {
    const body = (await request.json()) as {
      cartItemIds?: number[];
      items?: { productId: number; optionId?: number; quantity: number }[];
      addressId?: number;
      address?: Record<string, string>;
      deliveryRequest?: string;
      paymentMethod: string;
    };

    const hasCart =
      Array.isArray(body.cartItemIds) && body.cartItemIds.length > 0;
    const hasDirect = Array.isArray(body.items) && body.items.length > 0;
    if (hasCart === hasDirect) {
      return HttpResponse.json(
        fail("INVALID_REQUEST", "주문 상품 정보가 올바르지 않습니다."),
        { status: 400 },
      );
    }
    if (!body.addressId && !body.address) {
      return HttpResponse.json(
        fail("INVALID_REQUEST", "배송지를 선택해주세요."),
        { status: 400 },
      );
    }

    // 장바구니 경유: 타인 아이템(존재하지 않는 id) 403, HIDDEN 포함 400
    const lines = hasCart
      ? body.cartItemIds!.map((id) =>
          mockCart.find((it) => it.cartItemId === id),
        )
      : [];
    if (hasCart && lines.some((it) => !it)) {
      return HttpResponse.json(
        fail("AUTH_FORBIDDEN", "이 주문을 처리할 권한이 없어요."),
        { status: 403 },
      );
    }
    if (hasCart && lines.some((it) => it && !it.purchasable)) {
      return HttpResponse.json(
        fail(
          "PRODUCT_NOT_PURCHASABLE",
          "구매할 수 없는 상품이 포함되어 있습니다.",
        ),
        { status: 400 },
      );
    }

    // 수량은 아이템당 1~99
    const quantities = hasCart
      ? lines.map((it) => it!.quantity)
      : body.items!.map((it) => it.quantity);
    if (quantities.some((q) => q < 1 || q > 99)) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "수량이 올바르지 않습니다.",
            fields: [
              { field: "quantity", message: "수량은 1~99개여야 합니다." },
            ],
          },
        },
        { status: 400 },
      );
    }

    // 옵션이 해당 상품 소속인지 (items[] 경로도 동일 적용)
    if (
      hasDirect &&
      body.items!.some(
        (it) =>
          it.optionId != null &&
          !mockCart.some(
            (c) => c.productId === it.productId && c.optionId === it.optionId,
          ) &&
          // 목 장바구니에 없는 상품은 옵션 검증을 건너뛴다(바로 구매 대상)
          mockCart.some((c) => c.productId === it.productId),
      )
    ) {
      return HttpResponse.json(
        fail("CART_OPTION_INVALID", "선택한 옵션을 찾을 수 없습니다."),
        { status: 400 },
      );
    }

    const orderId = nextOrderSeq++;
    // orderNo는 저장하지 않고 파생: "ORD-" + created_at(yyyyMMdd) + "-" + id
    const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const paid = body.paymentMethod !== "MOCK_FAIL";
    const orderNo = `ORD-${yyyymmdd}-${orderId}`;

    // 결제 성공 시에만 장바구니 경유분 차감 (바로 구매는 장바구니 미접촉)
    if (paid && hasCart) {
      mockCart = mockCart.filter(
        (it) => !body.cartItemIds!.includes(it.cartItemId),
      );
    }

    // 재결제(O-2)가 상태 전이를 판단할 수 있도록 기록.
    // 실패 주문은 장바구니를 차감하지 않았으므로 출처를 남겨 재결제 성공 시 차감한다.
    mockOrders.set(orderId, {
      orderNo,
      status: paid ? "PAID" : "PAYMENT_FAILED",
      cartItemIds: hasCart ? body.cartItemIds! : [],
    });

    return HttpResponse.json(
      ok({ orderId, orderNo, status: paid ? "PAID" : "PAYMENT_FAILED" }),
    );
  }),

  // ── 재결제 (O-2) ── PENDING/PAYMENT_FAILED 주문만. 성공 부수효과는 O-1의 PAID와 동일.
  http.post(
    `${BASE}/api/orders/:orderId/retry-payment`,
    async ({ params, request }) => {
      const orderId = Number(params.orderId);
      const { paymentMethod } = (await request.json()) as {
        paymentMethod: string;
      };

      // 없는 주문·타인 주문 모두 404로 통일 — 존재 은닉(IDOR 관례, 2026-07-18 확정)
      const order = mockOrders.get(orderId);
      if (!order) {
        return HttpResponse.json(
          fail("ORDER_NOT_FOUND", "주문을 찾을 수 없습니다."),
          { status: 404 },
        );
      }
      if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
        return HttpResponse.json(
          fail("ORDER_INVALID_TRANSITION", "재결제할 수 없는 주문입니다."),
          { status: 400 },
        );
      }

      const paid = paymentMethod !== "MOCK_FAIL";
      order.status = paid ? "PAID" : "PAYMENT_FAILED";

      // 성공 시에만 장바구니에 남은 같은 행을 삭제(O-1 PAID와 동일한 부수효과)
      if (paid && order.cartItemIds.length > 0) {
        mockCart = mockCart.filter(
          (it) => !order.cartItemIds.includes(it.cartItemId),
        );
      }

      return HttpResponse.json(
        ok({ orderId, orderNo: order.orderNo, status: order.status }),
      );
    },
  ),

  http.get(`${BASE}/api/wishlist`, () =>
    HttpResponse.json({ products: mockWishlist }),
  ),

  // 찜 해제 — 목에서도 반영되도록 모듈 배열에서 제거
  http.delete(`${BASE}/api/wishlist/:productId`, ({ params }) => {
    const id = Number(params.productId);
    mockWishlist = mockWishlist.filter((p) => p.productId !== id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── 판매자 페이지 ──

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

// 인기상품 목 — home PopularProduct 계약과 동일(P-4 응답 필드 그대로).
const POPULAR_PRODUCTS = [
  {
    productId: 101,
    name: "Logitech MX Keys Mini 무선 키보드",
    brandName: "Logitech",
    imageUrl:
      "https://img.29cm.co.kr/item/202601/11f0ed21bafcaaeca540f7b64137d1e5.jpg?width=1440&format=webp",
    price: 119000,
    originalPrice: 149000,
    rating: 4.8,
    reviewCount: 2847,
    purchasable: true,
  },
  {
    productId: 102,
    name: "Sony WH-1000XM5 노이즈캔슬링 헤드폰",
    brandName: "Sony",
    imageUrl:
      "https://img.29cm.co.kr/item/202604/11f137b51654a49dbc92213193f65993.jpg?width=1440&format=webp",
    price: 389000,
    originalPrice: 449000,
    rating: 4.9,
    reviewCount: 5210,
    purchasable: true,
  },
  {
    productId: 103,
    name: "아이리스오야마 수납박스 6P 세트",
    brandName: "아이리스오야마",
    imageUrl:
      "https://img.29cm.co.kr/item/202606/11f1687874f0acbd9090abe3de51eb89.png?width=400&format=webp",
    price: 42900,
    originalPrice: 55000,
    rating: 4.7,
    reviewCount: 5621,
    purchasable: true,
  },
  {
    productId: 104,
    name: "브리타 마렐라 정수 물병 1.4L",
    brandName: "브리타",
    imageUrl:
      "https://img.29cm.co.kr/item/202602/11f10618d50592d0a3c0c51b729aeb9e.jpg?width=1440&format=webp",
    price: 34000,
    originalPrice: 34000,
    rating: 4.5,
    reviewCount: 3401,
    purchasable: true,
  },
  {
    productId: 105,
    name: "베이직 오버핏 코튼 셔츠",
    brandName: "데일리로브",
    imageUrl:
      "https://img.29cm.co.kr/next-product/2026/07/02/fb5e5f5674454a2e81c81b5d1b0e830a_20260702163831.jpg?width=400&format=webp",
    price: 39000,
    originalPrice: 59000,
    rating: 4.6,
    reviewCount: 1820,
    purchasable: true,
  },
  {
    productId: 106,
    name: "센텔라 수분 진정 토너 300ml",
    brandName: "라운드랩",
    imageUrl:
      "https://img.29cm.co.kr/item/202605/11f15b279fa6d9659f7f97288c3b29a9.jpg?width=400&format=webp",
    price: 18900,
    originalPrice: 25000,
    rating: 4.8,
    reviewCount: 9210,
    purchasable: true,
  },
];

// 마이페이지 주문 내역 목 — mypage/types.ts Order 계약
const MOCK_ORDERS = [
  {
    orderId: "ORD-20250601",
    orderedAt: "2025-06-01",
    status: "CONFIRMED",
    items: [
      {
        productId: 301,
        name: "가먼트 다잉 오버핏 반팔 티셔츠 TSOP1180",
        brand: "더센트",
        imageUrl:
          "https://image.msscdn.net/thumbnails/images/goods_img/20230724/3421211/3421211_17803608469427_big.jpg?w=1200",
        option: "차콜 / L",
        quantity: 1,
        price: 92000,
      },
      {
        productId: 302,
        name: "소프트 코튼 크루넥 반팔 티셔츠 LB-D221",
        brand: "르블랑",
        imageUrl:
          "https://image.msscdn.net/thumbnails/images/goods_img/20250722/5262448/5262448_17561780734495_big.jpg?w=1200",
        option: "그레이 / M",
        quantity: 1,
        price: 89000,
      },
    ],
  },
  {
    orderId: "ORD-20250515",
    orderedAt: "2025-05-15",
    status: "DELIVERED",
    items: [
      {
        productId: 303,
        name: "헤비웨이트 오버핏 티셔츠 TSKN1801",
        brand: "더센트",
        imageUrl:
          "https://image.msscdn.net/thumbnails/images/goods_img/20260618/6694104/6694104_17817540562281_big.jpg?w=1200",
        option: "카키 / L",
        quantity: 1,
        price: 89000,
      },
    ],
  },
  {
    orderId: "ORD-20250428",
    orderedAt: "2025-04-28",
    status: "SHIPPING",
    items: [
      {
        productId: 304,
        name: "브러시드 플리스 스웨트셔츠 TSCT3301",
        brand: "더센트",
        imageUrl:
          "https://image.msscdn.net/thumbnails/images/goods_img/20251022/5625561/5625561_17610941581236_big.jpg?w=1200",
        option: "그레이 / M",
        quantity: 1,
        price: 198000,
      },
    ],
  },
  {
    orderId: "ORD-20250410",
    orderedAt: "2025-04-10",
    status: "PREPARING",
    items: [
      {
        productId: 305,
        name: "릴렉스핏 하프 슬리브 니트 TSSK1402",
        brand: "더센트",
        imageUrl:
          "https://img.29cm.co.kr/item/202606/11f16f98cff926419090358d89120339.png?width=1440&format=webp",
        option: "차콜 / M",
        quantity: 1,
        price: 62000,
      },
    ],
  },
];

// 주문 목록 (O-3) 목 — mypage/types.ts Order 계약. 위 MOCK_ORDERS는 구 /api/mypage/orders
// 계약(orderId 문자열·status 필드)이라 별개다. 8종 enum 중 대표 케이스를 담는다.
const MOCK_ORDER_PAGE_ITEMS: Order[] = [
  {
    orderId: 1001,
    orderNo: "ORD-20260713-1001",
    orderedAt: "2026-07-13T14:00:00+09:00",
    representativeStatus: "SHIPPING",
    totalAmount: 92000,
    items: [
      {
        orderItemId: 2001,
        productId: 301,
        productName: "가먼트 다잉 오버핏 반팔 티셔츠 TSOP1180",
        optionName: "차콜/L",
        quantity: 1,
        price: 92000,
        imageUrl:
          "https://image.msscdn.net/thumbnails/images/goods_img/20230724/3421211/3421211_17803608469427_big.jpg?w=1200",
        status: "SHIPPING",
      },
    ],
  },
  {
    orderId: 1002,
    orderNo: "ORD-20260701-1002",
    orderedAt: "2026-07-01T10:30:00+09:00",
    representativeStatus: "DELIVERED",
    totalAmount: 89000,
    items: [
      {
        orderItemId: 2002,
        productId: 306,
        productName: "소프트 코튼 크루넥 반팔 티셔츠 LB-D221",
        optionName: "그레이/M",
        quantity: 1,
        price: 89000,
        imageUrl:
          "https://image.msscdn.net/thumbnails/images/goods_img/20250722/5262448/5262448_17561780734495_big.jpg?w=1200",
        status: "DELIVERED",
      },
    ],
  },
  // 클레임 진행 중 — 반품 신청 버튼이 뜨지 않아야 하는 케이스
  {
    orderId: 1003,
    orderNo: "ORD-20260620-1003",
    orderedAt: "2026-06-20T09:15:00+09:00",
    representativeStatus: "CLAIM_IN_PROGRESS",
    totalAmount: 62000,
    items: [
      {
        orderItemId: 2003,
        productId: 305,
        productName: "릴렉스핏 하프 슬리브 니트 TSSK1402",
        optionName: "차콜/M",
        quantity: 1,
        price: 62000,
        imageUrl:
          "https://img.29cm.co.kr/item/202606/11f16f98cff926419090358d89120339.png?width=1440&format=webp",
        status: "CLAIM_IN_PROGRESS",
      },
    ],
  },
  {
    orderId: 1004,
    orderNo: "ORD-20260605-1004",
    orderedAt: "2026-06-05T16:40:00+09:00",
    representativeStatus: "COMPLETED",
    totalAmount: 198000,
    items: [
      {
        orderItemId: 2004,
        productId: 304,
        productName: "브러시드 플리스 스웨트셔츠 TSCT3301",
        optionName: "그레이/M",
        quantity: 1,
        price: 198000,
        imageUrl:
          "https://image.msscdn.net/thumbnails/images/goods_img/20251022/5625561/5625561_17610941581236_big.jpg?w=1200",
        status: "COMPLETED",
      },
    ],
  },
];

// 주문 상세 (O-4) 목 — 목록 항목에 배송지·결제 스냅샷과 can* 액션 플래그를 더해 조립한다.
// 실제 백엔드는 01 §3 매트릭스로 can*를 계산하지만, 목은 대표 상태로 근사한다.
// (FE는 이 boolean만 보고 버튼을 노출하며 상태 판단을 중복 구현하지 않는다 — 명세)
const ORDER_DETAIL_SNAPSHOT = {
  recipient: "김소이",
  phone: "010-1234-5678",
  zipCode: "06292",
  address1: "서울시 강남구 테헤란로 123",
  address2: "102동 1503호",
};

function buildOrderDetailV2(
  order: (typeof MOCK_ORDER_PAGE_ITEMS)[number],
) {
  // 픽스처에 없는 상태도 규칙에 포함되므로 넓은 타입으로 다룬다
  const s: OrderStatus = order.representativeStatus;
  // 배송 전에만 취소, 배송완료 후에만 반품·후기. 클레임 중·종결 주문은 모두 불가.
  const canCancel = s === "PENDING" || s === "ORDERED";
  const canReturn = s === "DELIVERED" || s === "CONFIRMED";
  const canReview = s === "DELIVERED" || s === "CONFIRMED";

  return {
    orderId: order.orderId,
    orderNo: order.orderNo,
    orderedAt: order.orderedAt,
    paidAt: order.orderedAt,
    status: "PAID",
    representativeStatus: s,
    paymentMethod: "MOCK_CARD",
    deliveryRequest: "문 앞에 놓아주세요",
    address: ORDER_DETAIL_SNAPSHOT,
    totalAmount: order.totalAmount,
    items: order.items.map((it) => ({
      ...it,
      // 정가 스냅샷 — 할인 표시용. 목은 판매가의 약 1.25배로 둔다.
      originalPrice: Math.round((it.price * 1.25) / 1000) * 1000,
      canCancel,
      canReturn,
      canReview,
    })),
  };
}

// 주문별 배송지·결제 스냅샷 — orderId 기준. 금액은 items에서 파생(buildOrderDetail).
const ORDER_DETAIL_META = {
  "ORD-20250601": {
    shipping: {
      recipient: "김소이",
      phone: "010-1234-5678",
      zipCode: "06292",
      address: "서울시 강남구 테헤란로 123 102동 1503호",
      request: "부재 시 경비실에 맡겨주세요.",
    },
    paymentMethod: "신용카드",
    discount: 5000,
    shippingFee: 0,
  },
  "ORD-20250515": {
    shipping: {
      recipient: "김소이",
      phone: "010-1234-5678",
      zipCode: "06292",
      address: "서울시 강남구 테헤란로 123 102동 1503호",
      request: "",
    },
    paymentMethod: "카카오페이",
    discount: 0,
    shippingFee: 3000,
  },
  "ORD-20250428": {
    shipping: {
      recipient: "김소이",
      phone: "010-9876-5432",
      zipCode: "04524",
      address: "서울시 중구 을지로 100 5층",
      request: "배송 전 연락 부탁드려요.",
    },
    paymentMethod: "신용카드",
    discount: 10000,
    shippingFee: 0,
  },
  "ORD-20250410": {
    shipping: {
      recipient: "김소이",
      phone: "010-1234-5678",
      zipCode: "06292",
      address: "서울시 강남구 테헤란로 123 102동 1503호",
      request: "",
    },
    paymentMethod: "네이버페이",
    discount: 0,
    shippingFee: 0,
  },
} as const;

// 목록 주문 + 메타로 OrderDetail 조립. itemsTotal은 항목 합, finalTotal은 파생.
function buildOrderDetail(order: (typeof MOCK_ORDERS)[number]) {
  const meta =
    ORDER_DETAIL_META[order.orderId as keyof typeof ORDER_DETAIL_META];
  const itemsTotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  return {
    ...order,
    shipping: meta.shipping,
    paymentMethod: meta.paymentMethod,
    itemsTotal,
    discount: meta.discount,
    shippingFee: meta.shippingFee,
    finalTotal: itemsTotal - meta.discount + meta.shippingFee,
  };
}

// 최근 본 상품 목 — mypage/types.ts RecentProduct 계약. viewedAt 내림차순(최신순).
const MOCK_RECENT_PRODUCTS = [
  {
    productId: 301,
    name: "에센셜 크루넥 반팔 티셔츠",
    brand: "더센트",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20230724/3421211/3421211_17803608469427_big.jpg?w=1200",
    price: 92000,
    viewedAt: "2025-07-12T10:24:00+09:00",
  },
  {
    productId: 203,
    name: "피그먼트 워시드 오버핏 티셔츠 EH2241",
    brand: "에르모사",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20240328/4002805/4002805_17331895953907_big.jpg?w=1200",
    price: 145000,
    viewedAt: "2025-07-12T09:58:00+09:00",
  },
  {
    productId: 306,
    name: "소프트 코튼 크루넥 반팔 티셔츠",
    brand: "르블랑",
    imageUrl:
      "https://img.29cm.co.kr/item/202606/11f16f98cff926419090358d89120339.png?width=1440&format=webp",
    price: 89000,
    viewedAt: "2025-07-11T21:12:00+09:00",
  },
  {
    productId: 202,
    name: "코튼 릴렉스 반팔 티셔츠 NVOP3300",
    brand: "라인어디션",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20251015/5593843/5593843_17652503983820_big.png?w=1200",
    price: 118000,
    viewedAt: "2025-07-11T18:40:00+09:00",
  },
  {
    productId: 205,
    name: "드롭숄더 하프 슬리브 티셔츠 FL7788",
    brand: "라인어디션",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20260505/6421311/6421311_17779600135524_big.jpg?w=1200",
    price: 108000,
    viewedAt: "2025-07-10T14:05:00+09:00",
  },
  {
    productId: 204,
    name: "코튼 오버핏 반팔 티셔츠 CH1020",
    brand: "데일리로브",
    imageUrl:
      "https://img.29cm.co.kr/item/202604/11f132e7cad3859a9ec501cbcc2e8a97.jpg?width=720&format=webp",
    price: 64000,
    viewedAt: "2025-07-09T20:31:00+09:00",
  },
  {
    productId: 303,
    name: "헤비웨이트 오버핏 티셔츠 TSKN1801",
    brand: "더센트",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20260618/6694104/6694104_17817540562281_big.jpg?w=1200",
    price: 89000,
    viewedAt: "2025-07-08T11:47:00+09:00",
  },
  {
    productId: 206,
    name: "가먼트 다잉 포켓 티셔츠 DT3311",
    brand: "쁘띠메종",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/prd_img/20260618/6694104/detail_6694104_17817540680127_big.jpg?w=1200",
    price: 73000,
    viewedAt: "2025-07-07T16:22:00+09:00",
  },
];

// 취소·반품 목 — mypage/types.ts Claim 계약. requestedAt 내림차순(최신순).
// 원 주문(MOCK_ORDERS)의 상품과 연결. let: 주문 내역에서 신청(POST) 시 추가.
let nextClaimSeq = 1;
let MOCK_CLAIMS = [
  {
    claimId: "CLM-20250520",
    orderId: "ORD-20250515",
    productId: 303,
    productName: "헤비웨이트 오버핏 티셔츠 TSKN1801",
    type: "RETURN",
    status: "PROCESSING",
    reason: "단순 변심",
    requestedAt: "2025-05-20",
  },
  {
    claimId: "CLM-20250503",
    orderId: "ORD-20250428",
    productId: 304,
    productName: "브러시드 플리스 스웨트셔츠 TSCT3301",
    type: "RETURN",
    status: "COMPLETED",
    reason: "상품이 파손·불량이에요",
    requestedAt: "2025-05-03",
  },
  {
    claimId: "CLM-20250412",
    orderId: "ORD-20250410",
    productId: 305,
    productName: "릴렉스핏 하프 슬리브 니트 TSSK1402",
    type: "CANCEL",
    status: "COMPLETED",
    reason: "주문 실수",
    requestedAt: "2025-04-12",
  },
];

// 문의 내역 목 — mypage/types.ts Inquiry 계약. createdAt 내림차순(최신순).
// 답변완료(ANSWERED)만 answer·answeredAt 포함, 처리중(PENDING)은 null.
const MOCK_INQUIRIES = [
  {
    inquiryId: "INQ-20250602",
    title: "환불 처리 기간이 얼마나 걸리나요?",
    status: "PENDING",
    content:
      "지난주에 반품 신청한 니트 환불이 아직 안 됐어요. 보통 며칠 정도 걸리나요?",
    answer: null,
    createdAt: "2025-06-02",
    answeredAt: null,
  },
  {
    inquiryId: "INQ-20250518",
    title: "배송이 너무 늦어요",
    status: "ANSWERED",
    content: "주문한 지 일주일이 지났는데 아직 배송 시작 안내가 없어요.",
    answer:
      "고객님, 주문하신 상품은 현재 물류센터에서 출고 준비 중이며 1~2일 내 발송될 예정입니다. 배송이 지연되어 불편을 드려 죄송합니다.",
    createdAt: "2025-05-18",
    answeredAt: "2025-05-19",
  },
  {
    inquiryId: "INQ-20250430",
    title: "사이즈가 안 맞는데 어떻게 하나요?",
    status: "ANSWERED",
    content: "구매한 코트가 조금 커서 한 사이즈 작은 걸로 다시 사고 싶어요.",
    answer:
      "마이페이지 > 주문 내역에서 해당 상품의 [반품 신청]을 눌러 환불받으신 뒤 원하는 사이즈로 다시 주문해주세요. 반품 배송비는 단순 변심의 경우 고객 부담인 점 참고 부탁드립니다.",
    createdAt: "2025-04-30",
    answeredAt: "2025-05-02",
  },
];

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

// ── SELLER 채널 목 (shared/types/chat.ts 판매자 이벤트 계약) ──
// 상품명·이미지는 MOCK_CHAT_PRODUCTS와 맞춰 화면 간 일관성 유지

const MOCK_SELLER_METRICS = [
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
    key: "conversion",
    label: "전환율",
    value: 3.4,
    unit: "PERCENT",
    deltaRate: -1.2,
    caption: "어제 대비",
  },
];

const MOCK_SELLER_ANALYSIS = {
  title: "최근 7일 매출 추이",
  chartType: "line",
  unit: "KRW",
  series: [
    {
      label: "매출",
      points: [
        { x: "월", y: 7120000 },
        { x: "화", y: 8340000 },
        { x: "수", y: 7980000 },
        { x: "목", y: 9450000 },
        { x: "금", y: 8870000 },
        { x: "토", y: 10240000 },
        { x: "일", y: 12480000 },
      ],
    },
  ],
  summary:
    "주말로 갈수록 매출이 오르는 패턴이에요. 토·일 유입이 많으니 금요일 저녁에 프로모션을 걸면 효과가 클 것 같아요.",
};

const MOCK_SELLER_SALES = {
  title: "상품별 판매 데이터",
  kind: "SALES",
  items: [
    {
      productId: 201,
      name: "가먼트 다잉 오버핏 반팔 티셔츠 TSOP1180",
      imageUrl:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260415/6317871/6317871_17811631352969_big.jpg?w=1200",
      code: "GLT-TS-0412",
      price: 92000,
      stock: 124,
      salesCount: 1204,
      status: "ON_SALE",
    },
    {
      productId: 202,
      name: "코튼 릴렉스 반팔 티셔츠 NVOP3300",
      imageUrl:
        "https://image.msscdn.net/thumbnails/images/goods_img/20251015/5593843/5593843_17652503983820_big.png?w=1200",
      code: "GLT-TS-0398",
      price: 118000,
      stock: 86,
      salesCount: 986,
      status: "ON_SALE",
    },
  ],
};

const MOCK_SELLER_LOW_STOCK = {
  title: "재고 부족 상품",
  kind: "LOW_STOCK",
  items: [
    {
      productId: 203,
      name: "벨티드 린넨 원피스",
      imageUrl:
        "https://image.msscdn.net/thumbnails/images/1999d@naver.comgoods_img/20260415/6317871/6317871_17811631352969_big.jpg?w=1200",
      code: "GLT-OP-0412",
      price: 89000,
      stock: 4,
      salesCount: 1204,
      status: "ON_SALE",
    },
    {
      productId: 204,
      name: "크롭 트위드 자켓",
      imageUrl:
        "https://image.msscdn.net/thumbnails/images/goods_img/20251015/5593843/5593843_17652503983820_big.png?w=1200",
      code: "GLT-JK-0371",
      price: 128000,
      stock: 0,
      salesCount: 1532,
      status: "SOLD_OUT",
    },
  ],
};

const MOCK_SELLER_DIFF = {
  draftId: "draft-8f21",
  productId: 201,
  productName: "가먼트 다잉 오버핏 반팔 티셔츠 TSOP1180",
  fields: [
    { field: "price", label: "판매가", before: "92,000원", after: "78,000원" },
    { field: "stock", label: "재고", before: 124, after: 200 },
    {
      field: "description",
      label: "상품 설명",
      before: "가먼트 다잉으로 자연스러운 워싱감",
      after: "가먼트 다잉으로 자연스러운 워싱감 · 여름 신상 할인",
    },
  ],
  confirmMessage: "위 내용으로 상품 정보를 수정할까요?",
};

// 판매자 답변 문구 — 발화 의도별 분기
function sellerAnswer(
  message: string,
  intent: {
    confirmed: boolean;
    canceled: boolean;
    isEditIntent: boolean;
    screen?: { label: string; filters?: Record<string, string> };
  },
): string {
  if (intent.confirmed) return "요청하신 대로 상품 정보를 수정했어요.";
  if (intent.canceled) return "수정을 취소했어요.";
  if (intent.isEditIntent)
    return "수정할 내용을 정리했어요. 변경 전후를 확인하고 진행해 주세요.";

  // 사이드 채팅이면 보고 있는 화면을 반영한 답변 — 실제 LLM은 이 맥락으로 지시어를 해석함
  if (intent.screen) {
    const filter = intent.screen.filters?.["상태"];
    const where =
      filter && filter !== "전체"
        ? `${intent.screen.label}의 '${filter}'`
        : intent.screen.label;
    return `지금 보고 계신 ${where} 화면 기준으로 분석했어요. "${message}"에 대한 결과예요.`;
  }
  return `"${message}" 기준으로 분석했어요. 매출·주문 요약과 상품별 데이터를 함께 확인해 보세요.`;
}

const MOCK_CHAT_PRODUCTS = [
  {
    productId: 201,
    name: "가먼트 다잉 오버핏 반팔 티셔츠 TSOP1180",
    brandName: "더센트",
    price: 92000,
    originalPrice: 230000,
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20260415/6317871/6317871_17811631352969_big.jpg?w=1200",
    rating: 4.6,
    reviewCount: 312,
    reason: "미니멀한 라인이라 호텔 레스토랑에 과하지 않게 어울려요.",
  },
  {
    productId: 202,
    name: "코튼 릴렉스 반팔 티셔츠 NVOP3300",
    brandName: "라인어디션",
    price: 118000,
    originalPrice: 214000,
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20251015/5593843/5593843_17652503983820_big.png?w=1200",
    rating: 4.8,
    reviewCount: 521,
    reason: "은은한 광택이 조명 아래서 우아하게 살아나요.",
  },
  {
    productId: 203,
    name: "피그먼트 워시드 오버핏 티셔츠 EH2241",
    brandName: "에르모사",
    price: 145000,
    originalPrice: 207000,
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20240328/4002805/4002805_17331895953907_big.jpg?w=1200",
    rating: 4.7,
    reviewCount: 208,
    reason: "기념일 분위기에 잘 맞는 우아한 실루엣이에요.",
  },
  {
    productId: 204,
    name: "코튼 오버핏 반팔 티셔츠 CH1020",
    brandName: "데일리로브",
    price: 64000,
    originalPrice: 89000,
    imageUrl:
      "https://img.29cm.co.kr/item/202604/11f132e7cad3859a9ec501cbcc2e8a97.jpg?width=720&format=webp",
    rating: 4.4,
    reviewCount: 890,
    reason: "데일리로 편하게 입기 좋은 기본 티셔츠예요.",
  },
  {
    productId: 205,
    name: "드롭숄더 하프 슬리브 티셔츠 FL7788",
    brandName: "라인어디션",
    price: 108000,
    originalPrice: 168000,
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20260505/6421311/6421311_17779600135524_big.jpg?w=1200",
    rating: 4.5,
    reviewCount: 447,
    reason: "화사한 패턴이 봄 나들이에 잘 어울려요.",
  },
  {
    productId: 206,
    name: "가먼트 다잉 포켓 티셔츠 DT3311",
    brandName: "쁘띠메종",
    price: 73000,
    originalPrice: 120000,
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/prd_img/20260618/6694104/detail_6694104_17817540680127_big.jpg?w=1200",
    rating: 4.6,
    reviewCount: 356,
    reason: "레트로한 도트 패턴으로 사랑스러운 무드를 줘요.",
  },
];
