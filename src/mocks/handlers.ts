import { http, HttpResponse } from "msw";

const BASE = import.meta.env.VITE_API_BASE_URL;

// 목 인증 응답 계약 — src/pages/auth/api.ts의 AuthResponse와 1:1
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
    const { email } = (await request.json()) as { email: string; password: string };
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
    return HttpResponse.json(authResponse({ id: 100, nickname, role: "MEMBER" }));
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
];
