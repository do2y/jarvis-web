import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/client";
import { selectIsAuthReady, useAuthStore } from "@/shared/stores/authStore";
import { createClaim, fetchClaims } from "./api";
import type { CreateClaimRequest } from "./types";

// 취소·반품 신청 내역 — 서버 원본, 처리 상태가 바뀔 수 있어 staleTime 0.
// page/size가 키에 들어가 페이지 전환 시 각각 캐시된다(주문 목록과 동일).
// 로그인 필수 — 복원 완료 전에 보내면 AT 없이 나가 401 → 로그인으로 튕긴다.
export function useClaims(page = 0, size = 10) {
  const isAuthReady = useAuthStore(selectIsAuthReady);

  return useQuery({
    queryKey: ["claims", { page, size }],
    queryFn: () => fetchClaims(page, size),
    staleTime: 0,
    enabled: isAuthReady,
  });
}

// 신청 거부 사유를 사용자 문구로. 허용 판정은 서버 몫이라 FE는 코드만 보고 안내한다.
function toClaimErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // 매트릭스 위반(예: 배송중 취소) — 서버 메시지가 사유를 정확히 담고 있어 우선 사용
    if (error.code === "CLAIM_NOT_ALLOWED")
      return error.message || "지금은 신청할 수 없는 상품이에요.";
    if (error.code === "CLAIM_ALREADY_REQUESTED")
      return "이미 접수된 신청이 있어요. 취소·반품 내역에서 확인해주세요.";
    // 타인 아이템도 404로 통일되므로 존재 여부를 드러내지 않는 문구를 쓴다
    if (error.code === "ORDER_ITEM_NOT_FOUND")
      return "주문 상품을 찾을 수 없어요.";
    if (error.displayMessage) return error.displayMessage;
  }
  return "신청에 실패했어요. 잠시 후 다시 시도해주세요.";
}

// 취소·반품 신청 뮤테이션 — 성공 시 내역·주문 무효화로 재동기화.
// (신청이 접수되면 주문 대표 상태가 CLAIM_IN_PROGRESS로 바뀔 수 있다)
// 자동 재시도 없음(중복 접수 방지, CLAUDE.md 규칙).
export function useCreateClaim() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (args: { orderItemId: number; body: CreateClaimRequest }) =>
      createClaim(args.orderItemId, args.body),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  return {
    ...mutation,
    errorMessage: mutation.error
      ? toClaimErrorMessage(mutation.error)
      : null,
  };
}
