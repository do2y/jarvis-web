import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatPrice } from "../utils/formatPrice";
import type { Order, OrderItem } from "../types";
import { OrderStatusBadge } from "./OrderStatusBadge";

// 후기 작성 가능 상태(배송완료/구매확정)인지. 후기만 실제 페이지로 연결, 나머지는 준비 중.
function canWriteReview(status: Order["status"]): boolean {
  return status === "DELIVERED" || status === "CONFIRMED";
}

// 배송중에만 노출되는 준비 중 액션(배송 조회). 배송준비중은 액션 없음.
function pendingActionsFor(status: Order["status"]): string[] {
  if (status === "SHIPPING") return ["배송 조회"];
  if (canWriteReview(status)) return ["환불 · 반품"];
  return [];
}

function ItemRow({ item }: { item: OrderItem }) {
  return (
    <div className="flex gap-4 py-4">
      <img
        src={item.imageUrl}
        alt=""
        className="size-16 shrink-0 rounded-xl bg-muted object-cover sm:size-20"
      />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-xs text-muted-foreground">{item.brand}</p>
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">
          {item.option} / {item.quantity}개
        </p>
        <p className="mt-0.5 text-sm font-bold">{formatPrice(item.price)}</p>
      </div>
    </div>
  );
}

export function OrderCard({ order }: { order: Order }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reviewable = canWriteReview(order.status);
  const pendingActions = pendingActionsFor(order.status);
  // 준비 중 안내 — 미구현 액션(배송 조회·환불/반품) 클릭 시 하단에 한 줄 안내.
  const [notice, setNotice] = useState(false);

  // 후기 작성 — 대상 상품(첫 항목) 정보를 상세 캐시에 시딩해 작성 화면에서 즉시 표시.
  const goToReview = () => {
    const target = order.items[0];
    queryClient.setQueryData(["products", target.productId], {
      productId: target.productId,
      name: target.name,
      brandName: target.brand,
      price: target.price,
      imageUrl: target.imageUrl,
    });
    navigate(
      `/mypage/reviews/new?orderId=${order.orderId}&productId=${target.productId}`,
    );
  };

  return (
    <article className="rounded-xl border bg-background">
      {/* 헤더: 상태 + 주문일 + 주문번호 / 우측 주문 상세 */}
      <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <span className="truncate text-sm text-muted-foreground">
            {order.orderedAt.replace(/-/g, ".")} · {order.orderId}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setNotice(true)}
          className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
        >
          주문 상세
        </button>
      </div>

      {/* 상품 목록 */}
      <div className="divide-y px-5">
        {order.items.map((item) => (
          <ItemRow key={item.productId} item={item} />
        ))}
      </div>

      {/* 하단 액션 — 후기 작성만 실제 연결, 나머지는 준비 중 안내 */}
      {(reviewable || pendingActions.length > 0 || notice) && (
        <div className="flex flex-wrap items-center gap-2 border-t px-5 py-4">
          {reviewable && (
            <button
              type="button"
              onClick={goToReview}
              className={cn(
                "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium",
                "transition-colors hover:bg-muted",
              )}
            >
              후기 작성
            </button>
          )}
          {pendingActions.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setNotice(true)}
              className={cn(
                "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium",
                "transition-colors hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
          {notice && (
            <span className="text-xs text-muted-foreground">
              준비 중인 기능이에요.
            </span>
          )}
        </div>
      )}
    </article>
  );
}
