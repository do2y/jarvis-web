import { Heart, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/shared/utils/formatPrice";
import { useAddCartItem } from "@/shared/hooks/useCart";
import { useGoToProduct } from "@/shared/hooks/useGoToProduct";
import { useRemoveWishlistItem } from "../useWishlist";
import type { WishlistProduct } from "@/shared/types/wishlist";

export function WishlistCard({ product }: { product: WishlistProduct }) {
  const remove = useRemoveWishlistItem();
  const addCart = useAddCartItem();
  const goToProduct = useGoToProduct();

  // WishlistProduct는 시딩 계약을 전부 갖고 있어 그대로 승계한다.
  const goToDetail = () => goToProduct(product);

  return (
    <article className="group flex h-full flex-col">
      <div className="relative aspect-square overflow-hidden rounded-sm bg-muted ring-1 ring-black/5">
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
          onClick={() => remove.mutate(product.productId)}
          disabled={remove.isPending}
          aria-label="찜 해제"
          aria-pressed
          className="absolute bottom-1 right-1 flex size-11 items-center justify-center transition-transform hover:scale-110 disabled:opacity-50"
        >
          <Heart className="size-6 fill-red-500 text-red-500 drop-shadow-sm" />
        </button>
      </div>

      <button
        type="button"
        onClick={goToDetail}
        className="mt-3 flex flex-1 flex-col text-left"
      >
        <span className="text-xs text-muted-foreground">{product.brandName}</span>
        <span className="mt-1 line-clamp-2 text-sm font-medium leading-snug group-hover:underline">
          {product.name}
        </span>
        <span className="mt-1 text-sm font-bold">
          {formatPrice(product.price)}
        </span>
      </button>

      {/* 담기 — 판매 중지(HIDDEN) 상품은 서버가 거부하므로 버튼을 비활성화한다.
          옵션 필수 상품은 서버 400 사유를 그대로 안내(카드에는 옵션 선택 UI가 없음). */}
      <button
        type="button"
        onClick={() =>
          addCart.mutate({ productId: product.productId, quantity: 1 })
        }
        disabled={!product.purchasable || addCart.isPending}
        className="mt-3 inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-sm border text-sm font-medium transition-all hover:bg-muted active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
      >
        <ShoppingCart className="size-4" />
        {!product.purchasable
          ? "판매 중지"
          : addCart.isPending
            ? "담는 중…"
            : "장바구니 담기"}
      </button>

      {addCart.isSuccess && (
        <p className="mt-2 text-xs text-muted-foreground" role="status">
          장바구니에 담았어요.
        </p>
      )}
      {addCart.errorMessage && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {addCart.errorMessage}
        </p>
      )}
    </article>
  );
}
