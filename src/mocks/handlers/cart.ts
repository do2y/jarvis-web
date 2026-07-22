import { http, HttpResponse } from "msw";
import { BASE, fail, ok } from "../shared";
import { cartDb, MOCK_PRODUCT_OPTIONS, POPULAR_PRODUCTS } from "../data";

// 장바구니 담기로 새로 생기는 아이템의 id 증가값(기존 픽스처가 55~57을 씀).
let nextCartItemSeq = 58;

// 함께 구매 추천 목 — cart/types.ts CartRecommendation 계약.
const MOCK_CART_RECOMMENDATIONS = [
  {
    productId: 401,
    name: "코튼 오버핏 반팔 티셔츠",
    brand: "라인어디션",
    imageUrl:
      "https://img.29cm.co.kr/item/202607/11f17a9c4f2b986d9993179502b182f7.jpg?width=1440&format=webp",
    price: 49000,
  },
  {
    productId: 402,
    name: "워시드 크루넥 스웨트셔츠",
    brand: "더센트",
    imageUrl:
      "https://img.29cm.co.kr/item/202605/11f14e99a7e5bcd883a42f85ec813387.jpg?width=408&format=webp",
    price: 89000,
  },
  {
    productId: 403,
    name: "베이직 피그먼트 티셔츠",
    brand: "에르모사",
    imageUrl:
      "https://image.msscdn.net/thumbnails/images/goods_img/20251022/5625561/5625561_17610941581236_big.jpg?w=1200",
    price: 28000,
  },
  {
    productId: 404,
    name: "릴렉스핏 하프 슬리브 니트",
    brand: "울프포드",
    imageUrl:
      "https://img.29cm.co.kr/item/202606/11f16f98cff926419090358d89120339.png?width=1440&format=webp",
    price: 64000,
  },
];

export const cartHandlers = [
  // 조회 (C-1) — 합계는 서버 계산. purchasable:false 아이템은 합계에서 제외한다.
  http.get(`${BASE}/api/cart`, () => {
    const payable = cartDb.items.filter((it) => it.purchasable);
    const totalOriginal = payable.reduce(
      (sum, it) => sum + it.originalPrice * it.quantity,
      0,
    );
    const totalSale = payable.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0,
    );
    return HttpResponse.json(
      ok({
        items: cartDb.items,
        totalOriginal,
        totalSale,
        discount: totalOriginal - totalSale,
      }),
    );
  }),

  http.get(`${BASE}/api/cart/recommendations`, () =>
    HttpResponse.json(ok({ products: MOCK_CART_RECOMMENDATIONS })),
  ),

  // 장바구니 담기 (C-2) — 동일 상품+옵션이면 수량 합산, 합산 결과도 1~99.
  // 응답은 { cartItemId, quantity } (quantity는 합산 결과).
  http.post(`${BASE}/api/cart/items`, async ({ request }) => {
    const body = (await request.json()) as {
      productId: number;
      optionId?: number | null;
      quantity: number;
    };

    const product = POPULAR_PRODUCTS.find(
      (p) => p.productId === body.productId,
    );
    if (!product) {
      return HttpResponse.json(
        fail("PRODUCT_NOT_FOUND", "상품을 찾을 수 없습니다."),
        { status: 404 },
      );
    }

    // 목 상품은 모두 옵션이 있으므로 optionId 누락은 항상 400.
    // 실패 응답에 옵션 목록을 실어 FE가 옵션 선택 UI를 띄울 수 있게 한다(명세 detail).
    if (body.optionId == null) {
      return HttpResponse.json(
        {
          success: false as const,
          error: {
            code: "CART_OPTION_REQUIRED",
            message: "옵션을 선택해 주세요.",
            detail: { options: MOCK_PRODUCT_OPTIONS },
          },
        },
        { status: 400 },
      );
    }
    if (!MOCK_PRODUCT_OPTIONS.some((o) => o.optionId === body.optionId)) {
      return HttpResponse.json(
        fail("CART_OPTION_INVALID", "선택한 옵션을 찾을 수 없습니다."),
        { status: 400 },
      );
    }

    if (!Number.isInteger(body.quantity) || body.quantity < 1) {
      return HttpResponse.json(
        {
          success: false as const,
          error: {
            code: "VALIDATION_ERROR",
            message: "입력값이 올바르지 않습니다.",
            fields: [{ field: "quantity", message: "수량은 1 이상이어야 합니다." }],
          },
        },
        { status: 400 },
      );
    }

    const existing = cartDb.items.find(
      (it) => it.productId === body.productId && it.optionId === body.optionId,
    );
    const merged = (existing?.quantity ?? 0) + body.quantity;

    // 재고 초과 — 합산 후 수량(장바구니에 이미 담긴 양 + 이번 요청)과 비교(02 D33).
    // 재고는 상품 단위. FE에 남은 재고를 detail로 실어 문구/제한에 쓸 수 있게 한다.
    if (merged > product.stock) {
      return HttpResponse.json(
        {
          success: false as const,
          error: {
            code: "CART_STOCK_INSUFFICIENT",
            message: "재고가 부족합니다.",
            detail: { availableStock: product.stock },
          },
        },
        { status: 400 },
      );
    }

    if (merged > 99) {
      return HttpResponse.json(
        {
          success: false as const,
          error: {
            code: "VALIDATION_ERROR",
            message: "입력값이 올바르지 않습니다.",
            fields: [
              { field: "quantity", message: "수량은 99 이하여야 합니다." },
            ],
          },
        },
        { status: 400 },
      );
    }

    if (existing) {
      existing.quantity = merged;
      return HttpResponse.json(
        ok({ cartItemId: existing.cartItemId, quantity: merged }),
      );
    }

    const option = MOCK_PRODUCT_OPTIONS.find(
      (o) => o.optionId === body.optionId,
    );
    const created = {
      cartItemId: nextCartItemSeq++,
      productId: product.productId,
      name: product.name,
      brandId: 1,
      brandName: product.brandName,
      imageUrl: product.imageUrl,
      optionId: body.optionId,
      optionName: option?.name ?? null,
      quantity: body.quantity,
      price: product.price,
      originalPrice: product.originalPrice,
      purchasable: product.purchasable,
    };
    cartDb.items = [...cartDb.items, created];
    return HttpResponse.json(
      ok({ cartItemId: created.cartItemId, quantity: created.quantity }),
    );
  }),

  // 수량 변경 (C-3) — 200 + { cartItemId, quantity }. quantity 1~99.
  http.patch(
    `${BASE}/api/cart/items/:cartItemId`,
    async ({ params, request }) => {
      const id = Number(params.cartItemId);
      const { quantity } = (await request.json()) as { quantity: number };

      const target = cartDb.items.find((it) => it.cartItemId === id);
      if (!target) {
        return HttpResponse.json(
          fail("CART_ITEM_NOT_FOUND", "장바구니 항목을 찾을 수 없습니다."),
          { status: 404 },
        );
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return HttpResponse.json(
          {
            success: false as const,
            error: {
              code: "VALIDATION_ERROR",
              message: "입력값이 올바르지 않습니다.",
              fields: [
                { field: "quantity", message: "수량은 1~99 사이여야 합니다." },
              ],
            },
          },
          { status: 400 },
        );
      }

      // 재고 초과 — 담기(C-2)의 합산과 달리 변경 후 수량(치환값)과 비교(02 D33).
      // 재고는 상품 단위. 픽스처 상품(POPULAR_PRODUCTS에 없는 productId)은
      // 재고 정보가 없어 무제한으로 취급(검사 건너뜀).
      const product = POPULAR_PRODUCTS.find(
        (p) => p.productId === target.productId,
      );
      if (product && quantity > product.stock) {
        return HttpResponse.json(
          {
            success: false as const,
            error: {
              code: "CART_STOCK_INSUFFICIENT",
              message: "재고가 부족합니다.",
              detail: { availableStock: product.stock },
            },
          },
          { status: 400 },
        );
      }

      cartDb.items = cartDb.items.map((it) =>
        it.cartItemId === id ? { ...it, quantity } : it,
      );
      return HttpResponse.json(ok({ cartItemId: id, quantity }));
    },
  ),

  // 삭제 (C-4) — 200 + data: null. 없는 항목은 404.
  // 복수 삭제는 FE가 이 API를 반복 호출한다(bulk API 없음).
  http.delete(`${BASE}/api/cart/items/:cartItemId`, ({ params }) => {
    const id = Number(params.cartItemId);
    if (!cartDb.items.some((it) => it.cartItemId === id)) {
      return HttpResponse.json(
        fail("CART_ITEM_NOT_FOUND", "장바구니 항목을 찾을 수 없습니다."),
        { status: 404 },
      );
    }
    cartDb.items = cartDb.items.filter((it) => it.cartItemId !== id);
    return HttpResponse.json(ok(null));
  }),
];
