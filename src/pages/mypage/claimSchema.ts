import { z } from "zod";

// 반품 신청 폼 — 대상 아이템(orderItemId) + 사유(select) + 상세 설명(선택).
// 대상을 orderItemId로 잡는 이유: 같은 상품을 옵션만 다르게 담은 주문에서
// productId만으로는 어느 주문 줄인지 특정할 수 없다(API도 orderItemId 기준).
export const claimRequestSchema = z.object({
  orderItemId: z.coerce
    .number({ error: "신청할 상품을 선택해주세요." })
    .int()
    .positive("신청할 상품을 선택해주세요."),
  reason: z.string().trim().min(1, "사유를 선택해주세요."),
  detail: z
    .string()
    .trim()
    .max(300, "상세 설명은 300자 이하여야 합니다.")
    .optional(),
});

// 입력(폼 필드는 문자열) vs 출력(coerce 후 orderItemId: number)을 구분.
// RHF는 입력 타입으로, mutate 페이로드는 출력 타입으로 다룬다.
export type ClaimRequestFormInput = z.input<typeof claimRequestSchema>;
export type ClaimRequestFormValues = z.output<typeof claimRequestSchema>;
