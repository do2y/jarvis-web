import type { SellerMetric } from "../types";

/** 판매 지표 값 표시 — 단위별 포맷 */
export function formatMetric(
  value: number,
  unit: SellerMetric["unit"],
): string {
  switch (unit) {
    case "KRW":
      return `${value.toLocaleString("ko-KR")}원`;
    case "PERCENT":
      return `${value}%`;
    default:
      return value.toLocaleString("ko-KR");
  }
}
