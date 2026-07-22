# 액세스 토큰 관리 전략 — 변경 기록과 배경

이 문서는 jarvis-web의 AT(액세스 토큰) 보관 방식을 왜 바꿨고, 무엇이 나아졌으며,
무엇이 **여전히 해결되지 않았는지**를 정리한 학습용 기록임.

핵심 결론을 먼저 적음: **이번 변경은 XSS 대책이 아니라 "탈취된 토큰의 수명 제한"임.**
이 구분을 흐리면 실제보다 안전하다고 착각하게 되므로 계속 강조함.

---

## 1. 이전 구현

```ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({ user: null, accessToken: null, /* ... */ }),
    { name: "jarvis-auth" },   // ← storage 미지정 = localStorage
  ),
);
```

- zustand `persist`의 기본 storage가 localStorage라, **상태 전체가 그대로 직렬화**됨
- `partialize`가 없어 `accessToken`도 함께 저장됨
- RT(리프레시 토큰)는 처음부터 httpOnly 쿠키였음 — 이 부분은 원래 잘 되어 있었음

### 무엇이 문제였나

브라우저 콘솔이나 XSS 스크립트에서 이 한 줄이면 AT가 나옴:

```js
JSON.parse(localStorage.getItem('jarvis-auth')).state.accessToken
```

localStorage의 성질상:

| 성질 | 의미 |
|---|---|
| JS로 완전 접근 가능 | httpOnly 같은 보호 장치가 없음 |
| 출처(origin) 단위 영속 | 탭을 닫아도, 브라우저를 꺼도 남음 |
| 만료 개념 없음 | 명시적으로 지우기 전까지 계속 있음 |

즉 **한 번 유출되면 공격자가 그 문자열을 자기 서버로 보내 만료 시각까지 어디서든 재사용**할 수 있었음.
피해자가 페이지를 닫아도, 로그아웃하기 전까지는 유효함.

---

## 2. 바꾼 구현

### 2-1. AT를 persist에서 제외

```ts
persist(
  (set) => ({ /* ... */ }),
  {
    name: "jarvis-auth",
    partialize: (s) => ({ user: s.user }),   // user만 저장
  },
)
```

`partialize`는 "저장할 부분만 골라내는" 옵션임. `user`만 남기면:

- localStorage에 남는 건 id·email·닉네임·role뿐 → **노출돼도 권한이 따라오지 않음**
- `accessToken`은 JS 메모리(자바스크립트 변수)에만 존재 → 탭을 닫거나 새로고침하면 **사라짐**

`user`를 굳이 남긴 이유: 헤더 닉네임과 라우트 가드가 첫 렌더에 필요함.
이게 없으면 새로고침할 때마다 화면이 비로그인 상태로 한 번 깜빡임.

### 2-2. 기존 브라우저의 AT 폐기 (version / migrate)

`partialize`는 **앞으로의 저장만** 막음. 이 변경 전에 이미 AT가 저장된 브라우저에는
그대로 남아 있으므로, `version`을 올려 기존 항목을 정리함.

```ts
version: 1,
migrate: (persisted) => ({ user: (persisted as { user?: AuthUser }).user ?? null }),
```

놓치기 쉬운 지점임 — 코드만 고치고 배포하면 **기존 사용자의 localStorage에는
예전 AT가 계속 남음.** "저장을 멈추는 것"과 "이미 저장된 것을 지우는 것"은 다른 일임.

### 2-3. 새로고침 시 복원 (useRestoreSession)

AT가 메모리에만 있으면 새로고침 때 사라지므로, 세션을 이어줄 장치가 필요함.
RT 쿠키로 AT를 재발급받고(`/api/auth/refresh`), **`/api/auth/me`로 신원을 다시 확인**함.

```ts
// src/shared/hooks/useRestoreSession.ts
async function restore(): Promise<void> {
  const { setAccessToken, setUser, clearAuth } = useAuthStore.getState();
  let token: string;
  try {
    const res = await axios.post(`.../api/auth/refresh`, null, { withCredentials: true });
    token = res.data.data.accessToken;
  } catch {
    clearAuth();   // RT 없음/만료 = 비로그인
    return;
  }
  setAccessToken(token);
  try {
    setUser(await fetchMe());   // ← role을 서버 값으로 덮어씀
  } catch {
    clearAuth();   // AT는 받았는데 신원 불명 → 로그인 취급 안 함
  }
}
```

**왜 `me`를 한 번 더 부르는가 (이 설계의 핵심)**

localStorage는 사용자가 **직접 편집할 수 있음.** `role`을 `"ADMIN"`으로 고쳐 넣으면
가드가 그대로 통과시켜 관리자 화면이 열림. 그래서 persist된 `user`는
"깜빡임을 줄이는 캐시"일 뿐 **신뢰 경계가 아니고**, 권한 판정은 서버 응답으로 덮어씀.

물론 최종 방어선은 백엔드임(API가 role을 검증해야 함). 가드는 UX 차원의 1차 필터일 뿐,
화면이 열리는 것 자체를 막는 역할임.

**왜 raw axios인가**

`api` 인스턴스를 쓰면 안 됨. 응답 인터셉터가 401을 받으면 `/login`으로 리다이렉트하기 때문임.
복원에서 401은 "로그인 안 된 정상 상태"인데, 인터셉터를 타면
**첫 방문 게스트가 로그인 화면으로 튕김.**

같은 이유로 `logout()`과 인터셉터 내부의 refresh 호출도 raw axios를 씀.
"인터셉터를 타면 안 되는 호출"이라는 패턴이 이 코드베이스에 셋 있음.
반면 `fetchMe`는 `api`를 씀 — 여기서의 401은 실제로 로그인이 필요한 상황이라 정상 동작임.

### 2-4. 복원 중에는 가드가 판정을 보류

```ts
if (isRestoring) return null;
```

없으면 새로고침 때마다 `user`가 잠깐 비어 보여 **로그인 화면으로 튕김.**
비동기 복원과 동기 렌더가 만나는 지점이라 이 처리가 반드시 필요함.

### 2-5. 인증 필요 쿼리는 `isAuthReady`로 막음 (가장 많이 물린 지점)

**이게 실제로 "홈에서 새로고침하면 로그인으로 튕기는" 버그의 원인이었음.**

가드는 보호 라우트에만 걸림. 홈(`/`)은 공개 라우트라 가드를 안 타는데,
홈의 개인화 추천 쿼리가 이렇게 되어 있었음:

```ts
enabled: userId !== null   // ← AT가 localStorage에 있던 시절엔 맞았음
```

AT를 메모리로 옮긴 뒤의 새로고침 직후 상태를 보면:

| 값 | 상태 | 이유 |
|---|---|---|
| `user` | **있음** | localStorage에서 persist 복원됨 |
| `accessToken` | **없음** | 메모리라 사라졌고, refresh는 아직 진행 중 |

즉 `enabled`가 통과해 **Authorization 헤더 없이 요청이 나가고** → `401 AUTH_REQUIRED`
→ 인터셉터가 `redirectToLogin()` → **로그인 화면으로 튕김.**

복원(비동기)과 쿼리 발사(렌더 즉시)의 **경합**임. 해결은 "복원이 끝났고 AT가 실제로 있을 때"만 통과시키는 것:

```ts
export const selectIsAuthReady = (s: AuthState) =>
  !s.isRestoring && s.accessToken !== null;
```

적용 대상(인증 필요 쿼리 전부): `useRecommendedProducts`·`useWishlist`·`useAddresses`·
`useRecentProducts`·`useOrders`·`useOrder`.

**판정 기준이 두 종류라는 점이 핵심** — 섞으면 안 됨:

| 목적 | 기준 | 예 |
|---|---|---|
| 요청을 보내도 되나? | `isAuthReady` (AT 필요) | 쿼리의 `enabled` |
| 로그인한 사용자인가? | `user !== null` | 가드, "게스트면 로그인으로" 분기 |

`useToggleWishlist`가 후자임 — 여기에 `isAuthReady`를 쓰면 **복원 중인 로그인 사용자를
게스트로 오인해 로그인 화면으로 보냄.** 반대로 쿼리에 `user`를 쓰면 위의 튕김이 발생함.

### 2-6. 복원 경로는 인터셉터의 리다이렉트를 타면 안 됨

`fetchMe`는 `api` 인스턴스를 쓰는데, 인터셉터는 401을 보면 즉시 `redirectToLogin()`을 호출함.
그러면 `useRestoreSession`의 `catch`가 **잡기도 전에 화면이 넘어감** — 조용히 비로그인
처리하려던 의도가 무력해짐.

요청 단위로 리다이렉트를 끄는 옵션을 둬서 해결함:

```ts
// client.ts — axios 모듈 확장으로 커스텀 옵션 추가
declare module "axios" {
  export interface AxiosRequestConfig { skipAuthRedirect?: boolean }
}

// auth.ts
api.get<AuthUser>("/api/auth/me", NO_AUTH_REDIRECT)
```

"401 = 비로그인 판정"인 경로와 "401 = 로그인하러 가야 함"인 경로는 다르게 다뤄야 함.
raw axios를 쓰는 `refresh`/`logout`도 같은 문제의 다른 해법임.

### 2-7. 게스트는 refresh를 아예 부르지 않음

```ts
if (!user) return;   // 로그인한 적 없음 → 이을 세션이 없음
```

없으면 게스트가 앱을 열 때마다 `/api/auth/refresh`가 401을 반환함
(백엔드 명세상 RT 없는 refresh의 **정상 응답**이지만, 콘솔에 에러가 쌓임).

---

## 3. 그래서 뭐가 나아졌나 — 정직한 평가

### 실제로 개선된 것 (하나뿐)

**탈취된 토큰의 재사용 창(window)이 좁아짐.**

| | 이전 | 이후 |
|---|---|---|
| 유출 방법 | `localStorage.getItem()` 한 줄 | 실행 시점에 메모리 접근 필요 |
| 유출 후 수명 | 만료 시각까지 (수십 분~) | 새로고침·탭 종료 시 소멸 |
| 피해자가 탭을 닫으면 | 여전히 유효 | 그 AT는 죽음 |

### 개선되지 **않은** 것

XSS가 실제로 발생한 그 순간의 피해는 **거의 그대로**임.

`withCredentials: true`라서 공격 스크립트는:

1. RT 쿠키가 자동 동봉된 채로 API를 그냥 호출할 수 있음 (토큰을 훔칠 필요가 없음)
2. `/api/auth/refresh`를 직접 불러 **새 AT를 얼마든지 발급**받을 수 있음

httpOnly 쿠키도 이걸 못 막음. httpOnly는 "JS가 쿠키 **값을 읽는 것**"을 막을 뿐,
"브라우저가 요청에 쿠키를 **자동으로 붙이는 것**"은 막지 않기 때문임.
이건 흔한 오해라 특히 기억해둘 것.

> **정리**: 토큰 위치를 옮기는 건 *사후 피해 완화*임.
> *사전 예방*은 CSP·출력 이스케이프처럼 XSS 자체를 막는 쪽에 있음.

### 치른 비용

- 로그인 사용자는 페이지 로드마다 refresh 요청 1회 추가 → 첫 렌더가 그만큼 늦어짐
- 인증 상태가 두 군데로 나뉨(persist된 `user` / 메모리 `accessToken`) → 복잡도 증가
- "렌더 전 부트스트랩"이라는 순서 의존이 생김 → 나중에 깨지기 쉬운 지점

보안은 공짜가 아님. 이 트레이드오프를 인지하고 선택하는 것과, 모르고 하는 것은 다름.

---

## 4. 목(MSW) 설계 — 401 에러의 진짜 원인

이 변경을 처음 적용했을 때(bc28dcf) **부팅마다 콘솔에 401이 찍히는 문제**가 있었음.
원인은 목 핸들러였고, 여기엔 배울 점이 있음.

### 딜레마

목에는 진짜 RT 쿠키가 없으니 refresh를 어떻게 응답할지 정해야 했음. 그런데 양쪽 다 틀림:

| 목 응답 | 결과 |
|---|---|
| 항상 성공 | **게스트도 로그인 상태가 됨** — 로그인 없이 `/mypage`가 열림 |
| 항상 401 | 로그인해도 새로고침마다 세션이 끊기고 **콘솔에 401이 쌓임** |

bc28dcf는 후자를 골랐고(게스트가 뚫리는 것보다는 나으므로), 그게 401 에러의 정체였음.

### 해법 — 쿠키로 분기

목이 진짜 쿠키를 심게 하면 양쪽 다 해결됨:

```ts
// 로그인·가입 성공 시 mock-rt 쿠키를 심음
{ headers: { "Set-Cookie": `mock-rt=${member.id}; Path=/; SameSite=Lax` } }

// refresh는 그 쿠키가 있을 때만 성공
http.post(`${BASE}/api/auth/refresh`, ({ cookies }) => {
  if (!cookies["mock-rt"]) return 401 AUTH_REQUIRED;   // 게스트: 정상 흐름
  return ok({ accessToken: `mock-access-${cookies["mock-rt"]}` });
});
```

- 게스트 → 401이지만 이건 **의도된 정상 흐름**임(복원이 조용히 비로그인 처리)
- 로그인 사용자 → 새로고침해도 유지됨
- 로그아웃 → `Max-Age=0`으로 쿠키를 만료시켜 이후 refresh가 401

MSW 2.x는 자체 `cookieStore`가 있어 목이 심은 `Set-Cookie`를 보관했다가
다음 요청의 `cookies`로 돌려줌. 실제 백엔드의 RT 쿠키 동작을 그대로 흉내 낼 수 있음.

> 실제 RT는 httpOnly라 JS로 못 읽지만, 목 쿠키는 MSW가 읽어야 하므로 httpOnly를 뺌.
> 목 한정 편의이며 실서비스 보안과는 무관함.

**교훈**: 목이 실제 백엔드의 **상태 변화**를 흉내 내지 못하면, 목에서만 나는 가짜 에러가
생김. 그 에러를 없애려고 프로덕션 코드를 고치면 진짜 문제가 됨.
목은 "고정 응답"이 아니라 "상태를 가진 축소판"으로 만들 때 제값을 함.

---

## 5. 함께 복원한 보안 헤더

작업 중 [vercel.json](../vercel.json)의 보안 헤더가 **유실된 상태**임을 발견함.

경위:

```
6eb09f7  chore: 보안 헤더 추가 및 401 중복 리다이렉트 방지  ┐
65d5170  fix: SSE 파싱 실패가 스트림 전체를 끊지 않도록      ├ PR #25
bc28dcf  fix: accessToken을 localStorage에서 제거          ┘
   ↓
d7d0c92  Merge PR #25
   ↓
10b4afa  Revert "Merge PR #25"   ← 세 커밋이 통째로 되돌아감
```

`feat/brand` 브랜치 하나에 **브랜드 기능 + 보안 헤더 + 토큰 리팩터 + SSE 수정**이
섞여 있었고, PR을 되돌리자 전부 함께 사라짐. revert 커밋 메시지에는
브랜드 관련 내용만 있어 무엇이 딸려갔는지 알아채기 어려웠음.

→ 보안 헤더·401 방지는 6eb09f7 시점으로, 토큰 리팩터는 bc28dcf 시점으로 복원함.

> **교훈 1 — revert는 커밋 범위 전체를 되돌림.**
> 성격이 다른 변경을 한 브랜치에 섞으면, 한쪽을 되돌릴 때 다른 쪽이 **조용히** 딸려감.
> 보안·인프라 설정은 기능 브랜치와 분리할 것.

> **교훈 2 — 무엇이 사라졌는지 확인하는 습관.**
> revert 후 `git show <revert> --stat`으로 되돌아간 파일 목록을 훑었다면
> 보안 헤더가 사라진 걸 바로 알 수 있었음. 파일이 삭제되는 변경은 특히 눈에 안 띔.

> **교훈 3 — 현재 코드만 보면 과거를 놓침.**
> 이번 세션에서 "AT가 localStorage에 있다"는 현재 상태만 보고 같은 리팩터를 다시
> 설계했는데, 이미 bc28dcf에 **더 나은 구현**(me 검증·migrate 포함)이 있었음.
> `git log`로 관련 작업 이력을 먼저 확인했다면 아꼈을 시간임.

### 복원한 헤더

| 헤더 | 막는 것 |
|---|---|
| `Content-Security-Policy` | XSS — 허용된 출처의 스크립트만 실행 |
| `X-Frame-Options: DENY` | 클릭재킹 — iframe 삽입 차단 |
| `X-Content-Type-Options: nosniff` | MIME 스니핑 기반 공격 |
| `Referrer-Policy` | 외부 사이트로 URL 정보 유출 |
| `Permissions-Policy` | 카메라·마이크·위치·결제 API 오용 |

CSP 중 XSS 방어의 핵심은 `script-src 'self'`임 — 인라인 스크립트와 외부 스크립트를
모두 차단하므로, 공격자가 HTML에 `<script>`를 주입해도 **실행되지 않음**.
`style-src`에 `'unsafe-inline'`이 있는 건 Tailwind 등이 인라인 스타일을 쓰기 때문인데,
스타일은 스크립트보다 위험이 낮아 실무에서 흔히 허용함.

### `connect-src`를 좁히지 않은 이유

앞서 `connect-src 'self' https:`가 느슨하다고 지적했는데, 확인 결과 **지금은 좁힐 수 없음**:

- 백엔드가 `http://jarvis-backend-alb-...elb.amazonaws.com` — **HTTPS가 아님**
- ALB 오리진을 그대로 넣으면 `http:` 출처를 CSP에 명시해야 하는데,
  Vercel(HTTPS)에서 http 요청은 브라우저의 mixed content 정책에 먼저 막힘
- 즉 **CSP를 좁히기 전에 백엔드 HTTPS 적용이 선행되어야 함**

백엔드에 인증서를 붙인 뒤 아래처럼 좁히는 게 다음 단계임:

```
connect-src 'self' https://api.실제도메인;
```

---

## 6. 더 공부하면 좋을 것

1. **XSS 방어가 본체** — 토큰 보관은 곁가지임. CSP, 출력 이스케이프,
   `dangerouslySetInnerHTML` 사용 지점 점검이 실효가 큼
2. **httpOnly의 정확한 범위** — 값 읽기만 막음. 자동 전송은 못 막음.
   그래서 CSRF는 별도 대책(SameSite, CSRF 토큰)이 필요함
3. **SameSite 쿠키 속성** — 현재 RT 쿠키에 어떻게 설정돼 있는지 백엔드 확인 필요.
   `SameSite=Lax` 이상이면 CSRF 상당 부분이 막힘
4. **토큰 수명 설계** — AT를 짧게(5~15분) 두면 탈취 피해가 더 줄어듦.
   현재 백엔드 AT 만료 시간을 확인해볼 것
5. **BFF 패턴** — 토큰을 아예 브라우저에 두지 않고 서버가 대신 들고 있는 구조.
   다만 이 프로젝트는 "순수 CSR, 서버 로직 없음"이 전제라 지금은 해당 없음

---

## 관련 파일

- [src/shared/stores/authStore.ts](../src/shared/stores/authStore.ts) — partialize·version/migrate, `isRestoring`
- [src/shared/hooks/useRestoreSession.ts](../src/shared/hooks/useRestoreSession.ts) — refresh → me 복원
- [src/shared/api/auth.ts](../src/shared/api/auth.ts) — `fetchMe`, `logout`
- [src/shared/api/client.ts](../src/shared/api/client.ts) — 인터셉터, refresh, 401 처리
- [src/App.tsx](../src/App.tsx) — 복원 훅 실행 지점
- [src/router/guards.tsx](../src/router/guards.tsx) — 복원 대기 처리
- [src/mocks/handlers/auth.ts](../src/mocks/handlers/auth.ts) — 쿠키 기반 refresh 목
- [vercel.json](../vercel.json) — 보안 헤더
