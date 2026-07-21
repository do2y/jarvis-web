import { Star } from "lucide-react";
import { useGoToProduct } from "@/shared/hooks/useGoToProduct";
import type { PopularProduct } from "../types";
import { formatPrice } from "@/shared/utils/formatPrice";

export function ProductCard({ product }: { product: PopularProduct }) {
  const goToProduct = useGoToProduct();
  const hasDiscount = product.originalPrice > product.price;
  const discountRate = hasDiscount
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <button
      type="button"
      onClick={() => goToProduct(product)}
      aria-label={`${product.name} 상세 보기`}
      className="group flex flex-col overflow-hidden rounded-sm border bg-background text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 will-change-transform group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-medium text-muted-foreground">
          {product.brandName}
        </span>

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
                {formatPrice(product.originalPrice)}
              </span>
              <span className="text-sm font-bold text-red-500">
                {discountRate}%
              </span>
            </>
          )}
        </div>

      </div>
    </button>
  );
}
