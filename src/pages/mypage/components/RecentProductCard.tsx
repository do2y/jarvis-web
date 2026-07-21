import { formatPrice } from "@/shared/utils/formatPrice";
import { useGoToProduct } from "@/shared/hooks/useGoToProduct";
import type { RecentProduct } from "../types";

export function RecentProductCard({ product }: { product: RecentProduct }) {
  const goToProduct = useGoToProduct();

  // 카드가 상세 렌더에 필요한 값을 모두 갖고 있어 그대로 시딩한다(부족분만 백그라운드 페칭).
  const goToDetail = () => goToProduct(product);

  return (
    <button
      type="button"
      onClick={goToDetail}
      aria-label={`${product.name} 상세 보기`}
      className="group flex flex-col text-left"
    >
      <div className="aspect-square overflow-hidden rounded-sm bg-muted ring-1 ring-black/5">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{product.brandName}</p>
      <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug group-hover:underline">
        {product.name}
      </p>
      <p className="mt-1 text-sm font-bold">{formatPrice(product.price)}</p>
    </button>
  );
}
