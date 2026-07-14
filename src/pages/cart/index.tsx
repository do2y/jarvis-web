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
        <div key={i} className="flex gap-4 rounded-xl border bg-background p-4 sm:p-5">
          <Skeleton className="size-20 rounded-xl sm:size-24" />
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
  const { data: items, isPending, isError, refetch } = useCart();
  const { setQuantity, remove } = useCartMutations();
  const navigate = useNavigate();

  // 선택 상태는 클라이언트 UI 상태(어떤 라인을 주문할지). 목록 로드 후 기본 전체 선택.
  // 해제한 항목만 기억해 새 항목은 자동 선택되게 한다(제외 집합 방식).
  const [deselected, setDeselected] = useState<Set<string>>(new Set());

  const isSelected = (id: string) => !deselected.has(id);
  const toggle = (id: string) =>
    setDeselected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedItems = useMemo(
    () => (items ?? []).filter((it) => !deselected.has(it.cartItemId)),
    [items, deselected],
  );
  const allSelected = (items?.length ?? 0) > 0 && selectedItems.length === items!.length;

  const toggleAll = () => {
    if (!items) return;
    setDeselected(allSelected ? new Set(items.map((it) => it.cartItemId)) : new Set());
  };

  const removeSelected = () => {
    selectedItems.forEach((it) => remove.mutate(it.cartItemId));
  };

  const { itemsTotal, discount } = useMemo(() => {
    const total = selectedItems.reduce(
      (sum, it) => sum + it.originalPrice * it.quantity,
      0,
    );
    const paid = selectedItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0,
    );
    return { itemsTotal: total, discount: total - paid };
  }, [selectedItems]);

  // 선택 상품을 결제 화면 계약(CheckoutState)에 맞춰 넘긴다.
  const goToCheckout = () => {
    if (selectedItems.length === 0) return;
    const checkoutItems = selectedItems.map((it: CartItem) => ({
      product: {
        productId: it.productId,
        name: it.name,
        brandName: it.brand,
        price: it.price,
        originalPrice: it.originalPrice,
        imageUrl: it.imageUrl,
      },
      options: it.options,
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
          <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed bg-background py-16 text-center">
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
        ) : items.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed bg-background py-16 text-center">
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
              <div className="flex items-center justify-between rounded-xl border bg-background px-5 py-4">
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
                  전체 선택 ({selectedItems.length}/{items.length})
                </button>
                <button
                  type="button"
                  onClick={removeSelected}
                  disabled={selectedItems.length === 0}
                  className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  선택 삭제
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-4">
                {items.map((item) => (
                  <CartItemCard
                    key={item.cartItemId}
                    item={item}
                    selected={isSelected(item.cartItemId)}
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
