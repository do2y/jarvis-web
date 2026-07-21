import { useState } from "react";
import { Plus } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { useAddresses, useAddressMutations } from "@/shared/hooks/useAddresses";
import { AddressCard } from "./components/AddressCard";
import { AddressFormModal } from "@/shared/address/AddressFormModal";
import type { AddressValues } from "@/shared/address/addressSchema";
import { PageTitle, ErrorState } from "./components/PageState";
import type { Address } from "@/shared/types/address";

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

  // 삭제·기본 지정 실패는 모달 밖(목록 위)에서, 추가·수정 실패는 모달 안에서 안내한다.
  const listError = remove.errorMessage ?? setDefault.errorMessage;

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

  // 저장 성공했을 때만 모달을 닫는다(실패 시 입력값 보존).
  const handleSubmit = (input: AddressValues) => {
    const onDone = () => setOpen(false);
    if (editing) {
      update.mutate(
        { addressId: editing.addressId, input },
        { onSuccess: onDone },
      );
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
            {/* 삭제·기본 지정 실패는 모달 밖에서 일어나므로 목록 위에 안내한다
                (유일한 배송지 삭제 등) */}
            {listError && (
              <p className="text-sm text-destructive" role="alert">
                {listError}
              </p>
            )}

            {addresses.map((address) => (
              <AddressCard
                key={address.addressId}
                address={address}
                busy={busy}
                deletable={addresses.length > 1}
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
        editing={editing}
        onSubmit={handleSubmit}
        submitting={add.isPending || update.isPending}
        error={add.errorMessage ?? update.errorMessage}
      />
    </div>
  );
}
