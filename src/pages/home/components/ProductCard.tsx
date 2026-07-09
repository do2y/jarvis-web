import { Star } from "lucide-react";
import type { PopularProduct } from "../types";
import { formatPrice } from "../utils/formatPrice";

export function ProductCard({ product }: { product: PopularProduct }) {
  const hasDiscount = product.discountRate > 0;

  return (
    // TODO: 클릭 시 상품 상세로 이동 + 카드 데이터를 setQueryData(['products', id])로 시딩
    <button
      type="button"
      className="group flex flex-col overflow-hidden rounded-xl border bg-background text-left shadow-sm transition-colors hover:bg-muted/40"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.badge && (
          <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {product.badge}
          </span>
        )}

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          {product.name}
        </h3>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
          <span className="font-medium text-foreground">{product.rating}</span>
          <span>({product.reviewCount.toLocaleString("ko-KR")})</span>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-base font-bold">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.listPrice)}
              </span>
              <span className="text-sm font-bold text-red-500">
                {product.discountRate}%
              </span>
            </>
          )}
        </div>

        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {product.reason}
        </p>
      </div>
    </button>
  );
}
