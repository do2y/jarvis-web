import type { Claim } from "../types";
import { ClaimStatusBadge, ClaimTypeBadge } from "./ClaimBadges";

export function ClaimCard({ claim }: { claim: Claim }) {
  return (
    <article className="rounded-xl border bg-background px-5 py-4">
      {/* 상단: 상태·종류 뱃지 / 우측 신청일 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClaimStatusBadge status={claim.status} />
          <ClaimTypeBadge type={claim.type} />
        </div>
        <span className="shrink-0 text-sm text-muted-foreground">
          {claim.requestedAt.replace(/-/g, ".")}
        </span>
      </div>

      {/* 상품명 + 사유·주문번호 */}
      <p className="mt-3 truncate text-base font-semibold">
        {claim.productName}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        사유: {claim.reason} · {claim.orderId}
      </p>
    </article>
  );
}
