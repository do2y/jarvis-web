# CLAUDE.md — jarvis-web (프론트엔드)

## 프로젝트
- AI Shopping Agent "Jarvis"의 프론트엔드. 자연어 채팅으로 상품을 탐색·추천받는 쇼핑몰
- 부트캠프 최종 프로젝트, **프론트 1인 체제** — 단순함과 일관성이 최우선
- 백엔드는 Spring Boot로 분리. 프론트는 **순수 CSR 클라이언트 앱**이며 서버 로직·SSR을 두지 않는다
- 챗봇 3개(상품 추천 / 문의 / 판매자 분석)는 단일 채팅 API를 공유하는 공통 모듈로 구현

## 명령어
- `npm run dev` — 개발 서버 (MSW 목 활성)
- `npm run build` — 프로덕션 빌드
- `npx tsc --noEmit` — 타입 체크 (커밋/PR 전 필수)
- `npx eslint .` — 린트
> 변경 후 검증: 라우트/타입 변경 시 `tsc --noEmit`, 빌드 영향 변경 시 `npm run build`

## 기능 명세
- 페이지별 목적·핵심 기능은 `docs/features.md` 참조. 페이지 작업 시 해당 섹션을 먼저 읽고, 이번 세션에서 만들 범위는 프롬프트로 별도 지정받는다

## 기술 스택
- 스택은 코드에서 확인. **새 라이브러리 추가는 먼저 제안하고 승인받을 것**

## 디렉토리 (응집도 우선)
- `src/pages/<page>/{components,hooks,utils}` — 그 페이지에서만 쓰는 것. `src/shared/`(ui·chat·address·api·hooks·stores·types·utils) — **2개 이상 페이지가 쓰는 것만 승격**. `src/mocks/`(MSW, 도메인별 `handlers/<도메인>.ts` + 교차 픽스처 `data.ts`) · `src/router/`(index=라우트, guards=권한 가드)
- **원칙**: 같이 수정될 것들은 같이 둔다. 페이지 전용은 페이지 폴더에, 공용이 된 순간에만 shared로 옮긴다. 미리 shared에 만들지 않는다

## 컴포넌트 (2계층)
- **순수 UI (shared/ui)**: 도메인을 모른다. 도메인 객체 대신 원시값/노드만 받는다.
  `<PriceText value={n}>` O / `<PriceText product={p}>` X. 도메인을 아는 공용 모듈은 `shared/<도메인>/`(chat·address)
- **도메인·페이지 컴포넌트**: 도메인 상태를 props로 내려받지 않고 도메인 훅(`useCart()`, `useProduct(id)`)으로 직접 접근한다.
  이유: 호출 위치가 자주 바뀌므로 props 드릴링은 중간 컴포넌트 연쇄 수정을 부른다. 훅이 데이터 출처를 캡슐화한다.
- **컴포넌트에서 axios 직접 호출 금지.** 반드시 shared/api 함수 → 도메인 훅 경유.

## 상태 구분
- **서버 원본 데이터**(상품/장바구니/주문/찜/문의) → React Query. useState로 복제 금지
- **클라이언트 상태** → Zustand: 인증(authStore, localStorage persist), 현재 챗봇 대화(persist 안 함 — 새로고침 소실이 의도된 동작), UI 상태
- **폼** → React Hook Form + Zod. 검증 규칙은 백엔드 필드 정의와 일치시킬 것

## React Query 규칙
- Query Key 배열 컨벤션(소문자 세그먼트): `['cart']` `['orders', {status}]` `['categories']` `['addresses']` `['products', 'recent']`
- 상품 키는 2벌: `['products', id]`(카드 시딩) / `['products', id, 'detail']`(상세) — 응답 구조가 달라 분리, `['products', id]` 접두 무효화로 함께 갱신
- staleTime: 정적 데이터(카테고리·브랜드) 30분 / 상품 상세 5분 / 장바구니·주문 0
- 장바구니 변경 성공 시 `invalidateQueries(['cart'])` — **챗봇 CART_ADDED 수신 시에도 동일** (헤더 뱃지 전역 동기화)
- **캐시 승계**: 카드 → 상세 진입은 `useGoToProduct()`(shared/hooks) 경유 — SeededProductCard 완전체만 시딩(불완전 시딩은 상세 렌더를 깨뜨림). 계약을 못 채우는 카드는 시딩 없이 navigate만
- 목록/상세/브랜드는 스피너 단독 금지 → 스켈레톤 기본

## 인증/권한 (구현: src/router/guards.tsx, src/shared/api/client.ts, src/shared/stores/authStore.ts)
- 계정 3종: MEMBER / SELLER / ADMIN. 라우트 가드에서 역할별 접근 제어 (RequireAuth, RequireRole)
- 게스트: 탐색·챗봇·**장바구니 담기**까지 가능(횟수 제한 없음, 개인화만 미적용). 구매·찜·마이페이지는 로그인 필요
- 미인증 접근 → `?returnUrl=` 붙여 /login, 로그인 후 복귀
- 토큰: 인터셉터에서 자동 첨부, 401 → refresh 1회 재시도 → 실패 시 clearAuth + 로그인 이동. **이 로직은 shared/api에만 존재**

## 챗봇 공통 모듈 (src/shared/chat, 타입: src/shared/types/chat.ts)
- 3개 챗봇은 단일 API를 `channel`(SHOPPING|CS|SELLER)만 바꿔 공유. 공통 모듈 + 채널별 렌더러 주입
- 응답은 **SSE 이벤트 6종** `token`(append) / `conditions`(제거 가능 칩) / `products`(카드, `groups`로 카테고리 묶음) / `action`(CART_ADDED 등) / `done` / `error` + **판매자 전용 4종**(`metrics`/`analysis`/`productStats`/`productDiff`)
- **EventSource 금지** — POST+body이므로 `streamChat`의 fetch 스트리밍으로 파싱. 인증 헤더도 이 경로로
- 조건 칩 X 제거 = 후속 메시지 `"[조건 제거] <조건명>"` 전송 (별도 API 없음)
- 카드는 완전한 데이터(브랜드/정가/평점/이유) 포함 → 상세 캐시 시딩용. 카드 표시 위한 재조회 금지. 찜 버튼은 찜 API 직접 호출
- **자동 재시도 금지**(중복 담기 방지) — 실패 시 재시도 버튼 제공
- sessionId: 백엔드 발급, 10분 sliding TTL. 만료 처리 흐름은 백엔드 확인 후 이 문서 갱신

## 디자인 시스템 (Figma 시안 기준, 디자인은 개발자 본인이 담당)
- 범용 부품은 shadcn/ui를 shared/ui로 가져와 토큰에 맞게 수정. 같은 부품 새로 만들지 말 것
- 도메인 컴포넌트(상품 카드·별점·리뷰 분포 바·이미지 갤러리·스펙 표)는 Tailwind 직접 구현
- **토큰은 tailwind 테마 값만 사용, 임의 값 금지**:
  - 색상: primary(검정)/배경(흰색)/회색 2~3단/포인트(할인 빨강·별점 노랑)/brand(청록 `--brand` — AI 기능 강조 전용, 판매자 AI 채팅 등) 외 금지
  - radius: 버튼·칩 `rounded-full`, 카드·이미지·입력 `rounded-sm` (이 2단계 외 금지)
  - 폰트: Pretendard / 간격: 정의된 스케일만 (임의 px 금지)
- 시안에 없는 상태(로딩/에러/빈 상태)는 기존 페이지 패턴을 따라 통일

## 반응형 (모바일 우선)
- **모든 페이지는 모바일(≥360px)부터 데스크탑까지 대응.** 시안이 데스크탑 기준이어도 좁은 화면에서 깨지지 않게 구현
- 기본값은 모바일, 넓어질 때 `sm:`/`md:`/`lg:`로 확장 (mobile-first). breakpoint는 Tailwind 기본값 사용
- 컨테이너 폭은 `w-full` + `max-w-*`로 좁은 화면에선 꽉 차고 넓은 화면에선 상한을 둔다
- 여백(padding/gap/py)은 모바일에서 과하지 않게 반응형으로: 예 `p-6 sm:p-8`, `py-10 sm:py-20`
- 가로 스크롤 금지. 넘칠 수 있는 요소(표·긴 카드 줄)는 `overflow-x-auto`로 자체 스크롤
- 터치 타겟은 최소 높이 확보(대략 `h-11` 이상), 화면 가장자리에 요소가 붙지 않게 좌우 여백 유지

## 코딩 컨벤션
- 함수형 컴포넌트+훅만 (클래스 금지)
- 파일명: 컴포넌트 `PascalCase.tsx`, 훅 `useXxx.ts`, 그 외 `camelCase.ts`
- `any` 금지 (불가피하면 `unknown` + 좁히기)
- Tailwind 유틸리티만 사용, 별도 CSS/CSS-in-JS 금지
- 주석은 "왜"가 필요한 곳에만

## Claude 작업 지침
- 새 컴포넌트 전, shared/ui와 해당 페이지 components/에 유사한 것이 있는지 먼저 확인
- 페이지 전용/공용이 애매하면 페이지 폴더에 먼저 만든다 (승격은 나중에)
- 백엔드 API가 없으면 mocks/handlers/<도메인>.ts에 계약대로 목 추가 후 진행 (새 도메인 파일은 handlers/index.ts에 결합). 계약에 없는 필드를 임의로 만들지 말 것
- 미정 정책(sessionId 만료 처리, 판매자/관리자 계정 생성 방식 등)은 임의로 정하지 말고 질문
- 다중 파일·구조 변경(폴더 이동, 라이브러리 교체)은 실행 전 계획부터 제시
- 결제·인증·배포 관련 코드는 위험을 먼저 설명하고 수정

## 미확정 (정해지면 이 문서 갱신)
- sessionId 10분 TTL 만료 시 응답/재발급 스펙
- 판매자/관리자 계정 생성 방식 (별도 가입 vs DB 시드)
- 채팅 엔드포인트 (streamChat.ts에 placeholder — 백엔드 확정 시 반영)
