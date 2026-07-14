import { formatPrice } from "../utils/formatPrice";

const FREE_SHIPPING_THRESHOLD = 50000;

export function CartSummary({
  itemsTotal,
  discount,
  selectedCount,
  onOrder,
}: {
  itemsTotal: number; // 선택 상품 정가 합
  discount: number; // 선택 상품 할인 합
  selectedCount: number;
  onOrder: () => void;
}) {
  const paid = itemsTotal - discount;
  const freeShipping = paid >= FREE_SHIPPING_THRESHOLD || paid === 0;
  const canOrder = selectedCount > 0;

  return (
    <div className="rounded-xl border bg-background p-5 sm:p-6">
      <h2 className="text-lg font-bold">주문 요약</h2>

      <dl className="mt-5 flex flex-col gap-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">상품 금액</dt>
          <dd className="font-medium">{formatPrice(itemsTotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">할인 금액</dt>
          <dd className="font-medium text-red-500">
            {discount > 0 ? `-${formatPrice(discount)}` : formatPrice(0)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">배송비</dt>
          <dd className="font-medium">
            {freeShipping ? "무료" : formatPrice(3000)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 rounded-xl bg-muted px-3 py-2.5 text-xs text-muted-foreground">
        5만원 이상 구매 시 무료 배송
      </p>

      <div className="mt-5 flex items-center justify-between border-t pt-5">
        <span className="text-lg font-bold">총 결제 금액</span>
        <span className="text-xl font-bold">
          {formatPrice(freeShipping ? paid : paid + 3000)}
        </span>
      </div>

      <button
        type="button"
        disabled={!canOrder}
        onClick={onOrder}
        className="mt-5 h-12 w-full rounded-full bg-primary text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {canOrder ? `선택 상품 ${selectedCount}개 주문하기` : "상품을 선택해주세요"}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        주문 전 배송지와 결제 수단을 확인하세요
      </p>
    </div>
  );
}
