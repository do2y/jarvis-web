import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquareText } from "lucide-react";
import { useInquiries } from "./useInquiries";
import { InquiryCard } from "./components/InquiryCard";
import { PageTitle, ErrorState, EmptyState } from "./components/PageState";

function InquiriesSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-sm border bg-background px-5 py-4"
        >
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-5 flex-1 max-w-56" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

export default function InquiriesPage() {
  const { data: inquiries, isPending, isError, refetch } = useInquiries();

  return (
    <div>
      <PageTitle>문의 내역</PageTitle>

      <div className="mt-5">
        {isPending ? (
          <InquiriesSkeleton />
        ) : isError ? (
          <ErrorState
            message="문의 내역을 불러오지 못했어요."
            onRetry={() => refetch()}
          />
        ) : inquiries.length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title="문의 내역이 없어요"
            description="문의 챗봇으로 궁금한 점을 남기면 여기에서 확인할 수 있어요."
            actionLabel="문의하러 가기"
            actionTo="/chat"
          />
        ) : (
          <div className="flex flex-col gap-4">
            {inquiries.map((inquiry) => (
              <InquiryCard key={inquiry.inquiryId} inquiry={inquiry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
