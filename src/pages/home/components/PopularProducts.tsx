import { Skeleton } from "@/components/ui/skeleton";
import { usePopularProducts } from "../useHomeData";
import { ProductCard } from "./ProductCard";
import { SectionHeading } from "./SectionHeading";

export function PopularProducts() {
  const { data: products, isLoading, isError } = usePopularProducts();

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="추천 상품"
          title="지금 많이 찾는 상품"
          aside={
            // TODO: 전체 상품/추천 목록 페이지로 이동
            <button type="button" className="hover:text-foreground">
              더 보기 →
            </button>
          }
        />

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[4/3] rounded-xl" />
                <Skeleton className="h-4 w-3/4 rounded-full" />
                <Skeleton className="h-4 w-1/2 rounded-full" />
              </div>
            ))}

          {isError && (
            <p className="col-span-full text-sm text-muted-foreground">
              상품을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
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
