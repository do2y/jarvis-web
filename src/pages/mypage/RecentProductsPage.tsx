import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";
import { useRecentProducts } from "./useRecentProducts";
import { RecentProductCard } from "./components/RecentProductCard";
import { PageTitle, ErrorState, EmptyState } from "./components/PageState";

function RecentProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="flex flex-col">
          <Skeleton className="aspect-square w-full rounded-sm" />
          <Skeleton className="mt-3 h-3 w-12" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function RecentProductsPage() {
  const { data: products, isPending, isError, refetch } = useRecentProducts();

  return (
    <div>
      <PageTitle>최근 본 상품</PageTitle>

      <div className="mt-5">
        {isPending ? (
          <RecentProductsSkeleton />
        ) : isError ? (
          <ErrorState
            message="최근 본 상품을 불러오지 못했어요."
            onRetry={() => refetch()}
          />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="아직 본 상품이 없어요"
            description="관심 있는 상품을 둘러보면 여기에 모아드려요."
            actionLabel="쇼핑하러 가기"
            actionTo="/"
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <RecentProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
