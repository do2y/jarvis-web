import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  SellerProductStats,
  SellerProductStatus,
} from "@/shared/types/chat";

const STATUS_LABEL: Record<SellerProductStatus, string> = {
  ON_SALE: "판매중",
  SOLD_OUT: "품절",
  HIDDEN: "숨김",
};

const STATUS_CLASS: Record<SellerProductStatus, string> = {
  ON_SALE: "bg-brand/10 text-brand",
  SOLD_OUT: "bg-destructive/10 text-destructive",
  HIDDEN: "bg-muted text-muted-foreground",
};

const LOW_STOCK_THRESHOLD = 10;

/** 상품별 판매 데이터 / 재고 부족 목록 */
export function ProductStatsTable({ stats }: { stats: SellerProductStats }) {
  const isLowStock = stats.kind === "LOW_STOCK";

  return (
    <section className="flex flex-col gap-4 rounded-sm border bg-background p-4 sm:p-6">
      <div className="flex items-center gap-2">
        {isLowStock && <AlertTriangle className="size-4 text-destructive" />}
        <h3 className="text-base font-bold tracking-tight">{stats.title}</h3>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          {stats.items.length}
        </span>
      </div>

      {/* 좁은 화면에선 표가 넘치므로 자체 가로 스크롤 (가로 스크롤 금지 원칙, CLAUDE.md) */}
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="px-4 py-2 text-left font-semibold">상품</th>
              <th className="px-4 py-2 text-right font-semibold">판매가</th>
              <th className="px-4 py-2 text-right font-semibold">재고</th>
              <th className="px-4 py-2 text-right font-semibold">판매량</th>
              <th className="px-4 py-2 text-left font-semibold">상태</th>
            </tr>
          </thead>
          <tbody>
            {stats.items.map((p) => (
              <tr key={p.productId} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.imageUrl}
                      alt=""
                      loading="lazy"
                      className="size-10 shrink-0 rounded-sm bg-muted object-cover"
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.code}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                  {p.price.toLocaleString("ko-KR")}원
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-right font-semibold",
                    p.stock <= LOW_STOCK_THRESHOLD && "text-destructive",
                  )}
                >
                  {p.stock.toLocaleString("ko-KR")}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {p.salesCount.toLocaleString("ko-KR")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
                      STATUS_CLASS[p.status],
                    )}
                  >
                    {STATUS_LABEL[p.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
