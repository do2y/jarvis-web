import { Link, useLocation } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/shared/ui/AppHeader";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/shared/utils/formatPrice";
import type { OrderCompleteState } from "./types";
import { OrderItems } from "./components/OrderItems";

export default function OrderCompletePage() {
  const location = useLocation();
  // 결제 화면에서 replace로 넘어온 주문 결과. 직접 진입/새로고침 시 없음.
  const state = location.state as OrderCompleteState | null;
  const order = state?.order;

  // 주문 정보 없이 진입 — 정상 흐름이 아니므로 안내.
  if (!order) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-lg font-semibold">주문 정보를 찾을 수 없어요</p>
          <p className="text-sm text-muted-foreground">
            주문 내역은 마이페이지에서 확인하실 수 있어요.
          </p>
          <Link
            to="/"
            className={cn(buttonVariants(), "mt-2 h-11 rounded-full px-6")}
          >
            홈으로
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl p-4 pb-20 sm:p-6">
        {/* 완료 헤드라인 */}
        <section className="flex flex-col items-center gap-3 py-10 text-center sm:py-14">
          <CheckCircle2 className="size-14 text-primary" />
          <h1 className="text-2xl font-bold sm:text-3xl">주문이 완료되었어요</h1>
          <p className="text-sm text-muted-foreground">
            주문번호{" "}
            <span className="font-semibold text-foreground">
              {order.orderNo}
            </span>
          </p>
        </section>

        <div className="flex flex-col gap-6">
          <OrderItems items={order.items} />

          {/* 배송지 */}
          <section className="rounded-sm border bg-background p-5 sm:p-6">
            <h2 className="text-lg font-bold">배송지</h2>
            <div className="mt-4 flex flex-col gap-1 text-sm">
              <p className="font-semibold">
                {order.address.recipient} ({order.address.label})
              </p>
              <p className="text-muted-foreground">{order.address.phone}</p>
              <p className="text-muted-foreground">
                ({order.address.zipCode}) {order.address.address1}
                {order.address.address2 ? ` ${order.address.address2}` : ""}
              </p>
            </div>
          </section>

          {/* 결제 정보 */}
          <section className="rounded-sm border bg-background p-5 sm:p-6">
            <h2 className="text-lg font-bold">결제 정보</h2>
            <dl className="mt-4 flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">결제 수단</dt>
                <dd className="font-medium">{order.method}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">상품 금액</dt>
                <dd className="font-medium">{formatPrice(order.itemsTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">할인 금액</dt>
                <dd className="font-medium text-red-500">
                  -{formatPrice(order.discount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">배송비</dt>
                <dd className="font-medium">무료</dd>
              </div>
            </dl>
            <div className="mt-5 flex items-baseline justify-between border-t pt-5">
              <span className="text-base font-bold">최종 결제 금액</span>
              <span className="text-xl font-bold">
                {formatPrice(order.finalTotal)}
              </span>
            </div>
          </section>

          {/* 진입점 */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/mypage/orders"
              className={cn(
                buttonVariants(),
                "h-12 flex-1 rounded-sm text-base",
              )}
            >
              주문 내역 보기
            </Link>
            <Link
              to="/"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 flex-1 rounded-sm text-base",
              )}
            >
              쇼핑 계속하기
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
