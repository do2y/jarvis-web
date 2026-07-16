import { Heart, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "../utils/formatPrice";
import { useRemoveWishlistItem } from "../useWishlist";
import type { WishlistProduct } from "../types";

export function WishlistCard({ product }: { product: WishlistProduct }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const remove = useRemoveWishlistItem();

  const goToDetail = () => {
    queryClient.setQueryData(["products", product.productId], {
      productId: product.productId,
      name: product.name,
      brandName: product.brand,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    navigate(`/products/${product.productId}`);
  };

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
        <span className="text-xs text-muted-foreground">{product.brand}</span>
        <span className="mt-1 line-clamp-2 text-sm font-medium leading-snug group-hover:underline">
          {product.name}
        </span>
        <span className="mt-1 text-sm font-bold">
          {formatPrice(product.price)}
        </span>
      </button>

      <button
        type="button"
        className="mt-3 inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-sm border text-sm font-medium transition-all hover:bg-muted active:scale-[0.98]"
      >
        <ShoppingCart className="size-4" />
        장바구니 담기
      </button>
    </article>
  );
}
