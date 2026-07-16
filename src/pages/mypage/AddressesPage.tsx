import { useState } from "react";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddresses, useAddressMutations } from "./useAddresses";
import { AddressCard } from "./components/AddressCard";
import { AddressFormModal } from "./components/AddressFormModal";
import { PageTitle, ErrorState } from "./components/PageState";
import type { Address, AddressInput } from "./types";

function AddressesSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-sm border bg-background p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="mt-3 h-4 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
      ))}
    </div>
  );
}

export default function AddressesPage() {
  const { data: addresses, isPending, isError, refetch } = useAddresses();
  const { add, update, remove, setDefault } = useAddressMutations();

  // 모달 상태 — editing 있으면 수정, null이면 추가(open으로 구분).
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  const openAdd = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (address: Address) => {
    setEditing(address);
    setOpen(true);
  };

  const handleSubmit = (input: AddressInput) => {
    const onDone = () => setOpen(false);
    if (editing) {
      update.mutate({ addressId: editing.addressId, input }, { onSuccess: onDone });
    } else {
      add.mutate(input, { onSuccess: onDone });
    }
  };

  const handleRemove = (address: Address) => {
    if (window.confirm(`'${address.label}' 배송지를 삭제할까요?`)) {
      remove.mutate(address.addressId);
    }
  };

  const busy = remove.isPending || setDefault.isPending;

  return (
    <div>
      <PageTitle>배송지 관리</PageTitle>

      <div className="mt-5">
        {isPending ? (
          <AddressesSkeleton />
        ) : isError ? (
          <ErrorState
            message="배송지를 불러오지 못했어요."
            onRetry={() => refetch()}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {addresses.map((address) => (
              <AddressCard
                key={address.addressId}
                address={address}
                busy={busy}
                onEdit={() => openEdit(address)}
                onRemove={() => handleRemove(address)}
                onSetDefault={() => setDefault.mutate(address.addressId)}
              />
            ))}

            {/* 배송지 추가 — 점선 버튼 */}
            <button
              type="button"
              onClick={openAdd}
              className="flex h-14 items-center justify-center gap-1.5 rounded-sm border border-dashed text-sm font-medium text-muted-foreground transition-all hover:border-foreground/30 hover:bg-muted/40 hover:text-foreground active:scale-[0.99]"
            >
              <Plus className="size-4" />
              배송지 추가
            </button>
          </div>
        )}
      </div>

      <AddressFormModal
        open={open}
        onOpenChange={setOpen}
        address={editing ?? undefined}
        onSubmit={handleSubmit}
        isPending={add.isPending || update.isPending}
      />
    </div>
  );
}
