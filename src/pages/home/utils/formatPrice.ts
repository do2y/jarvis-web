// 원화 포맷. 여러 페이지에서 쓰게 되면 shared/ui의 PriceText로 승격 예정.
export function formatPrice(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}
