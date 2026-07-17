import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SellerMetric } from "@/shared/types/chat";
import { formatMetric } from "../utils/formatMetric";

/** 매출·주문 요약 카드 행 */
export function MetricCards({ items }: { items: SellerMetric[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((m) => {
        const up = (m.deltaRate ?? 0) >= 0;
        const Arrow = up ? TrendingUp : TrendingDown;

        return (
          <div
            key={m.key}
            className="flex flex-col gap-3 rounded-sm border bg-background p-4 sm:p-5"
          >
            <span className="text-sm font-medium text-muted-foreground">
              {m.label}
            </span>
            <span className="text-2xl font-bold tracking-tight">
              {formatMetric(m.value, m.unit)}
            </span>
            {m.deltaRate !== undefined && (
              <span className="flex items-center gap-1.5 text-sm">
                <Arrow
                  className={cn(
                    "size-4",
                    up ? "text-brand" : "text-destructive",
                  )}
                />
                <span
                  className={cn(
                    "font-semibold",
                    up ? "text-brand" : "text-destructive",
                  )}
                >
                  {up ? "+" : ""}
                  {m.deltaRate}%
                </span>
                {m.caption && (
                  <span className="text-muted-foreground">{m.caption}</span>
                )}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
