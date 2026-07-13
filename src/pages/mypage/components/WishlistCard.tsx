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

  // 캐시 승계: 카드 데이터를 상세 캐시에 부분 시딩 → 부족분은 상세 API가 채움.
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
    <article className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
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
        {/* 찜 해제 — 자동 재시도 없음, 낙관적 제거 후 실패 시 롤백(useRemoveWishlistItem) */}
        <button
          type="button"
          onClick={() => remove.mutate(product.productId)}
          disabled={remove.isPending}
          aria-label="찜 해제"
          aria-pressed
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background disabled:opacity-50"
        >
          <Heart className="size-5 fill-red-500 text-red-500" />
        </button>
      </div>

      <button
        type="button"
        onClick={goToDetail}
        className="mt-3 flex flex-col text-left"
      >
        <span className="text-xs text-muted-foreground">{product.brand}</span>
        <span className="mt-1 line-clamp-2 text-sm font-medium leading-snug group-hover:underline">
          {product.name}
        </span>
        <span className="mt-1 text-sm font-bold">
          {formatPrice(product.price)}
        </span>
      </button>

      {/* TODO: 장바구니 API·훅 연결 시 담기 처리 + invalidate(['cart']) */}
      <button
        type="button"
        className="mt-3 inline-flex h-10 items-center justify-center gap-1.5 rounded-full border text-sm font-medium transition-colors hover:bg-muted"
      >
        <ShoppingCart className="size-4" />
        장바구니 담기
      </button>
    </article>
  );
}
