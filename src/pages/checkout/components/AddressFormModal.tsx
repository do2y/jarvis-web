import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/ui/dialog";
import { addressSchema, type AddressValues } from "../schema";
import type { Address } from "../types";

// 배송지 추가 모달 — RHF + Zod. 저장 시 상위로 완성된 Address를 올린다.
// 배송지 API 계약 전이라 저장은 상위 로컬 목록에만 반영(새로고침 시 소실).
export function AddressFormModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (address: Omit<Address, "id">) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "",
      recipient: "",
      phone: "",
      address: "",
      detail: "",
    },
  });

  const submit = (values: AddressValues) => {
    // 상세주소는 있으면 기본주소 뒤에 이어붙인다.
    const full = values.detail
      ? `${values.address} ${values.detail}`
      : values.address;
    onSubmit({
      label: values.label,
      recipient: values.recipient,
      phone: values.phone,
      address: full,
    });
    reset();
    onOpenChange(false);
  };

  // 닫힐 때 입력값 초기화 (다음에 다시 열면 빈 폼)
  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>새 배송지 추가</DialogTitle>

        <form
          onSubmit={handleSubmit(submit)}
          className="mt-5 flex flex-col gap-4"
          noValidate
        >
          <Field label="배송지명" htmlFor="addr-label" error={errors.label?.message}>
            <Input
              id="addr-label"
              placeholder="집, 회사 등"
              aria-invalid={!!errors.label}
              className="h-11 rounded-xl"
              {...register("label")}
            />
          </Field>

          <Field
            label="받는 분"
            htmlFor="addr-recipient"
            error={errors.recipient?.message}
          >
            <Input
              id="addr-recipient"
              autoComplete="name"
              aria-invalid={!!errors.recipient}
              className="h-11 rounded-xl"
              {...register("recipient")}
            />
          </Field>

          <Field label="연락처" htmlFor="addr-phone" error={errors.phone?.message}>
            <Input
              id="addr-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="010-1234-5678"
              aria-invalid={!!errors.phone}
              className="h-11 rounded-xl"
              {...register("phone")}
            />
          </Field>

          <Field label="주소" htmlFor="addr-address" error={errors.address?.message}>
            {/* TODO: 우편번호 검색(다음/카카오 우편번호 API) 연동 후 검색 버튼 추가 */}
            <Input
              id="addr-address"
              placeholder="도로명 주소"
              aria-invalid={!!errors.address}
              className="h-11 rounded-xl"
              {...register("address")}
            />
          </Field>

          <Field label="상세주소" htmlFor="addr-detail">
            <Input
              id="addr-detail"
              placeholder="동·호수 등 (선택)"
              className="h-11 rounded-xl"
              {...register("detail")}
            />
          </Field>

          <div className="mt-2 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl"
              onClick={() => handleOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" className="h-11 flex-1 rounded-xl">
              저장
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
