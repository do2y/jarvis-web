/** 채팅 API 계약 타입 — 백엔드/LLM 스키마(07-07 기준)와 1:1. 변경 시 계약 문서와 함께 갱신 */
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

export interface ChatRequest {
  sessionId: string;
  threadId: string;
  message: string;
}

export interface ProductCard {
  productId: number;
  name: string;
  brandName: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  reason: string; // AI 추천 이유 한 줄
}

export interface ProductGroup {
  title: string;
  items: ProductCard[];
}

// ── SELLER 채널 전용 페이로드 ──
// 판매자 챗봇은 SHOPPING과 동일한 API를 channel만 바꿔 쓰고, 결과 이벤트만 다르다.

/** 매출·주문 요약 카드 한 칸 */
export interface SellerMetric {
  key: string; // "revenue" | "orders" | "aov" | "visitors" …
  label: string;
  value: number;
  unit: "KRW" | "COUNT" | "PERCENT";
  deltaRate?: number; // 이전 대비 증감률(%), 부호로 상승·하락 표현
  caption?: string; // "어제 대비"
}

/** 판매 분석 그래프 */
export interface SellerAnalysis {
  title: string;
  chartType: "line" | "bar";
  unit: "KRW" | "COUNT";
  series: { label: string; points: { x: string; y: number }[] }[];
  summary?: string; // AI 한 줄 해석
}

export type SellerProductStatus = "ON_SALE" | "SOLD_OUT" | "HIDDEN";

/** 상품별 판매 데이터 / 재고 부족 목록의 한 행 */
export interface SellerProductStat {
  productId: number;
  name: string;
  imageUrl: string;
  code: string;
  price: number;
  stock: number;
  salesCount: number;
  status: SellerProductStatus;
}

export interface SellerProductStats {
  title: string;
  kind: "SALES" | "LOW_STOCK";
  items: SellerProductStat[];
}

/** 상품 정보 변경 전·후 비교 + 최종 확인 요청 */
export interface SellerProductDiff {
  draftId: string; // 확인/취소 후속 메시지에 실어 보낼 키
  productId: number;
  productName: string;
  fields: {
    field: string;
    label: string;
    before: string | number;
    after: string | number;
  }[];
  confirmMessage: string;
}

export type ChatAction =
  | { type: "CART_ADDED"; message: string; cartItemId: number }
  | { type: "CART_ADD_FAILED"; message: string; cartItemId?: number }
  | { type: "PRODUCT_UPDATED"; message: string; productId: number }
  | { type: "PRODUCT_UPDATE_FAILED"; message: string; productId: number };

export type ChatEvent =
  | { event: "token"; data: { text: string } }
  | { event: "conditions"; data: { chips: { label: string }[] } }
  | { event: "products.ready"; data: { sessionId: string; listId: string } }
  | { event: "products"; data: { groups: ProductGroup[] } }
  | { event: "action"; data: ChatAction }
  | { event: "done"; data: { finishReason: string } }
  | { event: "error"; data: { code: string; message: string } }
  // ── SELLER 전용 ──
  | { event: "metrics"; data: { items: SellerMetric[] } }
  | { event: "analysis"; data: SellerAnalysis }
  | { event: "productStats"; data: SellerProductStats }
  | { event: "productDiff"; data: SellerProductDiff }
  | {
      event: "draft";
      data: {
        draftId: string;
        op: string;
        productId: number | null;
        changes: { field: string; before: string | number; after: string | number }[];
        summary: string;
      };
    };

/**
 * 채팅 결과 패널에 쌓이는 항목. 채널별로 종류가 다르므로 유니온으로 두고
 * 렌더러는 페이지가 주입한다(공통 모듈은 도메인 UI를 모른다).
 */
export type ChatResult =
  | { kind: "products"; groups: ProductGroup[] }
  | { kind: "metrics"; items: SellerMetric[] }
  | { kind: "analysis"; analysis: SellerAnalysis }
  | { kind: "productStats"; stats: SellerProductStats }
  | { kind: "productDiff"; diff: SellerProductDiff; settled?: ChatAction };
