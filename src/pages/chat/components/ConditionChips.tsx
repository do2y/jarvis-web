import { X } from "lucide-react";
import type { ConditionChip } from "@/shared/types/chat";

interface ConditionChipsProps {
  conditions: ConditionChip[];
  onRemove: (field: string) => void; // 칩 제거 왕복 — field 로 트리거
  disabled?: boolean; // 스트리밍 중엔 제거 비활성
}

// AI가 추출한 필터 조건 칩. 각 칩은 X로 제거 가능(계약 CH-2 §conditions — field 기준 왕복).
export function ConditionChips({
  conditions,
  onRemove,
  disabled,
}: ConditionChipsProps) {
  if (conditions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {conditions.map((chip) => (
        <span
          key={chip.field}
          className="flex animate-in items-center gap-1 rounded-full bg-muted py-1.5 pl-3 pr-1.5 text-sm text-muted-foreground duration-200 fade-in zoom-in-95"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.field)}
            disabled={disabled}
            aria-label={`${chip.label} 조건 제거`}
            className="flex size-5 items-center justify-center rounded-full transition-colors hover:bg-foreground/10 disabled:opacity-40"
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
    </div>
  );
}
