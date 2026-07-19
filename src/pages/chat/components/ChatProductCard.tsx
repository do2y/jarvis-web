import { Heart, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useIsWished, useToggleWishlist } from "@/shared/hooks/useWishlist";
import type { ProductCard } from "@/shared/types/chat";

function formatPrice(v: number): string {
  return `${v.toLocaleString("ko-KR")}원`;
}

export function ChatProductCard({ product }: { product: ProductCard }) {
  // 찜 상태는 서버 목록에서 파생 — 로컬 토글이면 새로고침·다른 화면과 어긋난다.
  const wished = useIsWished(product.productId);
  const { toggle, isPending } = useToggleWishlist();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasDiscount = product.originalPrice > product.price;

  const goToDetail = () => {
    queryClient.setQueryData(["products", product.productId], product);
    navigate(`/products/${product.productId}`);
  };

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

          {/* TODO: 장바구니 API·훅 연결 시 담기 처리 + invalidate(['cart']) */}
          <button
            type="button"
            aria-label="장바구니에 담기"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-90"
          >
            <ShoppingCart className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
