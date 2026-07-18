import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/shared/stores/authStore";
import { useRecommendedProducts } from "../useHomeData";
import { ProductCard } from "./ProductCard";
import { SectionHeading } from "./SectionHeading";

// 개인화 추천 섹션 — 로그인 사용자에게만 노출.
// 백엔드가 FastAPI 실패·신규 회원 시 인기상품으로 대체하므로 빈 배열은 사실상 오지 않지만,
// 계약상 가능하므로 섹션 자체를 숨겨 빈 그리드가 남지 않게 한다.
export function RecommendedProducts() {
  const nickname = useAuthStore((s) => s.user?.nickname);
  const { data: products, isLoading, isError } = useRecommendedProducts();

  // 게스트는 섹션 자체가 없음(훅도 enabled:false로 호출되지 않음)
  if (!nickname) return null;

  // 로딩이 끝났는데 결과가 없으면 섹션을 숨긴다
  if (!isLoading && !isError && !products?.length) return null;

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="개인화 추천"
          title={`${nickname}님을 위한 추천`}
        />

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[4/3] rounded-sm" />
                <Skeleton className="h-4 w-3/4 rounded-full" />
                <Skeleton className="h-4 w-1/2 rounded-full" />
              </div>
            ))}

          {isError && (
            <p className="col-span-full text-sm text-muted-foreground">
              추천 상품을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
            </p>
          )}

          {products?.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}