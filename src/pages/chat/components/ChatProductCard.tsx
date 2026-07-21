import { Heart, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsWished, useToggleWishlist } from "@/shared/hooks/useWishlist";
import { useAddCartItem } from "@/shared/hooks/useCart";
import { useGoToProduct } from "@/shared/hooks/useGoToProduct";
import { formatPrice } from "@/shared/utils/formatPrice";
import type { ProductCard } from "@/shared/types/chat";

export function ChatProductCard({ product }: { product: ProductCard }) {
  // 찜 상태는 서버 목록에서 파생 — 로컬 토글이면 새로고침·다른 화면과 어긋난다.
  const wished = useIsWished(product.productId);
  const { toggle, isPending } = useToggleWishlist();
  const addCart = useAddCartItem();
  const goToProduct = useGoToProduct();
  const hasDiscount = product.originalPrice > product.price;

  const goToDetail = () => goToProduct(product);

  return (
    <div className="group flex flex-col overflow-hidden rounded-sm border bg-background transition-shadow duration-200 hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <button
          type="button"
          onClick={goToDetail}
          aria-label={`${product.name} 상세 보기`}
          className="block size-full"
        >
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        </button>
        <button
          type="button"
          onClick={() => toggle(product.productId, wished)}
          disabled={isPending}
          aria-label={wished ? "찜 해제" : "찜하기"}
          aria-pressed={wished}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-all hover:bg-background active:scale-90 disabled:opacity-50"
        >
          <Heart
            className={cn(
              "size-5 transition-transform",
              wished
                ? "scale-110 fill-red-500 text-red-500"
                : "text-muted-foreground",
            )}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium text-muted-foreground">
          {product.brandName}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          <button
            type="button"
            onClick={goToDetail}
            className="text-left hover:underline"
          >
            {product.name}
          </button>
        </h3>
        {/* 인기상품(단순 집계) 카드는 추천 이유가 없어 영역 자체를 그리지 않음 */}
        {product.reason && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {product.reason}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-base font-bold">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* 담기 — 옵션이 필요한 상품은 서버가 400(CART_OPTION_REQUIRED)으로 알려주므로
              카드에서는 기본 1개 담기만 시도하고 실패 사유를 안내한다. 자동 재시도 없음. */}
          <button
            type="button"
            onClick={() =>
              addCart.mutate({ productId: product.productId, quantity: 1 })
            }
            disabled={addCart.isPending}
            aria-label="장바구니에 담기"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-90 disabled:opacity-50"
          >
            <ShoppingCart className="size-4" />
          </button>
        </div>

        {addCart.isSuccess && (
          <p className="text-xs text-muted-foreground" role="status">
            장바구니에 담았어요.
          </p>
        )}
        {addCart.errorMessage && (
          <p className="text-xs text-destructive" role="alert">
            {addCart.errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
