import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "../utils/formatPrice";
import type { ClaimType, Order, OrderItem } from "../types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { ClaimRequestModal } from "./ClaimRequestModal";

// 후기 작성 가능 상태(배송완료/구매확정)인지. 후기만 실제 페이지로 연결.
function canWriteReview(status: Order["status"]): boolean {
  return status === "DELIVERED" || status === "CONFIRMED";
}

// 반품·교환 신청 가능 상태 — 배송완료 후(구매확정 포함).
function canClaim(status: Order["status"]): boolean {
  return status === "DELIVERED" || status === "CONFIRMED";
}

type ClaimAction = Extract<ClaimType, "RETURN" | "EXCHANGE">;

// 액션 버튼 공통 스타일 (칩 형태).
const actionButtonClass = cn(
  "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium",
  "transition-all hover:bg-muted active:scale-[0.97]",
);

function ItemRow({ item }: { item: OrderItem }) {
  return (
    <div className="flex gap-4 py-4">
      <img
        src={item.imageUrl}
        alt=""
        className="size-16 shrink-0 rounded-sm bg-muted object-cover ring-1 ring-black/5 sm:size-20"
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
  const claimable = canClaim(order.status);
  // 배송중에만 노출되는 준비 중 액션(배송 조회) 클릭 시 하단에 한 줄 안내.
  const showTracking = order.status === "SHIPPING";
  const [notice, setNotice] = useState(false);
  // 반품·교환 신청 모달 — 열려는 종류(RETURN|EXCHANGE)를 담고, null이면 닫힘.
  const [claimType, setClaimType] = useState<ClaimAction | null>(null);

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
    <article className="overflow-hidden rounded-sm border bg-background">
      {/* 헤더: 상태 + 주문일 + 주문번호 / 우측 주문 상세 */}
      <div className="flex items-center justify-between gap-3 border-b bg-muted/20 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <span className="truncate text-sm text-muted-foreground">
            {order.orderedAt.replace(/-/g, ".")} · {order.orderId}
          </span>
        </div>
        <Link
          to={`/mypage/orders/${order.orderId}`}
          className="flex shrink-0 items-center gap-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          주문 상세
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {/* 상품 목록 */}
      <div className="divide-y px-5">
        {order.items.map((item) => (
          <ItemRow key={item.productId} item={item} />
        ))}
      </div>

      {/* 하단 액션 — 후기 작성·반품·교환은 실제 연결, 배송 조회는 준비 중 안내 */}
      {(reviewable || claimable || showTracking || notice) && (
        <div className="flex flex-wrap items-center gap-2 border-t px-5 py-4">
          {reviewable && (
            <button type="button" onClick={goToReview} className={actionButtonClass}>
              후기 작성
            </button>
          )}
          {claimable && (
            <>
              <button
                type="button"
                onClick={() => setClaimType("RETURN")}
                className={actionButtonClass}
              >
                반품 신청
              </button>
              <button
                type="button"
                onClick={() => setClaimType("EXCHANGE")}
                className={actionButtonClass}
              >
                교환 신청
              </button>
            </>
          )}
          {showTracking && (
            <button
              type="button"
              onClick={() => setNotice(true)}
              className={actionButtonClass}
            >
              배송 조회
            </button>
          )}
          {notice && (
            <span className="text-xs text-muted-foreground">
              준비 중인 기능이에요.
            </span>
          )}
        </div>
      )}

      {/* 반품·교환 신청 모달 */}
      {claimType && (
        <ClaimRequestModal
          open={claimType !== null}
          onOpenChange={(open) => !open && setClaimType(null)}
          order={order}
          type={claimType}
        />
      )}
    </article>
  );
}
