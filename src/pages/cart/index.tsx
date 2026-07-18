import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { AppHeader } from "@/shared/ui/AppHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart, useCartMutations } from "./useCart";
import { CartItemCard } from "./components/CartItemCard";
import { CartSummary } from "./components/CartSummary";
import { CartRecommendations } from "./components/CartRecommendations";
import type { CartItem } from "./types";

function CartSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-4 rounded-sm border bg-background p-4 sm:p-5">
          <Skeleton className="size-20 rounded-sm sm:size-24" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-2 h-10 w-32 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CartPage() {
  const { data: cart, isPending, isError, refetch } = useCart();
  const {
    setQuantity,
    remove,
    errorMessage: mutationError,
  } = useCartMutations();
  const navigate = useNavigate();

  const items = cart?.items;

  // 선택 상태는 클라이언트 UI 상태(어떤 라인을 주문할지). 목록 로드 후 기본 전체 선택.
  // 해제한 항목만 기억해 새 항목은 자동 선택되게 한다(제외 집합 방식).
  const [deselected, setDeselected] = useState<Set<number>>(new Set());

  // 구매 불가(HIDDEN) 상품은 서버 합계에서도 빠지므로 선택 대상에서 제외한다.
  const isSelected = (item: CartItem) =>
    item.purchasable && !deselected.has(item.cartItemId);
  const toggle = (id: number) =>
    setDeselected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectableItems = useMemo(
    () => (items ?? []).filter((it) => it.purchasable),
    [items],
  );
  const selectedItems = useMemo(
    () => selectableItems.filter((it) => !deselected.has(it.cartItemId)),
    [selectableItems, deselected],
  );
  const allSelected =
    selectableItems.length > 0 && selectedItems.length === selectableItems.length;

  const toggleAll = () => {
    setDeselected(
      allSelected ? new Set(selectableItems.map((it) => it.cartItemId)) : new Set(),
    );
  };

  // bulk 삭제 API가 없어 하나씩 호출한다(스펙: FE 반복 호출).
  // 동시에 쏘면 각 낙관적 반영이 같은 스냅샷을 기준으로 잡혀 서로를 덮어쓰므로 순차 실행.
  const removeSelected = async () => {
    for (const it of selectedItems) {
      try {
        await remove.mutateAsync(it.cartItemId);
      } catch {
        // 한 건이 실패해도(이미 삭제됨 등) 나머지는 계속 시도. 사유는 errorMessage로 노출됨.
      }
    }
  };

  // 전체 선택이면 서버 계산 합계를 그대로 쓴다(합계의 진실은 서버).
  // 부분 선택일 때만 FE가 선택분을 합산 — 최종 금액은 주문 시 서버가 재계산.
  const { itemsTotal, discount } = useMemo(() => {
    if (allSelected && cart) {
      return { itemsTotal: cart.totalOriginal, discount: cart.discount };
    }
    const total = selectedItems.reduce(
      (sum, it) => sum + it.originalPrice * it.quantity,
      0,
    );
    const paid = selectedItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0,
    );
    return { itemsTotal: total, discount: total - paid };
  }, [allSelected, cart, selectedItems]);

  // 선택 상품을 결제 화면 계약(CheckoutState)에 맞춰 넘긴다.
  const goToCheckout = () => {
    if (selectedItems.length === 0) return;
    const checkoutItems = selectedItems.map((it: CartItem) => ({
      product: {
        productId: it.productId,
        name: it.name,
        price: it.price,
        originalPrice: it.originalPrice,
        imageUrl: it.imageUrl,
      },
      optionId: it.optionId,
      optionName: it.optionName,
      quantity: it.quantity,
    }));
    navigate("/checkout", { state: { items: checkoutItems } });
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 pb-20 sm:p-6">
        <h1 className="text-2xl font-bold sm:text-3xl">장바구니</h1>

        {isPending ? (
          <div className="mt-6">
            <CartSkeleton />
          </div>
        ) : isError ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-sm border border-dashed bg-background py-16 text-center">
            <p className="text-sm text-muted-foreground">
              장바구니를 불러오지 못했어요.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-10 rounded-full px-5",
              )}
            >
              다시 시도
            </button>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-sm border border-dashed bg-background py-16 text-center">
            <p className="text-sm font-medium">장바구니가 비어 있어요</p>
            <p className="text-sm text-muted-foreground">
              마음에 드는 상품을 담아보세요.
            </p>
            <Link
              to="/"
              className={cn(buttonVariants(), "mt-1 h-11 rounded-full px-6")}
            >
              쇼핑하러 가기
            </Link>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-6 lg:flex-row">
            {/* 좌: 목록 */}
            <div className="flex-1">
              {/* 전체 선택 / 선택 삭제 바 */}
              <div className="flex items-center justify-between rounded-sm border bg-background px-5 py-4">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex items-center gap-3 text-sm font-medium"
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border transition-colors",
                      allSelected ? "border-primary bg-primary" : "border-input",
                    )}
                  >
                    {allSelected && (
                      <Check className="size-4 text-primary-foreground" />
                    )}
                  </span>
                  전체 선택 ({selectedItems.length}/{selectableItems.length})
                </button>
                <button
                  type="button"
                  onClick={removeSelected}
                  // 순차 삭제 중 재클릭하면 같은 항목에 중복 요청이 나가므로 잠근다
                  disabled={selectedItems.length === 0 || remove.isPending}
                  className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  {remove.isPending ? "삭제 중…" : "선택 삭제"}
                </button>
              </div>

              {/* 수량 변경·삭제 실패 사유 — 낙관적 반영이 롤백되므로 이유를 알려준다 */}
              {mutationError && (
                <p className="mt-4 text-sm text-destructive" role="alert">
                  {mutationError}
                </p>
              )}

              <div className="mt-4 flex flex-col gap-4">
                {cart.items.map((item) => (
                  <CartItemCard
                    key={item.cartItemId}
                    item={item}
                    selected={isSelected(item)}
                    onToggle={() => toggle(item.cartItemId)}
                    onQuantityChange={(quantity) =>
                      setQuantity.mutate({ cartItemId: item.cartItemId, quantity })
                    }
                    onRemove={() => remove.mutate(item.cartItemId)}
                  />
                ))}
              </div>

              <CartRecommendations />
            </div>

            {/* 우: 주문 요약 (데스크탑 sticky) */}
            <div className="lg:w-80 lg:shrink-0">
              <div className="lg:sticky lg:top-24">
                <CartSummary
                  itemsTotal={itemsTotal}
                  discount={discount}
                  selectedCount={selectedItems.length}
                  onOrder={goToCheckout}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
