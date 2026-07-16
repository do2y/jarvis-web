import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw } from "lucide-react";
import { useClaims } from "./useClaims";
import { ClaimCard } from "./components/ClaimCard";
import { PageTitle, ErrorState, EmptyState } from "./components/PageState";

function ClaimsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-sm border bg-background px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Skeleton className="h-7 w-16 rounded-full" />
              <Skeleton className="h-7 w-14 rounded-full" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="mt-3 h-5 w-56" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
      ))}
    </div>
  );
}

export default function ClaimsPage() {
  const { data: claims, isPending, isError, refetch } = useClaims();

  return (
    <div>
      <PageTitle>취소·반품·교환</PageTitle>

      <div className="mt-5">
        {isPending ? (
          <ClaimsSkeleton />
        ) : isError ? (
          <ErrorState
            message="신청 내역을 불러오지 못했어요."
            onRetry={() => refetch()}
          />
        ) : claims.length === 0 ? (
          <EmptyState
            icon={RefreshCcw}
            title="취소·반품·교환 내역이 없어요"
            description="주문 내역에서 취소나 반품·교환을 신청할 수 있어요."
            actionLabel="주문 내역 보기"
            actionTo="/mypage/orders"
          />
        ) : (
          <div className="flex flex-col gap-4">
            {claims.map((claim) => (
              <ClaimCard key={claim.claimId} claim={claim} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
