import { useId } from "react";
import type { SellerAnalysis } from "@/shared/types/chat";
import { formatMetric } from "../utils/formatMetric";

// viewBox 좌표계 — 실제 크기는 CSS가 결정(preserveAspectRatio="none" 대신 비율 유지)
const W = 600;
const H = 200;
const PAD = { top: 12, right: 12, bottom: 24, left: 12 };

/**
 * 판매 분석 그래프 — line/bar.
 * 차트 라이브러리 없이 인라인 SVG로 직접 구현(도메인 컴포넌트, CLAUDE.md).
 * 시각 요소는 보조 수단이므로 값은 표로도 함께 노출한다(스크린리더·색 구분 불가 사용자).
 */
export function AnalysisChart({ analysis }: { analysis: SellerAnalysis }) {
  const gradientId = useId();
  const { series, chartType, unit } = analysis;
  const points = series[0]?.points ?? [];

  if (points.length === 0) return null;

  const max = Math.max(...points.map((p) => p.y));
  const min = Math.min(0, ...points.map((p) => p.y));
  const span = max - min || 1;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const x = (i: number) =>
    PAD.left +
    (points.length === 1 ? innerW / 2 : (innerW * i) / (points.length - 1));
  const y = (v: number) => PAD.top + innerH - ((v - min) / span) * innerH;

  const line = points.map((p, i) => `${x(i)},${y(p.y)}`).join(" ");
  const area = `M${x(0)},${PAD.top + innerH} L${line.split(" ").join(" L")} L${x(points.length - 1)},${PAD.top + innerH} Z`;

  const total = points.reduce((sum, p) => sum + p.y, 0);

  return (
    <section className="flex flex-col gap-4 rounded-sm border bg-background p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold tracking-tight">{analysis.title}</h3>
        <span className="text-sm text-muted-foreground">
          합계{" "}
          <span className="font-semibold text-foreground">
            {formatMetric(total, unit)}
          </span>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-44 w-full"
        role="img"
        aria-label={`${analysis.title} ${chartType === "line" ? "선" : "막대"} 그래프`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0"
              stopColor="currentColor"
              stopOpacity="0.18"
              className="text-brand"
            />
            <stop
              offset="1"
              stopColor="currentColor"
              stopOpacity="0"
              className="text-brand"
            />
          </linearGradient>
        </defs>

        {/* 가로 기준선 */}
        {[0, 0.5, 1].map((r) => (
          <line
            key={r}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + innerH * r}
            y2={PAD.top + innerH * r}
            className="stroke-border"
            strokeWidth="1"
          />
        ))}

        {chartType === "bar"
          ? points.map((p, i) => {
              const bw = Math.max(6, (innerW / points.length) * 0.5);
              return (
                <rect
                  key={p.x}
                  x={x(i) - bw / 2}
                  y={y(p.y)}
                  width={bw}
                  height={PAD.top + innerH - y(p.y)}
                  rx="3"
                  className="fill-brand"
                />
              );
            })
          : (
            <>
              <path d={area} fill={`url(#${gradientId})`} />
              <polyline
                points={line}
                fill="none"
                className="stroke-brand"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={x(points.length - 1)}
                cy={y(points[points.length - 1].y)}
                r="4"
                className="fill-brand"
              />
            </>
          )}
      </svg>

      <div className="flex justify-between text-xs text-muted-foreground">
        {points.map((p) => (
          <span key={p.x}>{p.x}</span>
        ))}
      </div>

      {analysis.summary && (
        <p className="rounded-sm bg-muted/60 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
          {analysis.summary}
        </p>
      )}
    </section>
  );
}
