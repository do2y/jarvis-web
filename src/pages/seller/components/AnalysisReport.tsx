import { Sparkles } from "lucide-react";

interface AnalysisReportProps {
  /** 분석 리포트 본문(계약상 analysis 단일 token). null이면 로딩 스켈레톤을 보여준다. */
  report: string | null;
  /** 분석 스트림 진행 중 여부 — report 확정 전 스켈레톤 표시 */
  loading: boolean;
}

/**
 * 판매자 분석 리포트 패널 — done{panel:replace}+lane:analysis 시 우측에 표시.
 * 분석 스트림이 도는 동안(loading)엔 스켈레톤, 리포트가 확정되면 본문을 렌더한다.
 * 브랜드 청록(--brand)은 AI 기능 강조 전용(CLAUDE.md 디자인 토큰).
 */
export function AnalysisReport({ report, loading }: AnalysisReportProps) {
  return (
    <section className="flex flex-col gap-4 rounded-sm border bg-background p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Sparkles className="size-4" />
        </span>
        <h3 className="text-base font-bold tracking-tight">AI 분석 리포트</h3>
      </div>

      {loading && !report ? (
        <div className="flex flex-col gap-2.5" aria-label="분석 중">
          {[100, 92, 96, 70].map((w, i) => (
            <span
              key={i}
              className="h-4 animate-pulse rounded-sm bg-muted"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {report}
        </p>
      )}
    </section>
  );
}
