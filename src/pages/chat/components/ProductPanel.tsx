import type { ProductGroup } from "@/shared/types/chat";
import { ChatProductCard } from "./ChatProductCard";

interface ProductPanelProps {
  groups: ProductGroup[];
  isStreaming: boolean;
}

// 우측 상품 패널 — 상황 추천은 카테고리별 그룹으로 묶어 표시
export function ProductPanel({ groups, isStreaming }: ProductPanelProps) {
  const isEmpty = groups.length === 0;

  if (isEmpty) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
        {isStreaming
          ? "상품을 찾고 있어요…"
          : "대화를 시작하면 추천 상품이 여기에 표시돼요."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      {groups.map((group) => (
        <section key={group.title} className="flex flex-col gap-4">
          {/* 그룹이 하나뿐이면 제목 생략 가능하지만, 계약상 title 존재 → 표시 */}
          {groups.length > 1 && (
            <h2 className="text-lg font-bold">{group.title}</h2>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((product) => (
              <ChatProductCard key={product.productId} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
