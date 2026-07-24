import { Sparkles } from "lucide-react";
import type { SuggestionChip } from "@/shared/types/chat";

interface SuggestionChipsProps {
  suggestions: SuggestionChip[];
  onApply: (label: string) => void; // 제안 적용 왕복 — label 을 다음 턴 message 로
  disabled?: boolean;
}

// 완화·되돌리기 제안 칩(계약 CH-2 §suggestions). 클릭 시 label 을 후속 메시지로 보내 트리거.
// estCount(예상 결과 수)는 부가 표시 — 얼마나 늘어나는지 힌트.
export function SuggestionChips({
  suggestions,
  onApply,
  disabled,
}: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onApply(chip.label)}
          disabled={disabled}
          className="flex animate-in items-center gap-1.5 rounded-full border border-brand/40 bg-brand/5 px-3 py-1.5 text-sm text-brand transition-colors duration-200 fade-in zoom-in-95 hover:bg-brand/10 disabled:opacity-40"
        >
          <Sparkles className="size-3.5" strokeWidth={1.75} />
          {chip.label}
          <span className="text-xs text-brand/70">+{chip.estCount}</span>
        </button>
      ))}
    </div>
  );
}
