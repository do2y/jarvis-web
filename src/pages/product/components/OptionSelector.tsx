import { useEffect, useState } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";
import type { ProductOption } from "../types";

export interface OptionSelection {
  // 선택된 옵션. 옵션 없는 상품은 null (장바구니·주문에 optionId를 보내지 않음)
  option: ProductOption | null;
  quantity: number;
}

// 백엔드 옵션 모델은 평면 목록({optionId, name:"화이트/M", extraPrice})이라 단일 선택.
// 옵션이 없는 상품(options: [])은 수량만 노출한다.
export function OptionSelector({
  options,
  basePrice,
  maxQuantity,
  onChange,
}: {
  options: ProductOption[];
  basePrice: number;
  // 재고 상한. 상세 도착 전(재고 미상)에는 undefined → 제한 없이 증가 허용.
  // 서버가 합산 후 재고로 최종 판정하므로 여기선 이번 선택 수량만 막는다.
  maxQuantity?: number;
  onChange?: (selection: OptionSelection) => void;
}) {
  // 사용자가 고른 값만 담는다. 초기값을 options[0]으로 잡으면 상세 도착 전 첫 렌더에서
  // null로 굳어(초기화 함수는 재실행되지 않음) select에는 첫 옵션이 보이는데
  // 실제 선택은 비어 있는 상태가 된다.
  const [pickedId, setPickedId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);

  // 미선택이면 첫 옵션을 기본값으로 본다 — select의 표시값과 항상 일치시킨다.
  const selected =
    options.find((o) => o.optionId === pickedId) ?? options[0] ?? null;
  const optionId = selected?.optionId ?? null;

  // 재고가 줄어(다른 창에서 담기 등) 현재 수량이 상한을 넘으면 상한으로 되돌린다.
  useEffect(() => {
    if (maxQuantity != null && qty > maxQuantity) {
      setQty(Math.max(1, maxQuantity));
    }
  }, [maxQuantity, qty]);

  // 재고가 있으면 상한을 넘겨 담지 못하게 막는다(1 이상은 항상 허용).
  const atMax = maxQuantity != null && qty >= maxQuantity;

  // 선택/수량 변경을 상위로 전파. (부모의 액션 버튼이 최신 선택을 읽도록)
  useEffect(() => {
    onChange?.({ option: selected, quantity: qty });
  }, [selected, qty, onChange]);

  return (
    <div className="flex flex-col gap-5">
      {options.length > 0 && (
        <Field label="옵션">
          <div className="relative">
            <select
              value={optionId ?? ""}
              onChange={(e) => setPickedId(Number(e.target.value))}
              aria-label="옵션 선택"
              className="h-11 w-full appearance-none rounded-sm border bg-background px-4 pr-10 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {options.map((opt) => (
                <option key={opt.optionId} value={opt.optionId}>
                  {/* 추가금이 있는 옵션만 금액을 함께 노출 */}
                  {opt.extraPrice > 0
                    ? `${opt.name} (+${opt.extraPrice.toLocaleString("ko-KR")}원)`
                    : opt.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </Field>
      )}

      <Field label="수량">
        <div className="flex w-fit items-center rounded-full border">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="수량 감소"
            className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center text-sm font-medium">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            disabled={atMax}
            aria-label="수량 증가"
            className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
        {/* 재고 상한에 도달했을 때만 안내. 남은 재고 수량은 노출하지 않는다. */}
        {atMax && (
          <p className="text-xs text-muted-foreground" role="status">
            더 담을 수 있는 재고가 없어요.
          </p>
        )}
      </Field>

      {/* 옵션 추가금이 붙으면 최종 단가가 달라지므로 합계를 명시 */}
      {selected && selected.extraPrice > 0 && (
        <p className="text-sm text-muted-foreground">
          선택 단가{" "}
          <span className="font-semibold text-foreground">
            {(basePrice + selected.extraPrice).toLocaleString("ko-KR")}원
          </span>
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}
