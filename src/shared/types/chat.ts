import type { SeededProductCard } from "@/shared/types/product";

/** 채팅 API 계약 타입 — 백엔드/LLM 스키마와 1:1. 변경 시 계약 문서와 함께 갱신 */
export type ChatChannel = "SHOPPING" | "CS" | "SELLER";

/**
 * 사용자가 지금 보고 있는 화면 — 사이드 채팅에서 "이거 왜 이래?" 같은 지시어를 해석하려면 필요.
 * TODO: 백엔드 협의 항목 (07-17 프론트 제안)
 */
export interface ChatScreenContext {
  path: string; // "/seller/orders"
  label: string; // "주문 목록" — LLM 프롬프트에 그대로 쓸 수 있는 한글 이름
  filters?: Record<string, string>; // { status: "신규주문", page: "1" }
}

/**
 * SSE 스트림 요청 body(streamChat 이 그대로 직렬화).
 * - 일반/제안: message 를 보낸다.
 * - 승인(confirm): action:"confirm" + draftId 를 최상위로 보낸다(발화≠동의, message 없음).
 * 신원(userId·sellerId·brandId)·channel 은 body 에 없다 — 세션 발급 단계에서 서버가 도출해
 * 티켓 claim 에 박으므로, SSE body 는 순수 대화 필드만 싣는다(IDOR 방지).
 * 선택 대상(주문/상품)은 계약상 별도 필드가 없다 — message 자연어에 녹여 LLM이 처리한다.
 */
export interface StreamChatBody {
  sessionId: string; // 세션 발급으로 받은 BE 발급값
  threadId?: string; // 대화 스레드 식별자
  message?: string; // confirm 요청에선 생략
  screen?: ChatScreenContext; // 사이드 채팅에서만 전송
  action?: "confirm"; // draft 승인 — message 대신 이 필드로 확정
  draftId?: string; // action:"confirm" 일 때 대상 draft
}

/**
 * 챗 스트림 진입 티켓 — SSE 연결 전에 BE(Spring)가 발급한다.
 * 로그인 AT 를 이 API 로 교환해 단명 streamTicket 을 받고, SSE 요청엔 티켓을 싣는다.
 * (셀러: brandId 는 클라이언트 주장이 아니라 서버가 JWT→DB 로 도출해 티켓 claim 에 박음)
 */
export interface ChatSession {
  sessionId: string; // BE(Redis) 발급, 10분 sliding TTL
  ttlSeconds: number; // 세션 TTL(초)
  streamTicket: string; // 단명 JWT(RS256, TTL 30~60s) — SSE Authorization 에 사용
  ticketTtlSeconds: number; // 티켓 TTL(초)
  llmSseUrl: string; // FE 가 SSE POST 할 엔드포인트(BE 설정값)
}

// 시딩 계약(SeededProductCard)에 AI 추천 이유만 더한 형태 — 상세 캐시 승계 호환 유지
export interface ProductCard extends SeededProductCard {
  reason: string; // AI 추천 이유 한 줄(CH-5는 없으면 null → FE에서 "")
  purchasable?: boolean; // 재고·판매 가능 여부(CH-5). 목록은 이미 품절 드롭이라 대개 true
}

export interface ProductGroup {
  title: string;
  items: ProductCard[];
}

/**
 * CH-5 추천 목록 조회 응답(GET /api/chat/lists/{listId}) 데이터부.
 * CH-2 SSE 의 products.ready{listId} 수신 후 조회한다. items 는 플랫 배열(순서 유지).
 * BE 가 카드 완결 필드를 최신값으로 부착(상품명·가격·정가·이미지·rating·reviewCount·purchasable).
 * HIDDEN·품절은 BE 가 드롭. listId TTL=세션 TTL(10분), 만료·미존재 404 RESOURCE_NOT_FOUND.
 */
export interface ChatListResponse {
  listId: string;
  items: (SeededProductCard & {
    reason: string | null; // I-21 콜백 reasons echo, 없으면 null
    purchasable: boolean;
  })[];
}

// ── SHOPPING/CS 전용 페이로드 (계약 CH-2) ──

/**
 * AI가 추출한 필터 조건 칩. 제거 가능하게 노출한다.
 * 칩 제거는 왕복 — 다음 턴 message에 규약 문자열(`[조건 제거] <field>`)을 실어 재분해를 트리거.
 */
export interface ConditionChip {
  field: string; // "priceMax" — 제거 왕복의 식별자
  label: string; // "5만원 이하" — 표시용
  value: string | number; // 50000 | "여행용품/보안용품"
}

/**
 * 완화/되돌리기 제안 칩. relaxation(조건 완화) 또는 revert(카테고리 되돌리기) 중 정확히 하나.
 * estCount==0 은 서버가 제외하지만 FE도 방어적으로 걸러 표시하지 않는다.
 */
export interface SuggestionChip {
  label: string; // "6만원대까지 볼까요?"
  estCount: number; // 완화 시 예상 결과 수(0이면 표시 안 함)
  relaxation?: { field: string; value: string | number };
  revert?: { category: string };
}

// ── SELLER 채널 전용 페이로드 ──
// 판매자 챗은 SHOPPING과 동일 엔드포인트를 channel만 바꿔 쓰지만 이벤트 집합이 다르다.
// 통계 답변은 차트 카드가 아니라 자연어 token 으로 오고, 쓰기(수정/삭제/등록)는
// draft(HITL 승인 대기) → confirm 흐름으로 온다. (계약 v2, 2026-07-22)

/** 첫 프레임 — FE가 즉시 레이아웃·로딩을 준비하는 레인 신호 */
export type SellerLane =
  | "analysis" // 통계 Q&A (progress 후 token)
  | "product" // 상품 상세 수정 제안 → draft
  | "general" // 일반 대화·되묻기
  | "confirm" // draft 승인 실행 결과
  | "apply" // "N번 적용해줘" 추천 적용 → draft
  | "refused"; // 도메인 밖 질문 거절

/** 종료 시 우측 패널 조치 — replace(교체) / keep(유지) / refresh(재조회) */
export type SellerPanel = "replace" | "keep" | "refresh";

/** 상품 수정 제안 필드(camelCase 8종) */
export type SellerDraftField =
  | "name"
  | "price"
  | "originalPrice"
  | "description"
  | "category"
  | "imageUrl"
  | "status"
  | "stockQuantity";

/** 상품 상세 수정/삭제/등록 제안(HITL 승인 대기) */
export interface SellerDraft {
  draftId: string; // confirm이 참조(보여준 것 == 실행)
  op: "update" | "create" | "delete";
  productId: number | null; // create는 null 일 수 있음
  changes: {
    field: SellerDraftField | string;
    before: string | number;
    after: string | number;
  }[];
  summary: string; // "가격을 27,500원으로 인하"
}

// ── 이벤트 스트림 ──
// 와이어 포맷: 각 이벤트는 `data: {"type":..., "data":{...}}` 한 줄(구매자·판매자 공통).
// event: 라인은 쓰지 않는다 — payload 의 type 으로 구분한다.

// 장바구니 담기 실패 사유(계약 CH-2 §action).
// message는 AI가 조립한 사용자 노출 문구 → FE는 그대로 표시하고 reason으로만 분기.
export type CartAddFailReason =
  | "PRODUCT_NOT_FOUND"
  | "STOCK_INSUFFICIENT" // 재고 부족·품절(OUT_OF_STOCK 통합)
  | "CART_ERROR"; // 운영 오류 또는 수량 상한 초과(합산>99)

export type ChatAction =
  // ── SHOPPING/CS ──
  | { type: "CART_ADDED"; message: string; cartItemId: number }
  | { type: "CART_ADD_FAILED"; message: string; reason: CartAddFailReason }
  // ── SELLER ──
  | { type: "PRODUCT_UPDATED"; message: string; productId: number }
  | { type: "PRODUCT_UPDATE_FAILED"; message: string; productId: number };

// 구매자 정상 종료 사유(계약 CH-2 §done). zero_result = 결과 0건.
export type ChatFinishReason = "stop" | "zero_result";

// 스트림 내부 오류 코드(계약 CH-2 §error). 종결 이벤트.
export type ChatErrorCode =
  | "LLM_TIMEOUT"
  | "LLM_UNAVAILABLE"
  | "SEARCH_FAILED"
  | "INTERNAL";

export type ChatEvent =
  // ── 공통 ──
  | { type: "token"; data: { text: string } }
  | {
      type: "done";
      // finishReason: 구매자 stop|zero_result. panel: 판매자 우측 패널 조치.
      data: { finishReason: ChatFinishReason; panel?: SellerPanel };
    }
  | { type: "error"; data: { code: ChatErrorCode; message: string } }
  // ── SHOPPING/CS 전용 ──
  | { type: "conditions"; data: { chips: ConditionChip[] } }
  | { type: "suggestions"; data: { chips: SuggestionChip[] } }
  // products.ready: 카드가 아니라 상관키 listId 만 온다(경로 B). FE가 CH-5로 목록을 조회한다.
  | { type: "products.ready"; data: { sessionId?: string; listId: string } }
  // products: 카드를 직접 싣는 구버전/폴백 경로(경로 A). 목·초기 시딩에서 사용.
  | { type: "products"; data: { groups: ProductGroup[] } }
  | { type: "action"; data: ChatAction }
  // ── SELLER 전용 ──
  | { type: "meta"; data: { lane: SellerLane } }
  | { type: "progress"; data: { text: string } }
  | { type: "draft"; data: SellerDraft };

/**
 * 채팅 결과 패널에 쌓이는 항목. 채널별로 종류가 다르므로 유니온으로 두고
 * 렌더러는 페이지가 주입한다(공통 모듈은 도메인 UI를 모른다).
 * - SHOPPING: products (상품 카드)
 * - SELLER: draft (수정 제안 diff 카드) — 통계 답변은 token 으로만 오므로 결과 카드가 없다
 */
export type ChatResult =
  | { kind: "products"; groups: ProductGroup[] }
  | { kind: "draft"; draft: SellerDraft; settled?: ChatAction };
