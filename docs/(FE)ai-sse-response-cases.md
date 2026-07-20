# AI SSE 상황별 응답과 FE 렌더링

> 기준: 2026-07-21 현재 `jarvis-ai`와 `jarvis-web` 구현. 이 문서는 기획 초안이 아니라 **현재 실행 코드가 실제로 보내고 FE가 실제로 처리하는 동작**을 기준으로 한다.

## 1. 범위와 상태 표기

| 표기 | 의미 |
|---|---|
| ACTIVE | 현재 FastAPI가 실제 emit하고 FE 경로에서 사용할 수 있음 |
| PARTIAL | AI는 emit하지만 FE가 일부 필드만 사용하거나 일부 동작이 빠짐 |
| GAP | AI와 FE 계약이 달라 현재 의도대로 동작하지 않음 |
| RESERVED | 문서/타입에는 있으나 현재 FastAPI가 emit하지 않음 |
| LEGACY | FE/MSW 과거 계약이며 현재 FastAPI 정본에는 없음 |

현재 실제 채널은 다음 두 개다.

- 구매자: `POST http://localhost:8000/chat`
- 판매자: `POST http://localhost:8000/seller/chat`

FE 타입의 `CS` 채널은 현재 사용하는 화면이 없고 별도 AI 응답 분기도 없다.

## 2. 공통 wire 형식

FE는 Spring에서 발급받은 `streamTicket`을 Bearer token으로 보내며 요청 body는 동일하다.

```json
{
  "sessionId": "Spring이 발급한 세션 ID",
  "threadId": "현재는 sessionId와 동일",
  "message": "사용자 발화"
}
```

FastAPI 정본 SSE frame:

```text
data: {"type":"token","data":{"text":"응답 조각"}}

```

FE `streamChat`은 `data.type`을 `ChatEvent.event`로 정규화한 뒤 `useChat.handleEvent`에 전달한다. MSW의 과거 `event:` + `data:` 프레임도 parser 수준에서는 호환한다.

## 3. 이벤트 전체 목록

### 3.1 `token` — ACTIVE

```json
{
  "type": "token",
  "data": { "text": "요청하신 조건으로 상품을 찾았어요." }
}
```

| 항목 | 내용 |
|---|---|
| AI 용도 | 일반 답변, 추천 코멘트, 장바구니 조회, 옵션 되물음, 판매자 분석 진행/결과 |
| FE 처리 | 마지막 assistant 말풍선의 `text` 뒤에 그대로 이어 붙임 |
| 화면 | 좌측 대화 말풍선. `whitespace-pre-wrap`이며 Markdown renderer는 사용하지 않음 |

여러 `token`이 오면 수신 순서대로 문자열이 누적된다. 첫 token 전에는 typing indicator가 보인다.

### 3.2 `conditions` — PARTIAL

추천 intent에서 검색 전에 정확히 한 번 emit한다. 필터가 없어도 `chips: []`일 수 있다.

```json
{
  "type": "conditions",
  "data": {
    "chips": [
      { "field": "category", "label": "카테고리 · 청바지", "value": "청바지" },
      { "field": "priceMax", "label": "50,000원 이하", "value": 50000 },
      { "field": "keyword", "label": "부츠컷", "value": "부츠컷" }
    ]
  }
}
```

| AI 필드 | FE 현재 사용 |
|---|---|
| `chips[].field` | 사용하지 않음 |
| `chips[].label` | 사용함. 입력창 위 회색 pill로 표시 |
| `chips[].value` | 사용하지 않음 |

현재 `ConditionChips`는 `<span>`이므로 표시 전용이다. 제거 버튼이나 field/value 기반 재검색은 연결되어 있지 않다.

### 3.3 `suggestions` — GAP

최근 구매한 소모품 category가 추천 후보에서 억제됐을 때 되돌리기 칩을 emit한다.

```json
{
  "type": "suggestions",
  "data": {
    "chips": [
      {
        "label": "소금은 최근 구매 — 다시 추천받기",
        "revert": { "category": "조미료" },
        "relaxation": null,
        "estCount": 3
      }
    ]
  }
}
```

- 현재 AI runtime이 만드는 것은 `revert` 칩이다.
- `relaxation` 모델은 정의돼 있지만 현재 추천 graph에서 생성하지 않는다.
- **FE `ChatEvent`와 switch에 `suggestions`가 없어 이벤트 전체를 무시한다. 화면에는 아무것도 표시되지 않는다.**

### 3.4 `action` — PARTIAL, 구매자 전용

```json
{
  "type": "action",
  "data": {
    "type": "CART_ADDED",
    "message": "장바구니에 담았어요.",
    "cartItemId": 123,
    "reason": null
  }
}
```

실패 예시:

```json
{
  "type": "action",
  "data": {
    "type": "CART_ADD_FAILED",
    "message": "해당 상품을 찾지 못했어요.",
    "cartItemId": null,
    "reason": "PRODUCT_NOT_FOUND"
  }
}
```

현재 runtime 값:

| `data.type` | 주요 필드 | FE 표시 |
|---|---|---|
| `CART_ADDED` | `message`, `cartItemId` | assistant 말풍선에 `message`를 두 줄 띄워 추가하고 cart query invalidate |
| `CART_ADD_FAILED` | `message`, `reason` | assistant 말풍선에 `message` 추가 |

FE는 `reason`과 `cartItemId`를 화면에 직접 표시하지 않는다. 현재 실패 reason은 `PRODUCT_NOT_FOUND` 또는 `CART_ERROR`이며 `OUT_OF_STOCK`은 schema 예약값일 뿐 현재 Spring 담기 계약에서는 emit되지 않는다.

### 3.5 `products.ready` — ACTIVE, 구매자 전용

```json
{
  "type": "products.ready",
  "data": {
    "sessionId": "session-id",
    "listId": "AI가 생성한 목록 ID"
  }
}
```

SSE에는 상품 카드가 없다. FE 동작:

1. `GET http://localhost:8080/api/chat/lists/{listId}` 호출
2. Spring 응답의 `items[]`를 `ProductCard`로 변환
3. 우측 상품 패널의 첫 structured result로 저장
4. 현재 턴에 이전 결과가 있었다면 이 시점에 이전 결과를 교체

Spring 카드 필드:

```json
{
  "items": [
    {
      "productId": 1714691773,
      "name": "상품명",
      "brandName": "브랜드",
      "price": 19800,
      "originalPrice": 25000,
      "imageUrl": "https://...",
      "rating": 4.5,
      "reviewCount": 30,
      "reason": "추천 이유 또는 null"
    }
  ]
}
```

`reason`이 null이면 FE가 `추천 상품`으로 대체한다. 목록 GET이 실패하면 전체 `send`가 실패해 assistant 말풍선에 `응답을 받지 못했어요. 다시 시도해 주세요.`가 표시된다.

### 3.6 `done` — PARTIAL

```json
{ "type": "done", "data": { "finishReason": "stop" } }
```

구매자는 `stop | zero_result`, 판매자는 `stop`만 사용한다.

FE는 `done` event에서 아무 상태도 바꾸지 않고 stream 종료 후 `finally`에서 입력창만 다시 활성화한다. 따라서:

- `finishReason`을 화면에 표시하지 않는다.
- `zero_result`를 빈 결과 panel로 전환하지 않는다.
- 0건/오류 턴에 새 structured result가 없으면 이전 상품/판매자 결과가 그대로 남는다.

### 3.7 `error` — ACTIVE

```json
{
  "type": "error",
  "data": {
    "code": "SEARCH_FAILED",
    "message": "상품 검색에 실패했어요."
  }
}
```

stream 내부 code:

| code | 의미 |
|---|---|
| `LLM_TIMEOUT` | LLM 응답 제한시간 초과 |
| `LLM_UNAVAILABLE` | provider/key/client 미구성 또는 호출 불가 |
| `SEARCH_FAILED` | AI → Spring 상품 검색 실패 |
| `INTERNAL` | 처리 중 예상하지 못한 오류 |

FE는 마지막 assistant 메시지를 error 상태로 바꾸고 빨간 오류 박스와 `다시 시도` 버튼을 표시한다. 같은 turn에서 앞서 받은 token이 있어도 MessageList는 error branch만 렌더하므로 기존 token 문구는 화면에서 숨겨진다. `code`는 현재 UI에 표시하지 않는다.

### 3.8 `draft` — PARTIAL, 판매자 전용

```json
{
  "type": "draft",
  "data": {
    "draftId": "draft-id",
    "op": "update",
    "productId": 101,
    "changes": [
      { "field": "price", "before": 20000, "after": 18000 }
    ],
    "summary": "가격을 18,000원으로 변경합니다."
  }
}
```

FE 변환:

| AI 필드 | FE `SellerProductDiff` |
|---|---|
| `draftId` | 그대로 사용 |
| `productId` | null이면 `0` |
| `productId` | 상품명 대신 `상품 #101`; null이면 `새 상품` |
| `changes[].field` | `field`와 표시 `label` 양쪽에 그대로 사용 |
| `changes[].before/after` | diff 카드의 취소선 값 → 변경 값 |
| `summary` | 확인 버튼 위 설명 |
| `op` | 현재 사용하지 않음 |

우측 판매자 panel에 diff 카드와 `이대로 수정`, `취소` 버튼을 표시한다.

### 3.9 현재 runtime에 없는 이벤트

| 이벤트 | 상태 | 설명 |
|---|---|---|
| `budget` | RESERVED | API spec 초안에는 있으나 현재 FastAPI schema/graph가 emit하지 않고 FE handler도 없음 |
| `products` | LEGACY | 상품 카드를 SSE에 직접 싣던 구 계약. 현재 FE/MSW 호환용 handler만 남음 |
| `metrics` | LEGACY | FE 판매자 카드 handler는 있으나 현재 FastAPI는 분석을 token 산문으로만 응답 |
| `analysis` | LEGACY | FE 차트 handler는 있으나 현재 FastAPI 미emit |
| `productStats` | LEGACY | FE 표 handler는 있으나 현재 FastAPI 미emit |
| `productDiff` | LEGACY | FE/MSW 과거 수정 카드. 현재 FastAPI 정본은 `draft` |
| 판매자 `action` | LEGACY/GAP | FE/MSW는 `PRODUCT_UPDATED`를 처리하지만 현재 FastAPI 판매자 계약은 action을 emit하지 않음 |

## 4. 구매자 상황별 이벤트 순서와 화면 결과

### 4.1 추천

| 상황 | 실제 이벤트 순서 | FE 화면 |
|---|---|---|
| 정상 추천 | `conditions → token* → products.ready → done(stop)` | 조건 pill, 답변 말풍선, Spring 카드 panel |
| 일부 최근 소모품 억제 | `conditions → token* → suggestions → products.ready → done` | `suggestions`는 무시되고 나머지만 정상 표시 |
| 검색 후보 자체 0건 | `conditions → token → done(zero_result)` | 0건 안내 말풍선. **이전 상품 panel은 유지됨** |
| 모두 최근 구매 exact ID | `conditions → token → done(zero_result)` | 최근 구매 안내. 이전 panel 유지 |
| 모두 소모품 category 억제 | `conditions → token → suggestions → done(zero_result)` | 되돌리기 칩은 안 보이고 안내 말풍선만 표시. 이전 panel 유지 |
| 최근 구매 API 실패 | 정상 추천과 동일 | dedup 없이 계속하므로 사용자는 실패를 알 수 없음 |
| rerank 실패 | `conditions → token(기본 안내) → products.ready → done` | Spring 검색 순서 기반 카드 정상 표시 |
| 추천 목록 push 실패 | `conditions → token* → token(목록 준비 실패) → done` | 텍스트만 표시. 새 카드가 없어 이전 panel 유지 |
| Spring 검색 실패 | `conditions → error(SEARCH_FAILED)` | 빨간 오류 박스 + 재시도. 이전 panel 유지 |
| LLM 미구성 | `error(LLM_UNAVAILABLE)` | 빨간 오류 박스 + 재시도 |
| 질의 분해 timeout | `error(LLM_TIMEOUT)` | 빨간 오류 박스 + 재시도 |

`token*`은 0개 이상이다. AI rerank가 빈 comment를 반환하면 답변 token 없이 카드만 갱신될 수도 있다.

### 4.2 일반 대화

| 상황 | 이벤트 순서 | FE 화면 |
|---|---|---|
| 추천/장바구니가 아닌 일반 질문 | `token → done(stop)` | 일반 assistant 말풍선만 표시. 기존 상품 panel 유지 |

### 4.3 장바구니 담기

| 상황 | 실제 이벤트 순서 | FE 화면 |
|---|---|---|
| 신규 담기 성공 | `action(CART_ADDED, "장바구니에 담았어요.") → done` | assistant 말풍선에 성공 문구, cart badge 재조회 |
| 이미 담긴 상품 합산 | `action(CART_ADDED, "이미 담겨 있던 상품이라 수량을 더했어요.") → done` | 합산 문구, cart badge 재조회 |
| 직전 추천에서 상품 특정 불가 | `token(추천 먼저 요청) → done` | 되묻기 말풍선 |
| 옵션 필수 | `token(옵션 목록과 질문) → done` | 옵션을 문자열로 보여주고 다음 사용자 답을 기다림 |
| 잘못된 옵션, 재질문 한도 이내 | `token(다시 골라 달라는 안내) → done` | 재질문 말풍선 |
| 잘못된 옵션 한도 초과 | `action(CART_ADD_FAILED/CART_ERROR) → done` | 실패 문구를 assistant 말풍선에 추가 |
| 상품 없음 | `action(CART_ADD_FAILED/PRODUCT_NOT_FOUND) → done` | 상품 없음 문구 |
| Spring/token/validation 오류 | `action(CART_ADD_FAILED/CART_ERROR) → done` | 일반 담기 실패 문구 |
| 유효한 회원/게스트 신원 없음 | `action(CART_ADD_FAILED/CART_ERROR) → done` | 로그인 필요 문구 |
| 담기 전 장바구니 조회만 실패 | 성공 action으로 계속 | 조회는 안내용 degrade라 담기 자체가 성공하면 정상 표시 |

옵션 필수는 실패 action이 아니라 정상적인 멀티턴 `token + done`이다.

### 4.4 장바구니 조회

| 상황 | 이벤트 순서 | FE 화면 |
|---|---|---|
| 항목 있음 | `token(상품명·옵션·수량 목록) → done` | 줄바꿈이 보존된 assistant 말풍선 |
| 비어 있음 | `token("장바구니가 비어 있어요.") → done` | 텍스트 표시 |
| Spring 조회 실패 | `token(불러오기 실패) → done` | 텍스트 표시, error UI 아님 |
| 유효 신원 없음 | `token(로그인 필요) → done` | 텍스트 표시 |

## 5. 판매자 상황별 이벤트 순서와 화면 결과

### 5.1 일반/분석 응답

| 상황 | 실제 이벤트 순서 | FE 화면 |
|---|---|---|
| 일반 질문 성공 | `token... → done(stop)` | assistant 말풍선 |
| scope 밖 질문 | `token(거절문) → done` | 거절 말풍선, LLM 호출 없음 |
| 분석 성공 | `token(진행 상태)... → token(최종 보고서) → done` | 모든 진행/결과가 한 말풍선에 이어 붙음. 구조화 차트/지표 없음 |
| 분석 기간·범위 불명확 | `token(진행) → token(되묻기) → done` | 진행 문구와 되묻기가 같은 말풍선에 누적 |
| 일부 분석 worker 실패 | 정상 보고서 token + done | degrade finding을 포함한 산문 보고서 |
| 모든 worker 실패 | 진행 token들 → token(사과) → done | 사과 말풍선. error UI 아님 |
| planner/첫 report 실패 | 진행 token들 → token(사과) → `error(INTERNAL)` | FE error branch가 사과/진행 token을 숨기고 오류 message만 표시 |
| 분석 timeout | 진행 token들 → token(사과) → `error(LLM_TIMEOUT)` | 위와 동일하게 최종 오류 message만 표시 |
| general LLM timeout/내부 오류 | `error(LLM_TIMEOUT|INTERNAL)` | 빨간 오류 박스 + 재시도 |

FE의 `metrics`, `analysis`, `productStats` 결과 panel은 현재 AI 분석 응답으로 생성되지 않는다.

### 5.2 상품 변경 초안

| 상황 | 실제 이벤트 순서 | FE 화면 |
|---|---|---|
| 초안 생성 성공 | `draft → done` | 우측 diff 카드 표시. assistant 말풍선은 빈 채로 끝날 수 있음 |
| 정보 부족 clarification | `token(되묻기) → done` | 되묻기 말풍선, diff 없음 |
| 코드 검증 실패 | `token(초안 생성 실패/보완 요청) → done` | 텍스트만 표시 |
| 초안 LLM timeout | `error(LLM_TIMEOUT)` | 오류 박스 |
| 초안 생성/checkpoint 실패 | `error(INTERNAL)` | 오류 박스 |
| `N번 적용해줘` 성공 | `draft → done` | 분석 이력의 N번 추천을 diff 카드로 표시 |
| 적용할 이력/상품 없음 | `token(적용 불가 안내) → done` | 텍스트만 표시 |
| 적용 중 Spring 실패 | `token(사과) → error(INTERNAL)` | 사과 token은 숨고 오류 message만 표시 |

### 5.3 수정 확인/취소의 현재 계약 공백

AI가 승인으로 인정하는 유일한 message는 JSON 문자열이다.

```json
{"action":"confirm","draftId":"draft-id"}
```

하지만 FE는 현재 다음 문자열을 보낸다.

```text
[수정 확인] draft-id
```

따라서 **현재 `이대로 수정` 버튼은 AI confirm 분기로 들어가지 않고 일반 supervisor 라우팅으로 흐른다.**

또한 AI confirm 성공/만료/중복/미존재 결과는 `token → done`만 보내고 `PRODUCT_UPDATED` action을 보내지 않는다. FE는 `PRODUCT_UPDATED|PRODUCT_UPDATE_FAILED` action을 받아야 diff 카드를 settled 상태로 잠그므로, JSON 형식을 맞추더라도 현재 카드는 자동 완료 처리되지 않는다.

취소도 AI 전용 cancel 계약이 없다.

- FE는 `취소` 클릭 즉시 diff 카드를 로컬에서 제거한다.
- 이후 `[수정 취소] draft-id`를 일반 message로 AI에 보낸다.
- AI checkpoint의 draft를 명시적으로 폐기하는 로직은 현재 없다.

## 6. 스트림 시작 전 HTTP 오류

이 경우 SSE frame이 아니라 JSON 오류 envelope가 온다.

```json
{
  "error": {
    "code": "STREAM_IN_PROGRESS",
    "message": "동일 세션에 진행 중인 스트림이 있습니다",
    "requestId": "로그 상관관계 ID"
  }
}
```

| HTTP | code 예시 | 발생 상황 | FE 현재 처리 |
|---|---|---|---|
| 400 | `BAD_REQUEST` | body 누락, 길이 제한, validation 실패 | generic 오류 문구 |
| 401 | `TOKEN_INVALID`, `TOKEN_EXPIRED` | stream ticket 무효/만료 | Spring에서 ticket 재발급 후 원 요청 1회 재시도 |
| 403 | `FORBIDDEN` | 판매자 scope/brandId 없음 | generic 오류 문구 |
| 409 | `STREAM_IN_PROGRESS` | 같은 사용자·session에 활성 stream 존재 | generic 오류 문구 |
| 429 | `RATE_LIMITED` | 분/시간 rate limit 초과 | generic 오류 문구 |
| 500 | `INTERNAL` | stream 시작 전 내부 오류 | generic 오류 문구 |
| 504 | `UPSTREAM_TIMEOUT` | 첫 event가 제한시간 내 오지 않음 | generic 오류 문구 |

generic 문구는 `응답을 받지 못했어요. 다시 시도해 주세요.`다. FE는 현재 HTTP 오류 body의 `code`, `message`, `requestId`를 읽지 않는다. 401 재발급 요청 또는 재시도 stream이 다시 실패하면 역시 generic 오류가 된다.

stream 시작 후 전체 시간 제한에 도달하면 FastAPI는 오류가 아니라 `done(stop)`을 추가하고 연결을 닫는다. FE에는 부분 답변만 남을 수 있다.

## 7. FE 결과 상태가 교체되는 규칙

한 turn에서 `products.ready`, `draft`, legacy structured event가 처음 도착할 때만 이전 `results`를 교체한다. 그 다음 structured event부터는 같은 turn 결과에 누적한다.

다음 이벤트는 `results`를 교체하지 않는다.

- `token`
- `conditions`
- `suggestions`(미처리)
- `action`
- `done`
- `error`

따라서 0건, 일반 대화, 장바구니, search error, push 실패 turn에서는 이전 우측 panel이 남는다. `새 대화`를 누르면 messages/results/conditions/session을 모두 초기화한다.

`conditions`도 추천 intent가 새 `conditions` event를 보낼 때만 교체된다. 일반 대화나 장바구니 turn에는 conditions event가 없으므로 직전 추천 조건 pill이 계속 남는다.

## 8. 현재 계약 공백 우선순위

| 우선순위 | 공백 | 사용자 영향 |
|---|---|---|
| P0 | FE 수정 확인 문자열과 AI JSON confirm 계약 불일치 | 판매자 `이대로 수정`이 실제 승인 실행으로 연결되지 않음 |
| P0 | AI `suggestions`를 FE가 처리하지 않음 | 최근 구매 억제 되돌리기 방법이 사용자에게 보이지 않음 |
| P1 | FE가 `done.zero_result`를 무시 | 0건인데 이전 상품 카드가 남아 오해 가능 |
| P1 | AI confirm은 token만, FE settled는 action 의존 | 성공해도 diff 카드가 완료 상태로 잠기지 않음 |
| P1 | AI 판매자 분석은 token 산문, FE 구조화 지표 UI는 legacy event 의존 | 차트·지표·상품 통계 panel이 실제 AI 응답으로 채워지지 않음 |
| P1 | MSW가 구 channel/body/event 계약 사용 | mock 판매자와 실제 판매자 동작이 다름 |
| P2 | FE가 HTTP 오류 envelope와 `error.code`를 표시하지 않음 | 원인과 requestId 없이 generic 오류만 보임 |
| P2 | `conditions` field/value와 `action.reason` 미사용 | 조건 조작과 오류별 UI 분기 불가 |
| P2 | `budget`은 spec 초안만 존재 | 총액 예산 전용 UI/응답 없음 |

## 9. 변경 시 확인할 파일

### AI

- `app/schemas/chat.py`
- `app/agents/buyer/graph.py`
- `app/agents/buyer/recommendation/graph.py`
- `app/agents/buyer/cart/graph.py`
- `app/api/seller.py`
- `app/core/stream.py`
- `app/core/errors.py`

### FE

- `src/shared/types/chat.ts`
- `src/shared/chat/streamChat.ts`
- `src/shared/chat/useChat.ts`
- `src/shared/chat/store.ts`
- `src/shared/chat/MessageList.tsx`
- `src/pages/chat/components/ProductPanel.tsx`
- `src/pages/seller/components/SellerResultPanel.tsx`
- `src/pages/seller/components/ProductDiffCard.tsx`

이벤트를 추가하거나 필드를 바꿀 때는 AI schema/emit test와 FE type/handler/render test를 같은 변경 단위로 맞춰야 한다.
