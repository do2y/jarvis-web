import { ArrowRight, Check, CircleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatAction, SellerProductDiff } from "@/shared/types/chat";

interface ProductDiffCardProps {
  diff: SellerProductDiff;
  /** 확정된 결과(수정 완료·실패). 있으면 확인 버튼 대신 결과를 표시한다. */
  settled?: ChatAction;
  onConfirm: (draftId: string) => void;
  onCancel: (draftId: string) => void;
  disabled?: boolean;
}

/**
 * 상품 정보 변경 전·후 비교 + 최종 확인 카드.
 * 확인/취소는 별도 API 없이 후속 메시지로 전달(조건 칩과 같은 패턴, CLAUDE.md).
 */
export function ProductDiffCard({
  diff,
  settled,
  onConfirm,
  onCancel,
  disabled,
}: ProductDiffCardProps) {
  const failed = settled?.type === "PRODUCT_UPDATE_FAILED";

  return (
    <section className="flex flex-col gap-4 rounded-sm border bg-background p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted-foreground">
          상품 정보 수정
        </span>
        <h3 className="text-base font-bold tracking-tight">
          {diff.productName}
        </h3>
      </div>

      <ul className="flex flex-col gap-3">
        {diff.fields.map((f) => (
          <li key={f.field} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {f.label}
            </span>
            {/* 좁은 화면에선 전→후가 세로로 쌓이도록 wrap */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-sm bg-muted px-2.5 py-1.5 text-sm text-muted-foreground line-through">
                {f.before}
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              <span className="rounded-sm bg-brand/10 px-2.5 py-1.5 text-sm font-semibold text-brand">
                {f.after}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {settled ? (
        <div
          className={cn(
            "flex items-start gap-2 rounded-sm px-3 py-2.5 text-sm",
            failed
              ? "bg-destructive/10 text-destructive"
              : "bg-brand/10 text-brand",
          )}
        >
          {failed ? (
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
          ) : (
            <Check className="mt-0.5 size-4 shrink-0" />
          )}
          <span className="font-medium">{settled.message}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3 border-t pt-4">
          <p className="text-sm text-muted-foreground">{diff.confirmMessage}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onConfirm(diff.draftId)}
              disabled={disabled}
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground transition-all hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              <Check className="size-4" />
              이대로 수정
            </button>
            <button
              type="button"
              onClick={() => onCancel(diff.draftId)}
              disabled={disabled}
              className="inline-flex h-11 items-center gap-1.5 rounded-full border px-5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              <X className="size-4" />
              취소
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
