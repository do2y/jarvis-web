import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/lib/utils";
import { selectIsAuthReady, useAuthStore } from "@/shared/stores/authStore";
import { fetchSellerProducts } from "./api";
import type { SellerProductTab } from "./types";
import type { SellerProductStatus } from "@/shared/types/chat";
import { StatusTabs } from "./components/StatusTabs";
import { Pagination } from "./components/Pagination";

const TABS: { key: SellerProductTab; label: string; alert?: boolean }[] = [
  { key: "ALL", label: "전체" },
  { key: "ON_SALE", label: "판매중" },
  { key: "SOLD_OUT", label: "품절", alert: true },
  { key: "HIDDEN", label: "숨김·판매중지" },
];

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

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") ?? "ALL") as SellerProductTab;
  const page = Number(params.get("page") ?? 1);

  // 복원 완료 전에 보내면 AT 없이 나가 401 → 로그인으로 튕긴다
  const isAuthReady = useAuthStore(selectIsAuthReady);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["seller", "products", { tab, page }],
    queryFn: () => fetchSellerProducts({ tab, page }),
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
        {/* TODO: 상품 등록 화면은 이번 범위 밖 — 라우트 확정 시 연결 */}
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
        tabs={TABS.map((t) => ({ ...t, count: data?.counts[t.key] }))}
        value={tab}
        onChange={(key) => update({ tab: key })}
      />

      {/* 검색·카테고리·정렬은 UI만 — 백엔드 계약 확정 후 연결 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-11 min-w-60 flex-1 items-center gap-2 rounded-full border bg-background px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            disabled
            placeholder="상품명, 상품코드 검색 (준비 중)"
            aria-label="상품 검색"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
        </div>
      </div>

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

      {data && data.products.length === 0 && (
        <div className="rounded-sm border py-16 text-center text-sm text-muted-foreground">
          해당 상태의 상품이 없어요.
        </div>
      )}

      {data && data.products.length > 0 && (
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
                {data.products.map((p) => (
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
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {p.categoryName}
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
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {p.createdAt}
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

          <Pagination
            page={data.page}
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
