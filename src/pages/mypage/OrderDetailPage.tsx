import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/lib/utils";
import { useOrder } from "./useOrders";
import { formatPrice } from "@/shared/utils/formatPrice";
import { OrderStatusBadge } from "./components/OrderStatusBadge";
import { PageTitle, ErrorState } from "./components/PageState";
import type { OrderDetailItem } from "./types";

function InfoRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(strong ? "text-base font-bold" : "font-medium")}>
        {value}
      </span>
    </div>
  );
}

function DetailItem({
  item,
  reviewable,
  onReview,
}: {
  item: OrderDetailItem;
  reviewable: boolean;
  onReview: (item: OrderDetailItem) => void;
}) {
  return (
    <div className="flex gap-4 py-4">
      <Link to={`/products/${item.productId}`} className="shrink-0">
        <img
          src={item.imageUrl}
          alt=""
          className="size-20 rounded-sm bg-muted object-cover ring-1 ring-black/5 transition-transform hover:scale-[1.03]"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          to={`/products/${item.productId}`}
          className="truncate text-sm font-medium hover:underline"
        >
          {item.productName}
        </Link>
        <p className="text-xs text-muted-foreground">
          {item.optionName ? `${item.optionName} / ` : ""}
          {item.quantity}개
        </p>
        <p className="mt-0.5 text-sm font-bold">{formatPrice(item.price)}</p>
      </div>
      {reviewable && (
        <button
          type="button"
          onClick={() => onReview(item)}
          className="h-9 shrink-0 self-center rounded-full border px-4 text-sm font-medium transition-all hover:bg-muted active:scale-[0.97]"
        >
          후기 작성
        </button>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border bg-background px-5 py-4">
      <h3 className="text-sm font-bold">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-24 rounded-sm" />
      <Skeleton className="h-32 rounded-sm" />
      <Skeleton className="h-40 rounded-sm" />
    </div>
  );
}

export default function OrderDetailPage() {
  const { orderId = "" } = useParams();
  const numericOrderId = Number(orderId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: order, isPending, isError, refetch } = useOrder(numericOrderId);

  // 서버가 금액 분해(상품금액/할인)를 주지 않아 아이템 스냅샷으로 계산한다.
  // 총액은 서버 값(order.totalAmount)을 그대로 쓴다 — 클라이언트 계산을 신뢰하지 않음.
  const itemsTotal =
    order?.items.reduce((sum, it) => sum + it.originalPrice * it.quantity, 0) ??
    0;
  const paidTotal =
    order?.items.reduce((sum, it) => sum + it.price * it.quantity, 0) ?? 0;
  const discount = itemsTotal - paidTotal;

  // 후기 작성 — 대상 상품 정보를 상세 캐시에 시딩해 작성 화면에서 즉시 표시.
  const goToReview = (item: OrderDetailItem) => {
    queryClient.setQueryData(["products", item.productId], {
      productId: item.productId,
      name: item.productName,
      price: item.price,
      imageUrl: item.imageUrl,
    });
    navigate(
      `/mypage/reviews/new?orderId=${orderId}&productId=${item.productId}`,
    );
  };

  return (
    <div>
      {/* 헤더: 뒤로 가기 + 제목 */}
      <div className="flex items-center gap-2">
        <Link
          to="/mypage/orders"
          aria-label="주문 내역으로"
          className="-ml-2 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <PageTitle>주문 상세</PageTitle>
      </div>

      <div className="mt-5">
        {isPending ? (
          <DetailSkeleton />
        ) : isError ? (
          <ErrorState
            message="주문 정보를 불러오지 못했어요."
            onRetry={() => refetch()}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {/* 주문 요약 */}
            <section className="rounded-sm border bg-background px-5 py-4">
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={order.representativeStatus} />
                <span className="text-sm text-muted-foreground">
                  {order.orderedAt.slice(0, 10).replace(/-/g, ".")} 주문
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                주문번호 {order.orderNo}
              </p>
            </section>

            {/* 배송지 */}
            <Section title="배송지">
              <div className="flex flex-col gap-1 text-sm">
                <p className="font-medium">
                  {order.address.recipient}
                  <span className="ml-2 text-muted-foreground">
                    {order.address.phone}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  ({order.address.zipCode}){" "}
                  {[order.address.address1, order.address.address2]
                    .filter(Boolean)
                    .join(" ")}
                </p>
                {order.deliveryRequest && (
                  <p className="mt-1 text-muted-foreground">
                    요청사항: {order.deliveryRequest}
                  </p>
                )}
              </div>
            </Section>

            {/* 주문 상품 */}
            <Section title={`주문 상품 ${order.items.length}개`}>
              <div className="divide-y">
                {order.items.map((item) => (
                  <DetailItem
                    key={item.orderItemId}
                    item={item}
                    reviewable={item.canReview}
                    onReview={goToReview}
                  />
                ))}
              </div>
            </Section>

            {/* 결제 정보 */}
            <Section title="결제 정보">
              <div className="flex flex-col gap-2">
                <InfoRow label="상품 금액" value={formatPrice(itemsTotal)} />
                {discount > 0 && (
                  <InfoRow label="할인" value={`-${formatPrice(discount)}`} />
                )}
                <div className="my-1 border-t" />
                <InfoRow
                  label="총 결제 금액"
                  value={formatPrice(order.totalAmount)}
                  strong
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  결제 수단: {order.paymentMethod}
                </p>
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
