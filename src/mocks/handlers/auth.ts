import { http, HttpResponse } from "msw";
import { BASE, fail, ok } from "../shared";

// A-1/A-2 성공 응답: AT는 body, RT는 쿠키, user는 member 키.
//
// 실제 백엔드의 RT는 httpOnly라 JS로 못 읽지만, 목은 MSW가 요청의 cookies를 읽어야
// refresh를 분기할 수 있어 httpOnly 없이 심는다(목 한정 — 실서비스 동작과 무관).
// 이 쿠키가 "RT 보유 = 로그인 세션 존재"의 표시이며, id를 담아 refresh가 어떤 계정인지 안다.
function authResponse(member: {
  id: number;
  email: string;
  nickname: string;
  role: "USER" | "SELLER" | "ADMIN";
}) {
  return HttpResponse.json(
    ok({
      accessToken: `mock-access-${member.id}`,
      member,
    }),
    { headers: { "Set-Cookie": `mock-rt=${member.id}; Path=/; SameSite=Lax` } },
  );
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
    return authResponse(account);
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
    // 가입 완료 시 자동 로그인 — 로그인과 동일한 토큰 응답.
    // MOCK_ACCOUNTS에 등록해야 이후 /api/auth/me가 이 계정을 되짚을 수 있다
    // (등록을 빠뜨리면 새로고침 시 me가 401이라 방금 가입한 사용자가 튕긴다).
    const created = { id: 100, email, nickname, role: "USER" as const };
    MOCK_ACCOUNTS[email] = created;
    return authResponse(created);
  }),

  // 로그아웃 — 멱등, 항상 성공. RT 쿠키를 만료시켜 이후 refresh가 401이 되게 한다.
  http.post(`${BASE}/api/auth/logout`, () =>
    HttpResponse.json(ok(null), {
      headers: { "Set-Cookie": "mock-rt=; Path=/; Max-Age=0" },
    }),
  ),

  // AT 재발급 — RT 쿠키 유무로 분기한다. 실제 백엔드는 RT 회전(새 RT를 Set-Cookie)까지
  // 하지만 목은 AT만 새로 발급한다.
  //
  // 항상 성공을 주면 게스트도 부팅 복원에서 로그인 상태가 되고(로그인 없이 /mypage가 열림),
  // 항상 401을 주면 로그인해도 새로고침마다 세션이 끊기고 콘솔에 401이 쌓인다.
  // 쿠키로 갈라야 양쪽 다 실제 백엔드처럼 동작한다.
  http.post(`${BASE}/api/auth/refresh`, ({ cookies }) => {
    const id = cookies["mock-rt"];
    if (!id) {
      // 게스트의 정상 흐름 — useRestoreSession이 조용히 비로그인으로 처리한다
      return HttpResponse.json(fail("AUTH_REQUIRED", "로그인이 필요합니다."), {
        status: 401,
      });
    }
    // me가 계정을 되짚을 수 있도록 로그인과 같은 `mock-access-{id}` 형식을 유지한다
    return HttpResponse.json(ok({ accessToken: `mock-access-${id}` }));
  }),

  // 현재 사용자 (A-5) — 라우팅 가드의 역할 판정 소스.
  // 목은 AT를 검증하지 않으므로 Authorization 존재 여부만 보고, 어떤 계정인지는
  // 토큰에 심긴 id로 되짚는다(로그인·refresh 목이 `mock-access-{id}` 형태로 발급).
  http.get(`${BASE}/api/auth/me`, ({ request }) => {
    const auth = request.headers.get("Authorization");
    const unauthorized = HttpResponse.json(
      fail("AUTH_REQUIRED", "로그인이 필요합니다."),
      { status: 401 },
    );
    if (!auth?.startsWith("Bearer ")) return unauthorized;

    const id = Number(auth.replace("Bearer mock-access-", ""));
    const account = Object.values(MOCK_ACCOUNTS).find((a) => a.id === id);
    if (!account) return unauthorized;
    return HttpResponse.json(ok(account));
  }),

  // 행동 이벤트 배치 수집 (E-1) — 202 무본문. 인증 선택(익명 허용).
  // 목에서는 적재하지 않고 수신만 확인한다.
  http.post(`${BASE}/api/events`, () => new HttpResponse(null, { status: 202 })),
];
