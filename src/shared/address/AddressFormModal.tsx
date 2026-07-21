import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import {
  addressSchema,
  type AddressValues,
} from "@/shared/address/addressSchema";
import type { Address } from "@/shared/types/address";

const EMPTY: AddressValues = {
  label: "",
  recipient: "",
  phone: "",
  zipCode: "",
  address1: "",
  address2: "",
};

// 배송지 추가·수정 모달 — RHF + Zod. 결제·마이페이지가 공유한다.
// 도메인(배송지)을 아는 폼이라 순수 UI 계층(shared/ui)이 아닌 shared/address에 둔다.
// 저장 성공 여부는 상위가 판단하므로 여기선 값만 올린다(실패 시 열어둔 채 error 표시).
export function AddressFormModal({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  error,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (address: AddressValues) => void;
  submitting?: boolean;
  error?: string | null;
  // 있으면 수정 모드 — 기존 값으로 폼을 채운다. 없으면 추가 모드.
  editing?: Address | null;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: EMPTY,
  });

  // 수정 대상이 바뀌면 폼을 다시 채운다. 열린 뒤에 대상이 정해지는 경우도 있어
  // open까지 의존성에 넣는다.
  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            label: editing.label,
            recipient: editing.recipient,
            phone: editing.phone,
            zipCode: editing.zipCode,
            address1: editing.address1,
            address2: editing.address2 ?? "",
          }
        : EMPTY,
    );
  }, [open, editing, reset]);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset(EMPTY);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>{editing ? "배송지 수정" : "새 배송지 추가"}</DialogTitle>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-5 flex flex-col gap-4"
          noValidate
        >
          <Field label="배송지명" htmlFor="addr-label" error={errors.label?.message}>
            <Input
              id="addr-label"
              placeholder="집, 회사 등"
              aria-invalid={!!errors.label}
              className="h-11 rounded-sm"
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
              className="h-11 rounded-sm"
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
              className="h-11 rounded-sm"
              {...register("phone")}
            />
          </Field>

          <Field label="우편번호" htmlFor="addr-zip" error={errors.zipCode?.message}>
            {/* TODO: 우편번호 검색(다음/카카오 우편번호 API) 연동 후 검색 버튼 추가 */}
            <Input
              id="addr-zip"
              inputMode="numeric"
              placeholder="06236"
              aria-invalid={!!errors.zipCode}
              className="h-11 rounded-sm"
              {...register("zipCode")}
            />
          </Field>

          <Field
            label="주소"
            htmlFor="addr-address1"
            error={errors.address1?.message}
          >
            <Input
              id="addr-address1"
              placeholder="도로명 주소"
              aria-invalid={!!errors.address1}
              className="h-11 rounded-sm"
              {...register("address1")}
            />
          </Field>

          <Field label="상세주소" htmlFor="addr-address2">
            <Input
              id="addr-address2"
              placeholder="동·호수 등 (선택)"
              className="h-11 rounded-sm"
              {...register("address2")}
            />
          </Field>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="mt-2 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-sm"
              onClick={() => handleOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 flex-1 rounded-sm"
            >
              {submitting ? "저장 중…" : "저장"}
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
