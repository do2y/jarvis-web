import { Check, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "../utils/formatPrice";
import type { CartItem } from "../types";

export function CartItemCard({
  item,
  selected,
  onToggle,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  selected: boolean;
  onToggle: () => void;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const hasDiscount = item.originalPrice > item.price;
  const lineTotal = item.price * item.quantity;
  const lineOriginal = item.originalPrice * item.quantity;
  const optionText = Object.values(item.options).join(" / ");

  return (
    <article className="flex gap-4 rounded-xl border bg-background p-4 sm:p-5">
      {/* 선택 체크박스 */}
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={selected ? "선택 해제" : "선택"}
        onClick={onToggle}
        className={cn(
          "mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected ? "border-primary bg-primary" : "border-input",
        )}
      >
        {selected && <Check className="size-4 text-primary-foreground" />}
      </button>

      <img
        src={item.imageUrl}
        alt=""
        className="size-20 shrink-0 rounded-xl bg-muted object-cover sm:size-24"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{item.brand}</p>
            <p className="mt-0.5 truncate text-sm font-medium">{item.name}</p>
          </div>
          <button
            type="button"
            aria-label="삭제"
            onClick={onRemove}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* 옵션 칩 */}
        {optionText && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.values(item.options).map((value) => (
              <span
                key={value}
                className="inline-flex h-6 items-center rounded-full border px-2.5 text-xs text-muted-foreground"
              >
                {value}
              </span>
            ))}
          </div>
        )}

        {/* 수량 스테퍼 + 가격 */}
        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="inline-flex h-10 items-center rounded-full border">
            <button
              type="button"
              aria-label="수량 줄이기"
              disabled={item.quantity <= 1}
              onClick={() => onQuantityChange(item.quantity - 1)}
              className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label="수량 늘리기"
              onClick={() => onQuantityChange(item.quantity + 1)}
              className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <div className="text-right">
            <p className="text-base font-bold">{formatPrice(lineTotal)}</p>
            {hasDiscount && (
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(lineOriginal)}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
