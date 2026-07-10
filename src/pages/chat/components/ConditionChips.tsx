import { X } from "lucide-react";

interface ConditionChipsProps {
  conditions: string[];
  onRemove: (name: string) => void;
  disabled?: boolean;
}

// AI가 추출한 조건 칩 — X 클릭 시 후속 메시지로 제거 요청 (별도 API 없음, CLAUDE.md)
export function ConditionChips({
  conditions,
  onRemove,
  disabled,
}: ConditionChipsProps) {
  if (conditions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {conditions.map((c) => (
        <span
          key={c}
          className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-sm"
        >
          {c}
          <button
            type="button"
            onClick={() => onRemove(c)}
            disabled={disabled}
            aria-label={`${c} 조건 제거`}
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
    </div>
  );
}
