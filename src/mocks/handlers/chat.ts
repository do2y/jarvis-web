import { http, HttpResponse } from "msw";
import { BASE } from "../shared";

// ── SELLER 채널 목 (shared/types/chat.ts 판매자 이벤트 계약) ──
// 상품명·이미지는 MOCK_CHAT_PRODUCTS와 맞춰 화면 간 일관성 유지

const MOCK_SELLER_METRICS = [
  {
    key: "revenue",
    label: "오늘 매출",
    value: 12480000,
    unit: "KRW",
    deltaRate: 8.2,
    caption: "어제 대비",
  },
  {
    key: "orders",
    label: "주문 건수",
    value: 342,
    unit: "COUNT",
    deltaRate: 5.1,
    caption: "어제 대비",
  },
  {
    key: "aov",
    label: "객단가",
    value: 36500,
    unit: "KRW",
    deltaRate: 2.9,
    caption: "어제 대비",
  },
  {
    key: "conversion",
    label: "전환율",
    value: 3.4,
    unit: "PERCENT",
    deltaRate: -1.2,
    caption: "어제 대비",
  },
];

const MOCK_SELLER_ANALYSIS = {
  title: "최근 7일 매출 추이",
  chartType: "line",
  unit: "KRW",
  series: [
    {
      label: "매출",
      points: [
        { x: "월", y: 7120000 },
        { x: "화", y: 8340000 },
        { x: "수", y: 7980000 },
        { x: "목", y: 9450000 },
        { x: "금", y: 8870000 },
        { x: "토", y: 10240000 },
        { x: "일", y: 12480000 },
      ],
    },
  ],
  summary:
    "주말로 갈수록 매출이 오르는 패턴이에요. 토·일 유입이 많으니 금요일 저녁에 프로모션을 걸면 효과가 클 것 같아요.",
};

const MOCK_SELLER_SALES = {
  title: "상품별 판매 데이터",
  kind: "SALES",
  items: [
    {
      productId: 201,
      name: "가먼트 다잉 오버핏 반팔 티셔츠 TSOP1180",
      imageUrl:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260415/6317871/6317871_17811631352969_big.jpg?w=1200",
      code: "GLT-TS-0412",
      price: 92000,
      stock: 124,
      salesCount: 1204,
      status: "ON_SALE",
    },
    {
      productId: 202,
      name: "코튼 릴렉스 반팔 티셔츠 NVOP3300",
      imageUrl:
        "https://image.msscdn.net/thumbnails/images/goods_img/20251015/5593843/5593843_17652503983820_big.png?w=1200",
      code: "GLT-TS-0398",
      price: 118000,
      stock: 86,
      salesCount: 986,
      status: "ON_SALE",
    },
  ],
};

const MOCK_SELLER_LOW_STOCK = {
  title: "재고 부족 상품",
  kind: "LOW_STOCK",
  items: [
    {
      productId: 203,
      name: "벨티드 린넨 원피스",
      imageUrl:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260415/6317871/6317871_17811631352969_big.jpg?w=1200",
      code: "GLT-OP-0412",
      price: 89000,
      stock: 4,
      salesCount: 1204,
      status: "ON_SALE",
    },
    {
      productId: 204,
      name: "크롭 트위드 자켓",
      imageUrl:
        "https://image.msscdn.net/thumbnails/images/goods_img/20251015/5593843/5593843_17652503983820_big.png?w=1200",
      code: "GLT-JK-0371",
      price: 128000,
      stock: 0,
      salesCount: 1532,
      status: "SOLD_OUT",
    },
  ],
};

const MOCK_SELLER_DIFF = {
  draftId: "draft-8f21",
  productId: 201,
  productName: "가먼트 다잉 오버핏 반팔 티셔츠 TSOP1180",
  fields: [
    { field: "price", label: "판매가", before: "92,000원", after: "78,000원" },
    { field: "stock", label: "재고", before: 124, after: 200 },
    {
      field: "description",
      label: "상품 설명",
      before: "가먼트 다잉으로 자연스러운 워싱감",
      after: "가먼트 다잉으로 자연스러운 워싱감 · 여름 신상 할인",
    },
  ],
  confirmMessage: "위 내용으로 상품 정보를 수정할까요?",
};

// 판매자 답변 문구 — 발화 의도별 분기
function sellerAnswer(
  message: string,
  intent: {
    confirmed: boolean;
    canceled: boolean;
    isEditIntent: boolean;
    screen?: { label: string; filters?: Record<string, string> };
  },
): string {
  if (intent.confirmed) return "요청하신 대로 상품 정보를 수정했어요.";
  if (intent.canceled) return "수정을 취소했어요.";
  if (intent.isEditIntent)
    return "수정할 내용을 정리했어요. 변경 전후를 확인하고 진행해 주세요.";

  // 사이드 채팅이면 보고 있는 화면을 반영한 답변 — 실제 LLM은 이 맥락으로 지시어를 해석함
  if (intent.screen) {
    const filter = intent.screen.filters?.["상태"];
    const where =
      filter && filter !== "전체"
        ? `${intent.screen.label}의 '${filter}'`
        : intent.screen.label;
    return `지금 보고 계신 ${where} 화면 기준으로 분석했어요. "${message}"에 대한 결과예요.`;
  }
  return `"${message}" 기준으로 분석했어요. 매출·주문 요약과 상품별 데이터를 함께 확인해 보세요.`;
}

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

export const chatHandlers = [
  // 채팅 (SSE) — 3개 챗봇이 channel만 바꿔 공유하는 단일 엔드포인트
  http.post(`${BASE}/api/chat`, async ({ request }) => {
    const body = (await request.json()) as {
      message: string;
      channel?: "SHOPPING" | "CS" | "SELLER";
      screen?: {
        path: string;
        label: string;
        filters?: Record<string, string>;
      };
    };
    const encoder = new TextEncoder();

    const sse = (event: string, data: unknown) =>
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    const isSeller = body.channel === "SELLER";

    // 수정 확인/취소는 후속 메시지로 오므로 프리픽스로 분기 (별도 API 없음)
    const confirmMatch = body.message.match(/^\[수정 확인\] (.+)$/);
    const cancelMatch = body.message.match(/^\[수정 취소\] (.+)$/);
    // 수정 요청으로 볼 발화 — 목에선 "수정/변경/할인/가격" 포함 여부로 단순 판별
    const isEditIntent =
      isSeller && /수정|변경|할인|가격|바꿔/.test(body.message);

    const answer = isSeller
      ? sellerAnswer(body.message, {
          confirmed: !!confirmMatch,
          canceled: !!cancelMatch,
          isEditIntent,
          screen: body.screen,
        })
      : `"${body.message}"에 맞는 상품을 찾았어요. 조건을 더 좁히고 싶으시면 말씀해 주세요.`;

    const stream = new ReadableStream({
      async start(controller) {
        // 1) 텍스트 토큰 스트리밍 (한 어절씩)
        for (const word of answer.split(" ")) {
          controller.enqueue(sse("token", { text: word + " " }));
          await new Promise((r) => setTimeout(r, 40));
        }

        if (isSeller) {
          if (confirmMatch) {
            // 수정 완료 결과
            controller.enqueue(
              sse("action", {
                type: "PRODUCT_UPDATED",
                message: "상품 정보가 수정됐어요.",
                productId: MOCK_SELLER_DIFF.productId,
              }),
            );
          } else if (cancelMatch) {
            // 취소는 실패가 아니므로 action 없이 안내 문구만 — 카드는 프론트가 걷어냄
          } else if (isEditIntent) {
            // 상품 정보 변경 전·후 비교 + 최종 확인
            controller.enqueue(sse("productDiff", MOCK_SELLER_DIFF));
          } else {
            // 매출·주문 요약 → 분석 그래프 → 상품별 판매 데이터 → 재고 부족
            controller.enqueue(sse("metrics", { items: MOCK_SELLER_METRICS }));
            controller.enqueue(sse("analysis", MOCK_SELLER_ANALYSIS));
            controller.enqueue(sse("productStats", MOCK_SELLER_SALES));
            controller.enqueue(sse("productStats", MOCK_SELLER_LOW_STOCK));
          }
        } else {
          // 2) 조건 칩
          controller.enqueue(
            sse("conditions", { items: ["원피스", "기념일", "10만원 이하"] }),
          );
          // 3) 상품 카드 (shared/types/chat.ts의 ProductCard 계약)
          controller.enqueue(
            sse("products", {
              groups: [
                {
                  title: "추천 상품",
                  items: MOCK_CHAT_PRODUCTS,
                },
              ],
            }),
          );
        }

        // 4) 종료
        controller.enqueue(sse("done", { finishReason: "stop" }));
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  }),
];
