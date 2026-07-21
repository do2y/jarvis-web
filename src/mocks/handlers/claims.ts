import { http, HttpResponse } from "msw";
import type { Claim, OrderStatus } from "@/pages/mypage/types";
import { BASE, fail, ok } from "../shared";
import { MOCK_ORDER_PAGE_ITEMS } from "../data";

// 취소·반품 목 — mypage/types.ts Claim 계약. requestedAt 내림차순(최신순).
// MOCK_ORDER_PAGE_ITEMS의 주문 줄(orderItemId)과 연결. let: 신청(POST) 시 앞에 추가.
// 시퀀스는 픽스처 claimId(301,302)와 겹치지 않게 그 뒤에서 시작한다.
let nextClaimSeq = 303;
let MOCK_CLAIMS: Claim[] = [
  // orderItemId 2003은 CLAIM_IN_PROGRESS 주문의 아이템 — 중복 접수(409) 재현용
  {
    claimId: 301,
    orderNo: "ORD-20260620-1003",
    type: "RETURN",
    status: "PROCESSING",
    reason: "단순 변심",
    requestedAt: "2026-06-20T15:00:00+09:00",
    processedAt: null,
    orderItemId: 2003,
    productName: "릴렉스핏 하프 슬리브 니트 TSSK1402",
    optionName: "차콜/M",
    quantity: 1,
    refundAmount: 62000,
  },
  {
    claimId: 302,
    orderNo: "ORD-20260605-1004",
    type: "RETURN",
    status: "COMPLETED",
    reason: "상품이 파손·불량이에요",
    requestedAt: "2026-06-05T11:20:00+09:00",
    processedAt: "2026-06-07T09:00:00+09:00",
    orderItemId: 2004,
    productName: "브러시드 플리스 스웨트셔츠 TSCT3301",
    optionName: "그레이/M",
    quantity: 1,
    refundAmount: 198000,
  },
];

export const claimHandlers = [
  // 취소·반품 내역 (CL-2) — page(기본 0)/size(기본 10). 로그인 필요.
  http.get(`${BASE}/api/claims`, ({ request }) => {
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
        content: MOCK_CLAIMS.slice(start, start + size),
        page,
        size,
        totalElements: MOCK_CLAIMS.length,
        totalPages: Math.ceil(MOCK_CLAIMS.length / size),
      }),
    );
  }),

  // 취소·반품 신청 접수 (CL-1) — 대상은 orderItemId(path), body는 { type, reason? }.
  // 허용 여부는 서버(=목)가 아이템 상태 × 타입 매트릭스로 판정한다.
  http.post(
    `${BASE}/api/order-items/:orderItemId/claims`,
    async ({ params, request }) => {
      const orderItemId = Number(params.orderItemId);
      const body = (await request.json()) as {
        type: "CANCEL" | "RETURN";
        reason?: string;
      };

      // 없는 아이템·타인 아이템 모두 404로 통일 — 존재 은닉(IDOR 관례)
      const order = MOCK_ORDER_PAGE_ITEMS.find((o) =>
        o.items.some((i) => i.orderItemId === orderItemId),
      );
      const item = order?.items.find((i) => i.orderItemId === orderItemId);
      if (!order || !item) {
        return HttpResponse.json(
          fail("ORDER_ITEM_NOT_FOUND", "주문 상품을 찾을 수 없습니다."),
          { status: 404 },
        );
      }

      // 활성 클레임(접수·처리중)이 있으면 중복 접수 불가
      if (
        MOCK_CLAIMS.some(
          (c) =>
            c.orderItemId === orderItemId &&
            (c.status === "REQUESTED" || c.status === "PROCESSING"),
        )
      ) {
        return HttpResponse.json(
          fail("CLAIM_ALREADY_REQUESTED", "이미 접수된 신청이 있습니다."),
          { status: 409 },
        );
      }

      // 01 §3 매트릭스 근사 — 취소는 배송 전, 반품은 배송 완료 후에만 허용
      const s: OrderStatus = item.status;
      const allowed =
        body.type === "CANCEL"
          ? s === "PENDING" || s === "ORDERED"
          : s === "DELIVERED" || s === "CONFIRMED";
      if (!allowed) {
        return HttpResponse.json(
          fail(
            "CLAIM_NOT_ALLOWED",
            body.type === "CANCEL"
              ? "배송중인 상품은 취소할 수 없습니다."
              : "배송 완료 후에만 반품할 수 있습니다.",
          ),
          { status: 400 },
        );
      }

      const claimId = nextClaimSeq++;
      const requestedAt = `${new Date().toISOString().slice(0, 10)}T12:00:00+09:00`;
      // 접수 즉시 목록(CL-2)에도 반영 — 완료 화면에서 '내역 보기'로 바로 확인된다.
      MOCK_CLAIMS = [
        {
          claimId,
          orderNo: order.orderNo,
          type: body.type,
          status: "REQUESTED" as const,
          reason: body.reason ?? "",
          requestedAt,
          processedAt: null,
          orderItemId,
          productName: item.productName,
          optionName: item.optionName,
          quantity: item.quantity,
          refundAmount: item.price * item.quantity,
        },
        ...MOCK_CLAIMS,
      ];

      return HttpResponse.json(
        ok({
          claimId,
          orderItemId,
          type: body.type,
          status: "REQUESTED",
          requestedAt,
        }),
      );
    },
  ),
];
