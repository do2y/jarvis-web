import { z } from "zod";

// 배송지 입력 폼 — 백엔드 /api/addresses 필드와 일치.
// address2(상세주소)만 선택, 나머지는 필수.
export const addressSchema = z.object({
  label: z
    .string()
    .min(1, "배송지명을 입력해주세요")
    .max(20, "배송지명은 20자 이하여야 합니다"),
  recipient: z.string().min(1, "받는 분을 입력해주세요"),
  phone: z
    .string()
    .min(1, "연락처를 입력해주세요")
    .regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, "올바른 휴대폰 번호가 아닙니다"),
  zipCode: z
    .string()
    .min(1, "우편번호를 입력해주세요")
    .regex(/^\d{5}$/, "우편번호는 5자리 숫자예요"),
  address1: z.string().min(1, "주소를 입력해주세요"),
  address2: z.string().optional(),
});

export type AddressValues = z.infer<typeof addressSchema>;
