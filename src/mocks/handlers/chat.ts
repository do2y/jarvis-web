import { http, HttpResponse } from "msw";
import { BASE, fail, ok } from "../shared";

// ── SELLER 채널 목 (shared/types/chat.ts 판매자 이벤트 계약) ──
// 상품명·이미지는 MOCK_CHAT_PRODUCTS와 맞춰 화면 간 일관성 유지

// 판매자 상품 수정 제안(draft) 목 — 계약 v2 SellerDraft 형태
const MOCK_SELLER_DRAFT = {
  draftId: "draft-8f21",
  op: "update" as const,
  productId: 301,
  changes: [
    { field: "price", before: 89000, after: 78000 },
    { field: "stockQuantity", before: 4, after: 40 },
    {
      field: "description",
      before: "린넨 소재의 벨티드 원피스",
      after: "린넨 소재의 벨티드 원피스 · 여름 신상 할인",
    },
  ],
  summary: "가격을 78,000원으로 인하하고 재고를 40개로 보충",
};

// 챗봇 상품 카드 목 — shared/types/chat.ts ProductCard 계약(상세 캐시 시딩 가능한 완전체)
const MOCK_CHAT_PRODUCTS = [
  {
    productId: 201,
    name: "가먼트 다잉 오버핏 반팔 티셔츠 TSOP1180",
    brandName: "더센트",
    price: 92000,
    originalPrice: 230000,
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20260415/6317871/6317871_17811631352969_big.jpg?w=1200",
    rating: 4.6,
    reviewCount: 312,
    reason: "미니멀한 라인이라 호텔 레스토랑에 과하지 않게 어울려요.",
  },
  {
    productId: 202,
    name: "코튼 릴렉스 반팔 티셔츠 NVOP3300",
    brandName: "라인어디션",
    price: 118000,
    originalPrice: 214000,
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20251015/5593843/5593843_17652503983820_big.png?w=1200",
    rating: 4.8,
    reviewCount: 521,
    reason: "은은한 광택이 조명 아래서 우아하게 살아나요.",
  },
  {
    productId: 203,
    name: "피그먼트 워시드 오버핏 티셔츠 EH2241",
    brandName: "에르모사",
    price: 145000,
    originalPrice: 207000,
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20240328/4002805/4002805_17331895953907_big.jpg?w=1200",
    rating: 4.7,
    reviewCount: 208,
    reason: "기념일 분위기에 잘 맞는 우아한 실루엣이에요.",
  },
  {
    productId: 204,
    name: "코튼 오버핏 반팔 티셔츠 CH1020",
    brandName: "데일리로브",
    price: 64000,
    originalPrice: 89000,
    imageUrl:
      "https://img.29cm.co.kr/item/202604/11f132e7cad3859a9ec501cbcc2e8a97.jpg?width=720&format=webp",
    rating: 4.4,
    reviewCount: 890,
    reason: "데일리로 편하게 입기 좋은 기본 티셔츠예요.",
  },
  {
    productId: 205,
    name: "드롭숄더 하프 슬리브 티셔츠 FL7788",
    brandName: "라인어디션",
    price: 108000,
    originalPrice: 168000,
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20260505/6421311/6421311_17779600135524_big.jpg?w=1200",
    rating: 4.5,
    reviewCount: 447,
    reason: "화사한 패턴이 봄 나들이에 잘 어울려요.",
  },
  {
    productId: 206,
    name: "가먼트 다잉 포켓 티셔츠 DT3311",
    brandName: "쁘띠메종",
    price: 73000,
    originalPrice: 120000,
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/prd_img/20260618/6694104/detail_6694104_17817540680127_big.jpg?w=1200",
    rating: 4.6,
    reviewCount: 356,
    reason: "레트로한 도트 패턴으로 사랑스러운 무드를 줘요.",
  },
];

// SSE 공통 유틸 — 와이어 포맷 `data: {"type":..., "data":{...}}` 한 줄(event: 라인 없음).
const sseEncoder = new TextEncoder();
const sse = (type: string, data: unknown) =>
  sseEncoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`);

const respondSse = (stream: ReadableStream) =>
  new HttpResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });

const streamWords = async (
  controller: ReadableStreamDefaultController,
  text: string,
) => {
  for (const word of text.split(" ")) {
    controller.enqueue(sse("token", { text: word + " " }));
    await new Promise((r) => setTimeout(r, 40));
  }
};

// 실제 BE 는 세션(Redis)에 channel/brandId 를 저장해 재발급 시 같은 스코프를 유지하지만,
// 목은 상태가 없으므로 sessionId 접두사로 채널을 식별해 재발급 llmSseUrl 을 고른다.
const sellerSse = () => `${BASE}/seller/chat`;
const buyerSse = () => `${BASE}/api/chat`;

export const chatHandlers = [
  // ── 세션·티켓 발급 (SSE 진입 전) — 공통 응답 봉투 { success, data } ──
  // 실제로는 로그인 AT 를 검증해 단명 streamTicket 을 발급하지만, 목은 고정값을 준다.
  // llmSseUrl 은 아래 스트림 목 경로를 그대로 가리켜 목 흐름이 이어지게 한다.

  // 판매자 세션 — POST /api/chat/seller/sessions (SELLER 전용, body 없음)
  http.post(`${BASE}/api/chat/seller/sessions`, () => {
    return HttpResponse.json(
      ok({
        sessionId: `seller-${crypto.randomUUID()}`,
        ttlSeconds: 600,
        streamTicket: "mock-seller-ticket",
        ticketTtlSeconds: 60,
        llmSseUrl: sellerSse(),
      }),
    );
  }),

  // 구매자 세션 — POST /api/chat/sessions (channel: SHOPPING|CS)
  http.post(`${BASE}/api/chat/sessions`, () => {
    return HttpResponse.json(
      ok({
        sessionId: `buyer-${crypto.randomUUID()}`,
        ttlSeconds: 600,
        streamTicket: "mock-chat-ticket",
        ticketTtlSeconds: 60,
        llmSseUrl: buyerSse(),
      }),
    );
  }),

  // 스트림 티켓 재발급(CH-1b) — POST /api/chat/tickets
  // 기존 세션 유지한 채 새 티켓만 발급. sessionId 접두사로 채널을 판별해 같은 llmSseUrl 을 유지한다.
  http.post(`${BASE}/api/chat/tickets`, async ({ request }) => {
    const { sessionId } = (await request.json()) as { sessionId?: string };
    if (!sessionId) {
      return HttpResponse.json(
        fail("SESSION_NOT_FOUND", "세션을 찾을 수 없습니다."),
        { status: 404 },
      );
    }
    const isSeller = sessionId.startsWith("seller-");
    return HttpResponse.json(
      ok({
        sessionId, // 같은 세션 유지(맥락 단절 없음)
        ttlSeconds: 600,
        streamTicket: isSeller ? "mock-seller-ticket" : "mock-chat-ticket",
        ticketTtlSeconds: 60,
        llmSseUrl: isSeller ? sellerSse() : buyerSse(),
      }),
    );
  }),

  // ── 구매자 챗 (SHOPPING/CS) — POST /api/chat ──
  http.post(`${BASE}/api/chat`, async ({ request }) => {
    const body = (await request.json()) as { message?: string };
    const message = body.message ?? "";

    const answer = `"${message}"에 맞는 상품을 찾았어요. 조건을 더 좁히고 싶으시면 말씀해 주세요.`;
    return respondSse(
      new ReadableStream({
        async start(controller) {
          await streamWords(controller, answer);
          controller.enqueue(
            sse("conditions", { items: ["원피스", "기념일", "10만원 이하"] }),
          );
          controller.enqueue(
            sse("products", {
              groups: [{ title: "추천 상품", items: MOCK_CHAT_PRODUCTS }],
            }),
          );
          controller.enqueue(sse("done", { finishReason: "stop" }));
          controller.close();
        },
      }),
    );
  }),

  // ── 판매자 챗 — POST /seller/chat (계약 v2: meta → progress? → token/draft → done{panel}) ──
  // 신원은 JWT 클레임에서만 도출되므로 body 에 channel·brandId·userId 가 없다(계약 §2.1).
  http.post(`${BASE}/seller/chat`, async ({ request }) => {
    const body = (await request.json()) as {
      message?: string;
      action?: "confirm";
      draftId?: string;
      screen?: {
        path: string;
        label: string;
        filters?: Record<string, string>;
      };
    };
    const message = body.message ?? "";

    // (b) 승인 요청 — 발화가 아니라 최상위 action/draftId 로 온다
    if (body.action === "confirm") {
      return respondSse(
        new ReadableStream({
          async start(controller) {
            controller.enqueue(sse("meta", { lane: "confirm" }));
            await streamWords(
              controller,
              "가격을 78,000원으로 변경하고 재고를 40개로 보충했어요.",
            );
            // 실제 반영 → refresh(우측 목록 재조회)
            controller.enqueue(
              sse("done", { finishReason: "stop", panel: "refresh" }),
            );
            controller.close();
          },
        }),
      );
    }

    // 발화 의도 분기 — 목에선 키워드로 단순 판별(실제는 LLM 라우팅)
    const isEditIntent = /수정|변경|할인|가격|바꿔|올려|내려|재고/.test(message);
    const isRefused = /날씨|주식|번역|레시피/.test(message);

    if (isRefused) {
      return respondSse(
        new ReadableStream({
          async start(controller) {
            controller.enqueue(sse("meta", { lane: "refused" }));
            await streamWords(
              controller,
              "판매 운영과 관련된 질문에만 답변드릴 수 있어요.",
            );
            controller.enqueue(
              sse("done", { finishReason: "stop", panel: "keep" }),
            );
            controller.close();
          },
        }),
      );
    }

    if (isEditIntent) {
      // 상품 상세 수정 제안 → draft (그래프 interrupt, 우측 패널 교체)
      return respondSse(
        new ReadableStream({
          async start(controller) {
            controller.enqueue(sse("meta", { lane: "product" }));
            await streamWords(
              controller,
              "요청하신 수정 내용을 정리했어요. 변경 전후를 확인하고 적용해 주세요.",
            );
            controller.enqueue(sse("draft", MOCK_SELLER_DRAFT));
            controller.enqueue(
              sse("done", { finishReason: "stop", panel: "replace" }),
            );
            controller.close();
          },
        }),
      );
    }

    // 통계 Q&A — progress(분석 로딩) 후 자연어 token. 결과 카드 없음(패널 유지)
    const where = body.screen?.filters?.["상태"];
    const scope =
      body.screen && where && where !== "전체"
        ? `${body.screen.label}의 '${where}' 화면 기준으로 `
        : "";
    return respondSse(
      new ReadableStream({
        async start(controller) {
          controller.enqueue(sse("meta", { lane: "analysis" }));
          controller.enqueue(sse("progress", { text: "매출·주문 분석 중…" }));
          await new Promise((r) => setTimeout(r, 500));
          await streamWords(
            controller,
            `${scope}지난주 매출은 전주 대비 12% 감소했어요. 주말 유입이 많으니 금요일 저녁 프로모션을 추천드려요.`,
          );
          controller.enqueue(
            sse("done", { finishReason: "stop", panel: "keep" }),
          );
          controller.close();
        },
      }),
    );
  }),
];
