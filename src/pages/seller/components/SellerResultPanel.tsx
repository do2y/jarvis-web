import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatResult } from "@/shared/types/chat";
import { MetricCards } from "./MetricCards";
import { AnalysisChart } from "./AnalysisChart";
import { ProductStatsTable } from "./ProductStatsTable";
import { ProductDiffCard } from "./ProductDiffCard";

interface SellerResultPanelProps {
  results: ChatResult[];
  isStreaming: boolean;
  onConfirmDiff: (draftId: string) => void;
  onCancelDiff: (draftId: string) => void;
}

/** SELLER 채널 결과 렌더러 — kind별로 판매자 전용 카드에 분기 */
export function SellerResultPanel({
  results,
  isStreaming,
  onConfirmDiff,
  onCancelDiff,
}: SellerResultPanelProps) {
  if (results.length === 0 && isStreaming) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-sm border p-5">
              <Skeleton className="h-3 w-1/2 rounded-full" />
              <Skeleton className="h-6 w-3/4 rounded-full" />
              <Skeleton className="h-3 w-1/3 rounded-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 rounded-sm" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex h-full animate-in flex-col items-center justify-center gap-3 p-8 text-center duration-500 fade-in">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <BarChart3 className="size-7" strokeWidth={1.5} />
        </span>
        <p className="text-sm text-muted-foreground">
          질문하시면 매출·주문·재고 분석 결과가 여기에 표시돼요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {results.map((result, i) => (
        <div
          key={i}
          className="animate-in duration-300 fade-in slide-in-from-bottom-2"
        >
          {result.kind === "metrics" && <MetricCards items={result.items} />}
          {result.kind === "analysis" && (
            <AnalysisChart analysis={result.analysis} />
          )}
          {result.kind === "productStats" && (
            <ProductStatsTable stats={result.stats} />
          )}
          {result.kind === "productDiff" && (
            <ProductDiffCard
              diff={result.diff}
              settled={result.settled}
              onConfirm={onConfirmDiff}
              onCancel={onCancelDiff}
              disabled={isStreaming}
            />
          )}
        </div>
      ))}
    </div>
  );
}
