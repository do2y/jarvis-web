import { MessagesSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatResult } from "@/shared/types/chat";
import { ChatProductCard } from "./ChatProductCard";

interface ProductPanelProps {
  results: ChatResult[];
  isStreaming: boolean;
}

const GRID = "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3";

export function ProductPanel({ results, isStreaming }: ProductPanelProps) {
  // SHOPPING 채널은 상품 결과만 표시한다(다른 kind는 이 채널에 오지 않음)
  const groups = results.flatMap((r) => (r.kind === "products" ? r.groups : []));
  const isEmpty = groups.length === 0;

  if (isEmpty && isStreaming) {
    return (
      <div className="p-4 sm:p-6">
        <div className={GRID}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex h-full animate-in flex-col items-center justify-center gap-3 p-8 text-center duration-500 fade-in">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MessagesSquare className="size-7" strokeWidth={1.5} />
        </span>
        <p className="text-sm text-muted-foreground">
          대화를 시작하면 추천 상품이 여기에 표시돼요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      {groups.map((group) => (
        <section
          key={group.title}
          className="flex animate-in flex-col gap-4 duration-300 fade-in slide-in-from-bottom-2"
        >
          <h2 className="text-lg font-bold tracking-tight">{group.title}</h2>
          <div className={GRID}>
            {group.items.map((product) => (
              <ChatProductCard key={product.productId} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-sm border">
      <Skeleton className="aspect-square rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-3 w-1/3 rounded-full" />
        <Skeleton className="h-4 w-4/5 rounded-full" />
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="mt-2 h-5 w-1/2 rounded-full" />
      </div>
    </div>
  );
}
