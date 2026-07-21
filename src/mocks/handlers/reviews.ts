import { http, HttpResponse } from "msw";
import type { OrderStatus } from "@/pages/mypage/types";
import { BASE, fail, ok } from "../shared";
import { MOCK_ORDER_PAGE_ITEMS } from "../data";

// 후기 등록 목 상태 — 작성한 주문 줄을 기억해 중복 등록(409)을 재현한다.
// 실제 백엔드는 review 테이블의 order_item_id UNIQUE로 막는다.
const mockReviewedItemIds = new Set<number>();
let nextReviewSeq = 701;

export const reviewHandlers = [
  // 후기 등록 (R-1) — 대상은 orderItemId. 자격(배송완료·미작성)은 서버(=목)가 판정한다.
  // 등록만 지원하며 수정·삭제 API는 없다(02 D29).
  http.post(`${BASE}/api/reviews`, async ({ request }) => {
    const body = (await request.json()) as {
      orderItemId: number;
      rating: number;
      content: string;
    };

    // 없는 아이템·타인 아이템 모두 404로 통일 — 존재 은닉(IDOR 관례)
    const item = MOCK_ORDER_PAGE_ITEMS.flatMap((o) => o.items).find(
      (i) => i.orderItemId === body.orderItemId,
    );
    if (!item) {
      return HttpResponse.json(
        fail("ORDER_ITEM_NOT_FOUND", "주문 상품을 찾을 수 없습니다."),
        { status: 404 },
      );
    }

    if (mockReviewedItemIds.has(body.orderItemId)) {
      return HttpResponse.json(
        fail("REVIEW_ALREADY_EXISTS", "이미 후기를 작성한 상품입니다."),
        { status: 409 },
      );
    }

    // 자격: DELIVERED / CONFIRMED 만 허용 (01 §3)
    const s: OrderStatus = item.status;
    if (s !== "DELIVERED" && s !== "CONFIRMED") {
      return HttpResponse.json(
        fail(
          "REVIEW_NOT_ALLOWED",
          "배송 완료된 상품만 후기를 작성할 수 있습니다.",
        ),
        { status: 400 },
      );
    }

    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      return HttpResponse.json(
        {
          success: false as const,
          error: {
            code: "VALIDATION_ERROR",
            message: "입력값이 올바르지 않습니다.",
            fields: [{ field: "rating", message: "별점은 1~5 사이여야 합니다." }],
          },
        },
        { status: 400 },
      );
    }
    if (body.content.length > 2000) {
      return HttpResponse.json(
        {
          success: false as const,
          error: {
            code: "VALIDATION_ERROR",
            message: "입력값이 올바르지 않습니다.",
            fields: [
              { field: "content", message: "후기는 2000자 이하여야 합니다." },
            ],
          },
        },
        { status: 400 },
      );
    }

    mockReviewedItemIds.add(body.orderItemId);
    return HttpResponse.json(
      ok({
        reviewId: nextReviewSeq++,
        orderItemId: body.orderItemId,
        productId: item.productId,
        rating: body.rating,
        content: body.content,
        createdAt: `${new Date().toISOString().slice(0, 10)}T12:00:00+09:00`,
      }),
    );
  }),
];
