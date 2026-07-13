import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useClaims } from "./useClaims";
import { ClaimCard } from "./components/ClaimCard";

function ClaimsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-xl border bg-background px-5 py-4">
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
      <h2 className="text-lg font-bold">취소·반품·교환</h2>

      <div className="mt-5">
        {isPending ? (
          <ClaimsSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">
              신청 내역을 불러오지 못했어요.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-10 rounded-full px-5",
              )}
            >
              다시 시도
            </button>
          </div>
        ) : claims.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <p className="text-sm font-medium">
              취소·반품·교환 내역이 없어요
            </p>
            <p className="text-sm text-muted-foreground">
              주문 내역에서 취소나 반품·교환을 신청할 수 있어요.
            </p>
            <Link
              to="/mypage/orders"
              className={cn(buttonVariants(), "mt-1 h-11 rounded-full px-6")}
            >
              주문 내역 보기
            </Link>
          </div>
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
