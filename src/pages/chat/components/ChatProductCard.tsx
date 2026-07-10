import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductCard } from "@/shared/types/chat";

function formatPrice(v: number): string {
  return `${v.toLocaleString("ko-KR")}원`;
}

export function ChatProductCard({ product }: { product: ProductCard }) {
  // 찜 상태는 UI만(찜 API 연동은 별도). CLAUDE.md상 찜은 찜 API 직접 호출 예정
  const [wished, setWished] = useState(false);
  const hasDiscount = product.originalPrice > product.price;

  return (
    // TODO: 클릭 시 상세로 이동 + setQueryData(['products', id])로 카드 데이터 시딩
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-background">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform group-hover:scale-105"
        />
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
          {product.name}
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
