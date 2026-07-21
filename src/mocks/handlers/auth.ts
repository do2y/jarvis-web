import { http, HttpResponse } from "msw";
import { BASE, fail, ok } from "../shared";

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

export const authHandlers = [
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
];
