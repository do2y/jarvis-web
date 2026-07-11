import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Address } from "../types";

// 배송지 선택.
export function ShippingSection({
  addresses,
  selectedId,
  onSelect,
  onAddClick,
}: {
  addresses: Address[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddClick: () => void;
}) {
  return (
    <section className="rounded-xl border bg-background p-5 sm:p-6">
      <h2 className="text-lg font-bold">배송지</h2>

      <ul className="mt-4 flex flex-col gap-3">
        {addresses.map((addr) => {
          const active = addr.id === selectedId;
          return (
            <li key={addr.id}>
              <button
                type="button"
                onClick={() => onSelect(addr.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                  active ? "border-primary" : "border-input hover:bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                    active ? "border-primary bg-primary" : "border-input",
                  )}
                >
                  {active && (
                    <Check className="size-3 text-primary-foreground" />
                  )}
                </span>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {addr.recipient} ({addr.label})
                    </span>
                    {addr.isDefault && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        기본
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {addr.recipient} · {addr.phone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {addr.address}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onAddClick}
        className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed text-sm text-muted-foreground hover:bg-muted/40"
      >
        <Plus className="size-4" />새 배송지 추가
      </button>
    </section>
  );
}
