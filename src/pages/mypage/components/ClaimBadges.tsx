import { cn } from "@/lib/utils";
import type { ClaimStatus, ClaimType } from "../types";

// 처리 상태 — OrderStatusBadge와 동일한 토큰 팔레트(포인트 색은 상태 구분에만).
const STATUS_META: Record<ClaimStatus, { label: string; className: string }> = {
  REQUESTED: { label: "접수", className: "bg-muted text-muted-foreground" },
  PROCESSING: { label: "처리중", className: "bg-amber-50 text-amber-700" },
  COMPLETED: { label: "완료", className: "bg-green-50 text-green-700" },
  REJECTED: { label: "반려", className: "bg-red-50 text-red-600" },
};

// 신청 종류 — 반품은 환불로 표기(사용자 관점).
const TYPE_LABEL: Record<ClaimType, string> = {
  CANCEL: "취소",
  RETURN: "환불",
  EXCHANGE: "교환",
};

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const { label, className } = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function ClaimTypeBadge({ type }: { type: ClaimType }) {
  return (
    <span className="inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium text-muted-foreground">
      {TYPE_LABEL[type]}
    </span>
  );
}
