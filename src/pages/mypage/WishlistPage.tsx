import { Skeleton } from "@/components/ui/skeleton";
import { Heart } from "lucide-react";
import { useWishlist } from "./useWishlist";
import { WishlistCard } from "./components/WishlistCard";
import { PageTitle, ErrorState, EmptyState } from "./components/PageState";

function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="flex flex-col">
          <Skeleton className="aspect-square w-full rounded-sm" />
          <Skeleton className="mt-3 h-3 w-12" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-16" />
          <Skeleton className="mt-3 h-10 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function WishlistPage() {
  const { data: products, isPending, isError, refetch } = useWishlist();

  return (
    <div>
      <PageTitle>찜</PageTitle>

      <div className="mt-5">
        {isPending ? (
          <WishlistSkeleton />
        ) : isError ? (
          <ErrorState
            message="찜한 상품을 불러오지 못했어요."
            onRetry={() => refetch()}
          />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="아직 찜한 상품이 없어요"
            description="마음에 드는 상품에 하트를 눌러 모아보세요."
            actionLabel="쇼핑하러 가기"
            actionTo="/"
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <WishlistCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
