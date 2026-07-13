import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// 후기 작성용 인터랙티브 별점(1~5). 도메인 컴포넌트 → Tailwind 직접 구현.
// radiogroup 시맨틱으로 키보드 접근 가능. 값은 상위(RHF)에서 제어.
export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div
      role="radiogroup"
      aria-label="별점"
      className="flex items-center gap-1"
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star}점`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
        >
          <Star
            className={cn(
              "size-7",
              star <= active
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}
