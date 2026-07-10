import { http, HttpResponse } from "msw";

const BASE = import.meta.env.VITE_API_BASE_URL;

function authResponse(user: {
  id: number;
  nickname: string;
  role: "MEMBER" | "SELLER" | "ADMIN";
}) {
  return {
    accessToken: `mock-access-${user.id}`,
    refreshToken: `mock-refresh-${user.id}`,
    user,
  };
}

// 로그인 성공 계정 (비밀번호는 아무 값이나 통과 — 실패 흐름은 미등록 이메일로 테스트)
const MOCK_ACCOUNTS: Record<
  string,
  { id: number; nickname: string; role: "MEMBER" | "SELLER" | "ADMIN" }
> = {
  "member@test.com": { id: 1, nickname: "지영", role: "MEMBER" },
  "seller@test.com": { id: 2, nickname: "판매자스토어", role: "SELLER" },
  "admin@test.com": { id: 3, nickname: "관리자", role: "ADMIN" },
};

export const handlers = [
  http.post(`${BASE}/api/auth/login`, async ({ request }) => {
    const { email } = (await request.json()) as {
      email: string;
      password: string;
    };
    const account = MOCK_ACCOUNTS[email];
    if (!account) {
      // 계정 존재 여부 비노출 위해 통합 401
      return HttpResponse.json(
        { message: "이메일 또는 비밀번호가 올바르지 않습니다" },
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
      gender: "M" | "F";
      birthDate: string;
    };
    if (MOCK_ACCOUNTS[email]) {
      return HttpResponse.json(
        { message: "이미 사용 중인 이메일입니다" },
        { status: 409 },
      );
    }
    // 가입 완료 시 자동 로그인 — 로그인과 동일한 토큰 응답
    return HttpResponse.json(
      authResponse({ id: 100, nickname, role: "MEMBER" }),
    );
  }),

  http.get(`${BASE}/api/categories`, () =>
    HttpResponse.json({
      categories: [
        { categoryId: 1, name: "디지털", emoji: "⌨️", productCount: 132 },
        { categoryId: 2, name: "생활용품", emoji: "🏠", productCount: 210 },
        { categoryId: 3, name: "주방용품", emoji: "🍳", productCount: 84 },
        { categoryId: 4, name: "패션", emoji: "👗", productCount: 156 },
        { categoryId: 5, name: "여행", emoji: "✈️", productCount: 63 },
        { categoryId: 6, name: "자취", emoji: "🛏️", productCount: 98 },
        { categoryId: 7, name: "선물", emoji: "🎁", productCount: 74 },
        { categoryId: 8, name: "뷰티", emoji: "💄", productCount: 121 },
      ],
    }),
  ),

  http.get(`${BASE}/api/products/popular`, () =>
    HttpResponse.json({
      products: [
        {
          productId: 101,
          name: "Logitech MX Keys Mini 무선 키보드",
          brand: "Logitech",
          imageUrl: "https://picsum.photos/seed/keyboard/600/450",
          price: 119000,
          listPrice: 149000,
          discountRate: 20,
          rating: 4.8,
          reviewCount: 2847,
          badge: "추천",
          reason: "재택근무 관련 관심과 잘 맞는 상품이에요.",
        },
        {
          productId: 102,
          name: "Sony WH-1000XM5 노이즈캔슬링 헤드폰",
          brand: "Sony",
          imageUrl: "https://picsum.photos/seed/headphone/600/450",
          price: 389000,
          listPrice: 449000,
          discountRate: 13,
          rating: 4.9,
          reviewCount: 5210,
          badge: "인기",
          reason: "집중력이 필요한 분들이 가장 많이 구매해요.",
        },
        {
          productId: 103,
          name: "아이리스오야마 수납박스 6P 세트",
          brand: "아이리스오야마",
          imageUrl: "https://picsum.photos/seed/box/600/450",
          price: 42900,
          listPrice: 55000,
          discountRate: 22,
          rating: 4.7,
          reviewCount: 5621,
          badge: null,
          reason: "자취 시작 시 가장 많이 찾는 아이템이에요.",
        },
        {
          productId: 104,
          name: "브리타 마렐라 정수 물병 1.4L",
          brand: "브리타",
          imageUrl: "https://picsum.photos/seed/bottle/600/450",
          price: 34000,
          listPrice: 34000,
          discountRate: 0,
          rating: 4.5,
          reviewCount: 3401,
          badge: null,
          reason: "함께 구매율이 높은 생활필수품이에요.",
        },
      ],
    }),
  ),

  http.post(`${BASE}/api/chat`, async ({ request }) => {
    const body = (await request.json()) as { message: string };
    const encoder = new TextEncoder();

    const sse = (event: string, data: unknown) =>
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    const answer = `"${body.message}"에 맞는 상품을 찾았어요. 조건을 더 좁히고 싶으시면 말씀해 주세요.`;

    const stream = new ReadableStream({
      async start(controller) {
        // 1) 텍스트 토큰 스트리밍 (한 어절씩)
        for (const word of answer.split(" ")) {
          controller.enqueue(sse("token", { text: word + " " }));
          await new Promise((r) => setTimeout(r, 40));
        }
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
];

const MOCK_CHAT_PRODUCTS = [
  {
    productId: 201,
    name: "스테어넥 벨티드 미디 원피스 TSOP1180",
    brandName: "더센트",
    price: 92000,
    originalPrice: 230000,
    imageUrl: "https://picsum.photos/seed/dress1/500/600",
    rating: 4.6,
    reviewCount: 312,
    reason: "미니멀한 라인이라 호텔 레스토랑에 과하지 않게 어울려요.",
  },
  {
    productId: 202,
    name: "세탄 드레이프 원피스 NVOP3300",
    brandName: "라인어디션",
    price: 118000,
    originalPrice: 214000,
    imageUrl: "https://picsum.photos/seed/dress2/500/600",
    rating: 4.8,
    reviewCount: 521,
    reason: "은은한 광택이 조명 아래서 우아하게 살아나요.",
  },
  {
    productId: 203,
    name: "플리츠 새틴 롱 원피스 EH2241",
    brandName: "에르모사",
    price: 145000,
    originalPrice: 207000,
    imageUrl: "https://picsum.photos/seed/dress3/500/600",
    rating: 4.7,
    reviewCount: 208,
    reason: "기념일 분위기에 잘 맞는 우아한 실루엣이에요.",
  },
  {
    productId: 204,
    name: "코튼 셔츠 원피스 CH1020",
    brandName: "데일리로브",
    price: 64000,
    originalPrice: 89000,
    imageUrl: "https://picsum.photos/seed/dress4/500/600",
    rating: 4.4,
    reviewCount: 890,
    reason: "데일리로 편하게 입기 좋은 기본 원피스예요.",
  },
  {
    productId: 205,
    name: "플로럴 랩 원피스 FL7788",
    brandName: "라인어디션",
    price: 108000,
    originalPrice: 168000,
    imageUrl: "https://picsum.photos/seed/dress5/500/600",
    rating: 4.5,
    reviewCount: 447,
    reason: "화사한 패턴이 봄 나들이에 잘 어울려요.",
  },
  {
    productId: 206,
    name: "도트 퍼프 원피스 DT3311",
    brandName: "쁘띠메종",
    price: 73000,
    originalPrice: 120000,
    imageUrl: "https://picsum.photos/seed/dress6/500/600",
    rating: 4.6,
    reviewCount: 356,
    reason: "레트로한 도트 패턴으로 사랑스러운 무드를 줘요.",
  },
];
