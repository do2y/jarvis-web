import { formatPrice } from "@/shared/utils/formatPrice";
import type { CheckoutItem } from "../types";

// 주문 상품 목록 — 이미지·브랜드·이름·선택옵션·수량·가격.
export function OrderItems({ items }: { items: CheckoutItem[] }) {
  return (
    <section className="rounded-sm border bg-background p-5 sm:p-6">
      <h2 className="text-lg font-bold">주문 상품</h2>
      <ul className="mt-4 flex flex-col gap-5">
        {items.map((item, i) => {
          const { product, options, optionName, quantity } = item;
          const hasDiscount = product.originalPrice > product.price;
          // 상세 경유는 options 맵, 장바구니 경유는 "화이트/M" 문자열
          const optionText = options
            ? Object.values(options).filter(Boolean)
            : (optionName ?? "")
                .split("/")
                .map((v) => v.trim())
                .filter(Boolean);
          return (
            <li key={`${product.productId}-${i}`} className="flex gap-4">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="size-20 shrink-0 rounded-sm border object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                {product.brandName && (
                  <p className="text-sm text-muted-foreground">
                    {product.brandName}
                  </p>
                )}
                <p className="text-sm font-semibold leading-snug">
                  {product.name}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {optionText.map((v) => (
                    <span
                      key={v}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {v}
                    </span>
                  ))}
                  <span className="text-xs text-muted-foreground">
                    · {quantity}개
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold">
                    {formatPrice(product.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
