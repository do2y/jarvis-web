import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { ProductCard } from "@/shared/types/chat";

function formatPrice(v: number): string {
  return `${v.toLocaleString("ko-KR")}원`;
}

export function ChatProductCard({ product }: { product: ProductCard }) {
  // 찜 상태는 UI만(찜 API 연동은 별도). CLAUDE.md상 찜은 찜 API 직접 호출 예정
  const [wished, setWished] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasDiscount = product.originalPrice > product.price;

  // 캐시 승계: 카드 데이터를 상세 캐시에 시딩해 상세 진입 시 즉시 렌더(부족분만 백그라운드 페칭)
  const goToDetail = () => {
    queryClient.setQueryData(["products", product.productId], product);
    navigate(`/products/${product.productId}`);
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-background">
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
          onClick={() => setWished((w) => !w)}
          aria-label={wished ? "찜 해제" : "찜하기"}
          aria-pressed={wished}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
        >
          <Heart
            className={cn(
              "size-5",
              wished ? "fill-red-500 text-red-500" : "text-muted-foreground",
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
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {product.reason}
        </p>

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
            className="flex size-9 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ShoppingCart className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
