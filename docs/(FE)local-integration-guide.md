# FE 로컬 통합 가이드

> 기준: 2026-07-21 현재 워크트리. 목표는 React FE가 Spring의 커머스 API와 FastAPI의 채팅 SSE를 동시에 실제 호출하도록 만드는 것이다.

상황별 AI payload와 실제 화면 표시 방식은 [AI SSE 상황별 응답과 FE 렌더링](%28FE%29ai-sse-response-cases.md)에 별도로 정리했다.

## 1. FE가 맡는 역할

- 일반 화면의 데이터·인증 요청은 **Spring BE (`http://localhost:8080`)** 로 보낸다.
- 채팅 세션과 스트림 티켓도 먼저 Spring에서 발급받는다.
- 실제 채팅 스트림만 Spring이 내려준 `llmSseUrl`을 사용해 **FastAPI (`http://localhost:8000`)** 로 직접 연결한다.
- SSE에 상품 카드를 싣지 않고, `products.ready`를 받으면 Spring의 추천 목록 API에서 최신 가격·이미지·재고 기반 카드를 조회한다.

```text
Browser :3000
  ├─ REST / 인증 / 상품 / 장바구니 ──> Spring :8080
  ├─ 채팅 세션·RS256 티켓 발급 ─────> Spring :8080
  ├─ 티켓을 Bearer로 SSE 요청 ──────> FastAPI :8000
  └─ products.ready 후 카드 조회 ───> Spring :8080
```

## 2. 이번에 맞춘 핵심 충돌

### 2.1 실제 서버 연결을 기본값으로 변경

기존에는 개발 모드에서 MSW가 항상 켜져 실제 Spring 요청을 가로챘다. 이제 `VITE_ENABLE_MOCKS=true`일 때만 MSW를 켠다.

| 파일 | 변경 내용 |
|---|---|
| `.env.example` | Spring 주소를 `http://localhost:8080`, 목 사용을 `false`로 명시 |
| `src/main.tsx` | DEV 여부가 아니라 `VITE_ENABLE_MOCKS` 값으로만 MSW 활성화 |
| `vite.config.ts` | FE 포트를 `localhost:3000`으로 고정하고 포트 충돌 시 임의 포트 이동 금지 |

### 2.2 Spring 공통 응답과 인증 방식 통일

Spring은 성공 응답을 `{ "success": true, "data": ... }`로 감싼다. 각 화면이 이 봉투를 반복 처리하지 않도록 Axios 응답 인터셉터에서 `data`를 한 번 벗긴다.

- 모든 API 요청에 `withCredentials: true`를 적용해 HttpOnly refresh cookie를 전송한다.
- access token은 기존처럼 `Authorization: Bearer ...`로 전송한다.
- 401이면 `/api/auth/refresh`를 cookie 기반으로 한 번 호출하고 원 요청을 재시도한다.
- refresh token 문자열은 브라우저 Zustand 저장소에서 제거했다.
- 회원 역할을 Spring 값인 `USER | SELLER | ADMIN`으로 통일했다.
- 로그인 응답의 `member`/`user` 차이를 FE adapter가 흡수한다.

관련 파일: `src/shared/api/client.ts`, `src/shared/stores/authStore.ts`, `src/pages/auth/api.ts`, `src/shared/ui/AppHeader.tsx`.

### 2.3 채팅 연결을 Spring 세션 → FastAPI SSE 구조로 변경

이전 FE는 access token으로 임시 `/api/chat` 주소를 호출하고 요청 본문에 `userId`, `guestId`, `channel` 등을 실었다. 현재 흐름은 다음과 같다.

1. 구매자: `POST /api/chat/sessions`, 판매자: `POST /api/chat/seller/sessions`
2. Spring 응답에서 `sessionId`, `streamTicket`, `llmSseUrl` 수신
3. FastAPI에 `{sessionId, threadId, message}`만 전송
4. `Authorization`에는 로그인 access token이 아니라 **단명 RS256 stream ticket** 사용
5. 티켓 만료로 401이면 `POST /api/chat/tickets`로 재발급 후 동일 턴을 한 번만 재시도

신원은 요청 본문이 아니라 티켓의 검증된 claim에서 결정되므로 사용자 ID를 FE가 임의로 보내지 않는다.

관련 파일: `src/shared/chat/streamChat.ts`, `src/shared/chat/useChat.ts`, `src/shared/types/chat.ts`.

### 2.4 SSE 이벤트 계약 통일

FastAPI의 정본 프레임은 다음 형태다.

```text
data: {"type":"token","data":{"text":"..."}}
```

FE parser는 이 형식과 MSW의 기존 `event:`/`data:` 형식을 모두 정규화한다. 추가로 다음 계약을 반영했다.

| 이벤트 | FE 처리 |
|---|---|
| `conditions` | `items`가 아니라 `chips[].label`을 화면 필터 칩으로 사용 |
| `products.ready` | `listId`로 `GET /api/chat/lists/{listId}`를 호출해 상품 카드 렌더 |
| `draft` | 판매자 변경 초안을 기존 product diff UI 모델로 변환 |
| `action` | `CART_ADDED`, `CART_ADD_FAILED` 등 결과 메시지 처리 |
| `token`, `done`, `error` | 스트리밍 텍스트, 종료, 오류 상태 반영 |

### 2.5 일반 화면 API를 실제 Spring 계약에 맞춤

| 화면 | 맞춘 내용 |
|---|---|
| 홈/채팅 인기상품 | `products` → `items`, `brand` → `brandName`, `listPrice` → `originalPrice` |
| 상품 상세 | 캐시가 없는 직접 URL 진입 시 `GET /api/products/{id}`를 실행하도록 `queryFn` 추가 |
| 장바구니 | Spring 응답 adapter 추가, 수정/삭제 경로를 `/api/cart/items/{id}`로 변경 |
| 주문/클레임/후기 | `/api/orders`, `/api/claims`, `/api/order-items/{id}/claims`; `orderItemId` 기준으로 통일 |
| 최근 본 상품/찜 | `/api/products/recent`, `/api/wishlist`의 `items` 응답 매핑 |
| 문의/배송지 | `/api/inquiries/me`, `/api/addresses` 실제 경로와 PATCH 계약 반영 |
| 판매자 | summary/orders/products 실제 API를 FE dashboard 모델로 조합 |

관련 파일: `src/pages/{home,chat,product,cart,mypage,seller}/**`.

## 3. 로컬 실행 설정

`.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
VITE_ENABLE_MOCKS=false
```

실행:

```bash
cd jarvis-web
npm install
npm run dev
```

- 접속: `http://localhost:3000`
- FE에는 FastAPI 주소를 별도 하드코딩하지 않는다. Spring의 `llmSseUrl`이 주소의 단일 출처다.
- 실제 통합 테스트에서는 `VITE_ENABLE_MOCKS=false`인지 먼저 확인한다.

## 4. 정상 채팅 흐름 확인

브라우저에서 `부츠컷 청바지 추천해줘`를 보내면 다음 순서가 보여야 한다.

1. Spring 세션 발급 성공
2. FastAPI SSE에서 `conditions`
3. 하나 이상의 `token`
4. `products.ready`
5. FE가 Spring `GET /api/chat/lists/{listId}` 조회
6. 상품 카드 표시 후 `done`

티켓 TTL은 기본 60초다. 오래 열린 채팅에서 첫 요청이 401이어도 FE가 티켓을 한 번 재발급해 복구하는 것이 정상이다.

## 5. 현재 확인된 제한

- 판매자 dashboard 일부 값은 Spring에 대응 필드가 없어 FE에서 집계하거나 임시 표시한다. 예: 주문자명, 결제수단, AI 기여 매출.
- 주문 브랜드, 최근 조회 시각, 찜 시각처럼 현재 Spring 응답에 없는 값은 빈 값으로 adapter 처리한다.
- `conditions` 칩은 현재 검색 조건을 보여주는 UI이며, 칩 자체가 별도 재검색 요청을 보내는 기능은 아니다.
- 채팅이 어색할 때는 FE parser보다 먼저 FastAPI의 intent/filter 로그와 Spring 검색 결과 0건 여부를 확인한다.

## 6. 유지보수 계약과 검증

### FE 팀이 이후 변경에서 지킬 계약

- Spring wire 응답과 화면 모델의 차이는 page API adapter에서 흡수하고 컴포넌트에 퍼뜨리지 않는다.
- 로그인 access token과 FastAPI stream ticket을 혼용하지 않는다.
- FastAPI 주소를 FE 환경변수로 중복 관리하지 않고 Spring의 `llmSseUrl`을 따른다.
- SSE에는 상품 카드가 온다고 가정하지 않는다. `products.ready` 뒤 Spring 목록 조회가 정본이다.
- 통합 개발 기본값은 실제 서버이며, MSW는 명시적인 demo 모드에서만 켠다.

### 실행 검증

```bash
npm run build
npm run lint
```

현재 통합 수정 기준으로 build는 통과했고, lint는 오류 0건이다. 기존 warning은 별도 정리 대상이다.
