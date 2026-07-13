import { z } from "zod";

// 후기 작성 폼 검증 — 백엔드 필드 정의와 일치시킬 것(계약 확정 시 갱신).
// 별점 필수(1~5), 내용 최소 10자. 사진은 선택(현재 목: 파일명만 유지).
export const reviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "별점을 선택해주세요.")
    .max(5),
  content: z
    .string()
    .trim()
    .min(10, "후기를 10자 이상 입력해주세요.")
    .max(1000, "후기는 1000자까지 입력할 수 있어요."),
});

export type ReviewValues = z.infer<typeof reviewSchema>;
