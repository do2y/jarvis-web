import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/lib/utils";
import { selectIsAuthReady, useAuthStore } from "@/shared/stores/authStore";
import { fetchSellerProducts } from "./api";
import type {
  SellerProductDisplayStatus,
  SellerProductTab,
} from "./types";
import { StatusTabs } from "./components/StatusTabs";
import { Pagination } from "./components/Pagination";

const TABS: { key: SellerProductTab; label: string; alert?: boolean }[] = [
  { key: "ALL", label: "전체" },
  { key: "ON_SALE", label: "판매중" },
  { key: "SOLD_OUT", label: "품절", alert: true },
  { key: "HIDDEN", label: "숨김·판매중지" },
];

// 배지는 원본 status가 아니라 displayStatus(3종)로 그린다(계약 §표시 상태 파생).
const STATUS_LABEL: Record<SellerProductDisplayStatus, string> = {
  ON_SALE: "판매중",
  SOLD_OUT: "품절",
  HIDDEN: "숨김",
};

const STATUS_CLASS: Record<SellerProductDisplayStatus, string> = {
  ON_SALE: "bg-brand/10 text-brand",
  SOLD_OUT: "bg-destructive/10 text-destructive",
  HIDDEN: "bg-muted text-muted-foreground",
};

// 빨강 강조 기준 — S-1 lowStockThreshold 기본값과 맞춘다(계약)
const LOW_STOCK_THRESHOLD = 10;

/** "2026-07-01T10:12:00+09:00" → "2026-07-01" (등록일은 날짜만) */
function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

export default function ProductsPage() {
  // URL page는 사람이 보는 1-base, API는 0-base라 호출 시점에만 변환한다.
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") ?? "ALL") as SellerProductTab;
  const uiPage = Math.max(1, Number(params.get("page") ?? 1));

  // 복원 완료 전에 보내면 AT 없이 나가 401 → 로그인으로 튕긴다
  const isAuthReady = useAuthStore(selectIsAuthReady);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["seller", "products", { tab, page: uiPage }],
    queryFn: () => fetchSellerProducts({ tab, page: uiPage - 1 }),
    staleTime: 0,
    placeholderData: keepPreviousData,
    enabled: isAuthReady,
  });

  const update = (next: { tab?: SellerProductTab; page?: number }) => {
    const p = new URLSearchParams(params);
    if (next.tab !== undefined) {
      p.set("tab", next.tab);
      p.delete("page");
    }
    if (next.page !== undefined) p.set("page", String(next.page));
    setParams(p, { replace: true });
  };

  return (
    <div className="flex flex-col gap-5 pb-16 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">상품 목록</h1>
        {/* 상품 등록·수정은 챗봇(I-10/I-11) 경유 — FE 직접 등록 화면은 미채택(2026-07-21) */}
        <button
          type="button"
          disabled
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
        >
          <Plus className="size-4" />
          상품 등록
        </button>
      </div>

      <StatusTabs
        tabs={TABS.map((t) => ({ ...t, count: data?.tabCounts[t.key] }))}
        value={tab}
        onChange={(key) => update({ tab: key })}
      />

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-sm border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            상품을 불러오지 못했어요.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="h-11 rounded-full border px-5 text-sm font-medium transition-all hover:bg-muted active:scale-95"
          >
            다시 시도
          </button>
        </div>
      )}

      {isPending && <TableSkeleton />}

      {data && data.content.length === 0 && (
        <div className="rounded-sm border py-16 text-center text-sm text-muted-foreground">
          해당 상태의 상품이 없어요.
        </div>
      )}

      {data && data.content.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-sm border bg-background">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-semibold">상품</th>
                  <th className="px-4 py-3 text-left font-semibold">카테고리</th>
                  <th className="px-4 py-3 text-right font-semibold">판매가</th>
                  <th className="px-4 py-3 text-right font-semibold">재고</th>
                  <th className="px-4 py-3 text-right font-semibold">판매량</th>
                  <th className="px-4 py-3 text-left font-semibold">등록일</th>
                  <th className="px-4 py-3 text-left font-semibold">상태</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((p) => (
                  <tr key={p.productId} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.imageUrl}
                          alt=""
                          loading="lazy"
                          className="size-10 shrink-0 rounded-sm bg-muted object-cover"
                        />
                        <span className="min-w-0 truncate font-medium">
                          {p.name}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {p.category}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                      {p.price.toLocaleString("ko-KR")}원
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-semibold",
                        p.stockQuantity <= LOW_STOCK_THRESHOLD &&
                          "text-destructive",
                      )}
                    >
                      {p.stockQuantity.toLocaleString("ko-KR")}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {p.displayedSalesCount.toLocaleString("ko-KR")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
                          STATUS_CLASS[p.displayStatus],
                        )}
                      >
                        {STATUS_LABEL[p.displayStatus]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={data.page + 1} // API 0-base → UI 1-base
            totalPages={data.totalPages}
            onChange={(p) => update({ page: p })}
          />
        </>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-sm border p-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-sm" />
      ))}
    </div>
  );
}
