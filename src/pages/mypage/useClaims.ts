import { useQuery } from "@tanstack/react-query";
import { fetchClaims } from "./api";

// 취소·반품·교환 신청 내역 — 서버 원본, 처리 상태가 바뀔 수 있어 staleTime 0.
export function useClaims() {
  return useQuery({
    queryKey: ["claims"],
    queryFn: fetchClaims,
    staleTime: 0,
  });
}
