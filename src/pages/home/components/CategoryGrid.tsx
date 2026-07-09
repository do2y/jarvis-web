import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "../useHomeData";
import { SectionHeading } from "./SectionHeading";

export function CategoryGrid() {
  const { data: categories, isLoading, isError } = useCategories();

  return (
    <section className="bg-muted/30 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="카테고리"
          title="어떤 걸 찾고 계세요?"
          aside="클릭하면 AI가 해당 분야에서 도와드려요"
        />

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {isLoading &&
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}

          {isError && (
            <p className="col-span-full text-sm text-muted-foreground">
              카테고리를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
            </p>
          )}

          {categories?.map((cat) => (
            // TODO: 클릭 시 해당 카테고리명이 채팅 메시지로 입력되며 채팅 화면 이동
            <button
              key={cat.categoryId}
              type="button"
              className="flex flex-col items-center gap-2 rounded-xl border bg-background px-3 py-4 text-center shadow-sm transition-colors hover:bg-muted"
            >
              <span className="text-2xl" aria-hidden>
                {cat.emoji}
              </span>
              <span className="text-sm font-medium">#{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
