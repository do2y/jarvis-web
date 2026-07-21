import { formatPrice } from "@/shared/utils/formatPrice";

interface RecommendItem {
  productId: number;
  name: string;
  brandName: string;
  price: number;
  imageUrl: string;
  reason?: string; // 대체 상품 추천 이유 (Jarvis 추천)
}

// 함께 구매/대체 상품 가로 스크롤 목록. reason 있으면 Jarvis 추천 스타일(좌측 이미지+이유).
export function RecommendRow({
  title,
  description,
  items,
  variant = "grid",
}: {
  title: string;
  description?: string;
  items: RecommendItem[];
  variant?: "grid" | "reason";
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {variant === "reason" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-3 rounded-sm border bg-background p-4"
            >
              <div className="size-16 shrink-0 overflow-hidden rounded-sm bg-muted">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-xs text-muted-foreground">{item.brandName}</p>
                <p className="truncate text-sm font-semibold">{item.name}</p>
                {item.reason && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {item.reason}
                  </p>
                )}
                <p className="mt-auto text-sm font-bold">
                  {formatPrice(item.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {items.map((item) => (
            <div key={item.productId} className="flex flex-col gap-2">
              <div className="aspect-square overflow-hidden rounded-sm bg-muted">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground">{item.brandName}</p>
              <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
              <p className="text-sm font-bold">{formatPrice(item.price)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
