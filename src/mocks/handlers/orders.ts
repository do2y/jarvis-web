import { http, HttpResponse } from "msw";
import type { OrderStatus } from "@/pages/mypage/types";
import { BASE, fail, ok } from "../shared";
import { cartDb, MOCK_ORDER_PAGE_ITEMS } from "../data";

// 주문 id 목 증가값 — orderNo는 이 값에서 파생한다(ORD-yyyyMMdd-{id}).
let nextOrderSeq = 1001;

// 생성된 주문의 상태·장바구니 출처 — 재결제(O-2)가 상태 전이와 차감을 판단하는 데 쓴다.
// 실제 백엔드는 주문 테이블을 보지만 목은 이 맵으로 대신한다.
const mockOrders = new Map<
  number,
  { orderNo: string; status: string; cartItemIds: number[] }
>();

// 주문 상세 (O-4) 목 — 목록 항목에 배송지·결제 스냅샷과 can* 액션 플래그를 더해 조립한다.
// 실제 백엔드는 01 §3 매트릭스로 can*를 계산하지만, 목은 대표 상태로 근사한다.
// (FE는 이 boolean만 보고 버튼을 노출하며 상태 판단을 중복 구현하지 않는다 — 명세)
const ORDER_DETAIL_SNAPSHOT = {
  recipient: "김소이",
  phone: "010-1234-5678",
  zipCode: "06292",
  address1: "서울시 강남구 테헤란로 123",
  address2: "102동 1503호",
};

function buildOrderDetail(order: (typeof MOCK_ORDER_PAGE_ITEMS)[number]) {
  // 픽스처에 없는 상태도 규칙에 포함되므로 넓은 타입으로 다룬다
  const s: OrderStatus = order.representativeStatus;
  // 배송 전에만 취소, 배송완료 후에만 반품·후기. 클레임 중·종결 주문은 모두 불가.
  const canCancel = s === "PENDING" || s === "ORDERED";
  const canReturn = s === "DELIVERED" || s === "CONFIRMED";
  const canReview = s === "DELIVERED" || s === "CONFIRMED";

  return {
    orderId: order.orderId,
    orderNo: order.orderNo,
    orderedAt: order.orderedAt,
    paidAt: order.orderedAt,
    status: "PAID",
    representativeStatus: s,
    paymentMethod: "MOCK_CARD",
    deliveryRequest: "문 앞에 놓아주세요",
    address: ORDER_DETAIL_SNAPSHOT,
    totalAmount: order.totalAmount,
    items: order.items.map((it) => ({
      ...it,
      // 정가 스냅샷 — 할인 표시용. 목은 판매가의 약 1.25배로 둔다.
      originalPrice: Math.round((it.price * 1.25) / 1000) * 1000,
      canCancel,
      canReturn,
      canReview,
    })),
  };
}

export const orderHandlers = [
  // 주문 목록 (O-3) — page(기본 0)/size(기본 10). 로그인 필요.
  http.get(`${BASE}/api/orders`, ({ request }) => {
    if (!request.headers.get("Authorization")) {
      return HttpResponse.json(fail("AUTH_REQUIRED", "로그인이 필요합니다."), {
        status: 401,
      });
    }
    const params = new URL(request.url).searchParams;
    const page = Number(params.get("page") ?? 0);
    const size = Number(params.get("size") ?? 10);
    const start = page * size;

    return HttpResponse.json(
      ok({
        content: MOCK_ORDER_PAGE_ITEMS.slice(start, start + size),
        page,
        size,
        totalElements: MOCK_ORDER_PAGE_ITEMS.length,
        totalPages: Math.ceil(MOCK_ORDER_PAGE_ITEMS.length / size),
      }),
    );
  }),

  // 주문 상세 (O-4) — 로그인 필요. 없는 주문·타인 주문 모두 404로 존재 은닉(IDOR 관례).
  http.get(`${BASE}/api/orders/:orderId`, ({ params, request }) => {
    if (!request.headers.get("Authorization")) {
      return HttpResponse.json(fail("AUTH_REQUIRED", "로그인이 필요합니다."), {
        status: 401,
      });
    }
    const id = Number(params.orderId);
    const order = MOCK_ORDER_PAGE_ITEMS.find((o) => o.orderId === id);
    if (!order) {
      return HttpResponse.json(
        fail("ORDER_NOT_FOUND", "주문을 찾을 수 없습니다."),
        { status: 404 },
      );
    }
    return HttpResponse.json(ok(buildOrderDetail(order)));
  }),

  // ── 주문 생성 + 모의 결제 (O-1) ──
  // 라인아이템 출처는 cartItemIds / items 중 정확히 하나. 금액은 서버(=목)가 재계산하므로
  // body의 금액 필드는 아예 받지 않는다. 결제 성공·실패 모두 200이고 status로 구분.
  http.post(`${BASE}/api/orders`, async ({ request }) => {
    const body = (await request.json()) as {
      cartItemIds?: number[];
      items?: { productId: number; optionId?: number; quantity: number }[];
      addressId?: number;
      address?: Record<string, string>;
      deliveryRequest?: string;
      paymentMethod: string;
    };

    const hasCart =
      Array.isArray(body.cartItemIds) && body.cartItemIds.length > 0;
    const hasDirect = Array.isArray(body.items) && body.items.length > 0;
    if (hasCart === hasDirect) {
      return HttpResponse.json(
        fail("INVALID_REQUEST", "주문 상품 정보가 올바르지 않습니다."),
        { status: 400 },
      );
    }
    if (!body.addressId && !body.address) {
      return HttpResponse.json(
        fail("INVALID_REQUEST", "배송지를 선택해주세요."),
        { status: 400 },
      );
    }

    // 장바구니 경유: 타인 아이템(존재하지 않는 id) 403, HIDDEN 포함 400
    const lines = hasCart
      ? body.cartItemIds!.map((id) =>
          cartDb.items.find((it) => it.cartItemId === id),
        )
      : [];
    if (hasCart && lines.some((it) => !it)) {
      return HttpResponse.json(
        fail("AUTH_FORBIDDEN", "이 주문을 처리할 권한이 없어요."),
        { status: 403 },
      );
    }
    if (hasCart && lines.some((it) => it && !it.purchasable)) {
      return HttpResponse.json(
        fail(
          "PRODUCT_NOT_PURCHASABLE",
          "구매할 수 없는 상품이 포함되어 있습니다.",
        ),
        { status: 400 },
      );
    }

    // 수량은 아이템당 1~99
    const quantities = hasCart
      ? lines.map((it) => it!.quantity)
      : body.items!.map((it) => it.quantity);
    if (quantities.some((q) => q < 1 || q > 99)) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "수량이 올바르지 않습니다.",
            fields: [
              { field: "quantity", message: "수량은 1~99개여야 합니다." },
            ],
          },
        },
        { status: 400 },
      );
    }

    // 옵션이 해당 상품 소속인지 (items[] 경로도 동일 적용)
    if (
      hasDirect &&
      body.items!.some(
        (it) =>
          it.optionId != null &&
          !cartDb.items.some(
            (c) => c.productId === it.productId && c.optionId === it.optionId,
          ) &&
          // 목 장바구니에 없는 상품은 옵션 검증을 건너뛴다(바로 구매 대상)
          cartDb.items.some((c) => c.productId === it.productId),
      )
    ) {
      return HttpResponse.json(
        fail("CART_OPTION_INVALID", "선택한 옵션을 찾을 수 없습니다."),
        { status: 400 },
      );
    }

    const orderId = nextOrderSeq++;
    // orderNo는 저장하지 않고 파생: "ORD-" + created_at(yyyyMMdd) + "-" + id
    const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const paid = body.paymentMethod !== "MOCK_FAIL";
    const orderNo = `ORD-${yyyymmdd}-${orderId}`;

    // 결제 성공 시에만 장바구니 경유분 차감 (바로 구매는 장바구니 미접촉)
    if (paid && hasCart) {
      cartDb.items = cartDb.items.filter(
        (it) => !body.cartItemIds!.includes(it.cartItemId),
      );
    }

    // 재결제(O-2)가 상태 전이를 판단할 수 있도록 기록.
    // 실패 주문은 장바구니를 차감하지 않았으므로 출처를 남겨 재결제 성공 시 차감한다.
    mockOrders.set(orderId, {
      orderNo,
      status: paid ? "PAID" : "PAYMENT_FAILED",
      cartItemIds: hasCart ? body.cartItemIds! : [],
    });

    return HttpResponse.json(
      ok({ orderId, orderNo, status: paid ? "PAID" : "PAYMENT_FAILED" }),
    );
  }),

  // ── 재결제 (O-2) ── PENDING/PAYMENT_FAILED 주문만. 성공 부수효과는 O-1의 PAID와 동일.
  http.post(
    `${BASE}/api/orders/:orderId/retry-payment`,
    async ({ params, request }) => {
      const orderId = Number(params.orderId);
      const { paymentMethod } = (await request.json()) as {
        paymentMethod: string;
      };

      // 없는 주문·타인 주문 모두 404로 통일 — 존재 은닉(IDOR 관례, 2026-07-18 확정)
      const order = mockOrders.get(orderId);
      if (!order) {
        return HttpResponse.json(
          fail("ORDER_NOT_FOUND", "주문을 찾을 수 없습니다."),
          { status: 404 },
        );
      }
      if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
        return HttpResponse.json(
          fail("ORDER_INVALID_TRANSITION", "재결제할 수 없는 주문입니다."),
          { status: 400 },
        );
      }

      const paid = paymentMethod !== "MOCK_FAIL";
      order.status = paid ? "PAID" : "PAYMENT_FAILED";

      // 성공 시에만 장바구니에 남은 같은 행을 삭제(O-1 PAID와 동일한 부수효과)
      if (paid && order.cartItemIds.length > 0) {
        cartDb.items = cartDb.items.filter(
          (it) => !order.cartItemIds.includes(it.cartItemId),
        );
      }

      return HttpResponse.json(
        ok({ orderId, orderNo: order.orderNo, status: order.status }),
      );
    },
  ),
];
