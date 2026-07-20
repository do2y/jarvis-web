import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ProductReview,
  ReviewDistribution,
  ReviewSort,
} from "../types";

const SORTS: { value: ReviewSort; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "rating", label: "평점순" },
];

// "2026-07-01T12:00:00+09:00" → "2026.07.01"
// 앞 10자만 쓰므로 Date 파싱 없이 서버가 준 날짜(KST) 그대로 표시된다.
function formatDate(iso: string): string {
  return iso.slice(0, 10).replaceAll("-", ".");
}

// 별점 분포는 5→1 순, 각 단계 개수. 평균/총평가수는 상위에서 주입.
export function ReviewSummary({
  average,
  total,
  distribution,
  reviews,
  sort,
  onSortChange,
  isLoading,
}: {
  average: number;
  total: number;
  distribution: ReviewDistribution;
  reviews: ProductReview[];
  sort: ReviewSort;
  onSortChange: (sort: ReviewSort) => void;
  isLoading?: boolean;
}) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          리뷰{" "}
          <span className="text-muted-foreground">
            {total.toLocaleString("ko-KR")}
          </span>
        </h2>
        <div className="flex items-center gap-1">
          {SORTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onSortChange(s.value)}
              aria-pressed={sort === s.value}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm transition-colors",
                sort === s.value
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 평균 + 분포 바 */}
      <div className="flex flex-col gap-6 rounded-sm bg-muted/40 p-6 sm:flex-row sm:items-center">
        <div className="flex shrink-0 flex-col items-center gap-1 sm:w-32">
          <p className="text-4xl font-bold">{average.toFixed(1)}</p>
          <Stars value={average} />
          <p className="text-xs text-muted-foreground">
            {total.toLocaleString("ko-KR")}개 평가
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          {(["5", "4", "3", "2", "1"] as const).map((score) => {
            const count = distribution[score] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={score} className="flex items-center gap-3 text-xs">
                <span className="w-3 text-muted-foreground">{score}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-yellow-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-muted-foreground">
                  {count.toLocaleString("ko-KR")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 리뷰 리스트 */}
      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          리뷰를 불러오는 중이에요.
        </p>
      ) : reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          아직 등록된 리뷰가 없어요.
        </p>
      ) : (
        <ul className="flex flex-col divide-y">
          {reviews.map((r) => (
            <li key={r.reviewId} className="flex flex-col gap-2 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} size="sm" />
                  <span className="text-sm font-medium">
                    {r.authorNickname}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(r.createdAt)}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{r.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stars({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "size-3.5" : "size-4";
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < Math.round(value)
              ? `${cls} fill-yellow-400 text-yellow-400`
              : `${cls} fill-muted text-muted`
          }
        />
      ))}
    </div>
  );
}
