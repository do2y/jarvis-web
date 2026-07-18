import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { AppHeader } from "@/shared/ui/AppHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/shared/stores/authStore";
import type { CheckoutState } from "@/pages/checkout/types";
import { ImageGallery } from "./components/ImageGallery";
import { OptionSelector, type OptionSelection } from "./components/OptionSelector";
import { SpecTable } from "./components/SpecTable";
import { ReviewSummary } from "./components/ReviewSummary";
import { RecommendRow } from "./components/RecommendRow";
import { PLACEHOLDER_DETAIL } from "./placeholder";
import {
  useProductDetail,
  useProductReviews,
  useSeededProductCard,
} from "./useProduct";
import type { ReviewSort } from "./types";

function formatPrice(v: number): string {
  return `${v.toLocaleString("ko-KR")}원`;
}

export default function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const id = Number(productId);

  // OptionSelector의 최신 선택값을 담아두는 ref. 렌더 유발이 필요 없어 state 대신 ref 사용.
  const selectionRef = useRef<OptionSelection>({ option: null, quantity: 1 });

  // 상세 API가 정본. 도착 전에는 카드 시딩 데이터(캐시 승계)로 즉시 렌더한다.
  const { data: detail, isError } = useProductDetail(id);
  const { data: seeded } = useSeededProductCard(id);

  // 리뷰는 정렬만 전환(페이지네이션은 계약 확정 후). 첫 페이지 10개.
  const [reviewSort, setReviewSort] = useState<ReviewSort>("latest");
  const { data: reviewPage, isLoading: reviewsLoading } = useProductReviews(id, {
    sort: reviewSort,
  });

  // 상세·시딩 어느 쪽이든 렌더에 필요한 값만 뽑아 정규화(구조가 달라 여기서 흡수).
  const view = detail
    ? {
        name: detail.name,
        brandName: detail.brand.name,
        imageUrl: detail.imageUrl,
        price: detail.price,
        originalPrice: detail.originalPrice,
        rating: detail.rating.average,
        reviewCount: detail.rating.count,
      }
    : seeded
      ? {
          name: seeded.name,
          brandName: seeded.brandName,
          imageUrl: seeded.imageUrl,
          price: seeded.price,
          originalPrice: seeded.originalPrice,
          rating: seeded.rating,
          reviewCount: seeded.reviewCount,
        }
      : null;

  // 없는 상품(404 PRODUCT_NOT_FOUND) — 시딩 데이터도 없으면 안내 후 종료
  if (isError && !view) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 p-4 py-24 sm:p-6">
          <p className="text-sm text-muted-foreground">
            상품을 찾을 수 없어요.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            홈으로
          </Button>
        </main>
      </div>
    );
  }

  // 상세 로딩 중이고 시딩 데이터도 없으면(직접 URL 진입) 스켈레톤
  if (!view) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
          <div className="flex flex-col gap-8 lg:flex-row">
            <Skeleton className="aspect-square w-full rounded-sm lg:w-1/2" />
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-4 w-1/4 rounded-full" />
              <Skeleton className="h-7 w-3/4 rounded-full" />
              <Skeleton className="h-6 w-1/3 rounded-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const hasDiscount = view.originalPrice > view.price;
  const discountRate = hasDiscount
    ? Math.round((1 - view.price / view.originalPrice) * 100)
    : 0;

  // 리뷰 목록·연관 추천은 아직 계약 전(P-3, related OPEN)이라 플레이스홀더 유지.
  // 갤러리는 대표 이미지 단일(02 D14)이라 상세 이미지 1장만 사용.
  const d = PLACEHOLDER_DETAIL;
  const images = [view.imageUrl];

  // attributes({ "소재": "린넨" })를 스펙 표 행으로 변환. 상세 도착 전에는 빈 표.
  const specRows = detail
    ? Object.entries(detail.attributes).map(([label, value]) => ({
        label,
        value,
      }))
    : [];

  const user = useAuthStore.getState().user;

  const buyNow = () => {
    // 구매는 로그인 필요(CLAUDE.md). 게스트면 현재 상세로 복귀하도록 returnUrl 걸어 로그인 유도.
    // (state는 리다이렉트로 유실되므로 로그인 후 상세에서 다시 "바로 구매"하게 한다.)
    if (!user) {
      const returnUrl = encodeURIComponent(`/products/${id}`);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }
    const { option, quantity } = selectionRef.current;
    const state: CheckoutState = {
      items: [
        {
          product: {
            productId: id,
            name: view.name,
            brandName: view.brandName,
            // 옵션 추가금이 있으면 단가에 반영(주문 시 스냅샷되는 값과 일치시킴)
            price: view.price + (option?.extraPrice ?? 0),
            originalPrice: view.originalPrice,
            imageUrl: view.imageUrl,
          },
          optionName: option?.name ?? null,
          quantity,
        },
      ],
    };
    navigate("/checkout", { state });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-14 p-4 pb-20 sm:p-6">
        {/* 상단: 갤러리 | 정보·옵션 */}
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="lg:w-1/2">
            <ImageGallery images={images} alt={view.name} />
          </div>

          <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                {view.brandName}
              </p>
              <h1 className="text-xl font-bold leading-snug sm:text-2xl">
                {view.name}
              </h1>
              <div className="flex items-center gap-1.5 text-sm">
                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{view.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({view.reviewCount.toLocaleString("ko-KR")}개 리뷰)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <span className="text-2xl font-bold">
                {formatPrice(view.price)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-muted-foreground line-through">
                    {formatPrice(view.originalPrice)}
                  </span>
                  <span className="text-base font-bold text-red-500">
                    {discountRate}%
                  </span>
                </>
              )}
            </div>

            <OptionSelector
              // 상세 도착 전에는 옵션 목록을 알 수 없어 수량만 노출
              options={detail?.options ?? []}
              basePrice={view.price}
              onChange={(sel) => {
                selectionRef.current = sel;
              }}
            />

            {/* 액션 — 찜/장바구니/바로구매. TODO: 찜·장바구니 API·훅 연결 */}
            <div className="mt-2 flex items-center gap-3">
              <Button variant="outline" size="icon" aria-label="찜하기" className="size-11 shrink-0">
                <Heart className="size-5" />
              </Button>
              <Button variant="outline" className="h-11 flex-1">
                장바구니
              </Button>
              <Button className="h-11 flex-1" onClick={buyNow}>
                바로 구매
              </Button>
            </div>
          </div>
        </div>

        {specRows.length > 0 && <SpecTable rows={specRows} />}

        <ReviewSummary
          average={view.rating}
          // 총 개수·분포는 리뷰 API 집계를 우선 사용(상세의 rating.count와 동일 소스)
          total={reviewPage?.totalElements ?? view.reviewCount}
          distribution={
            reviewPage?.distribution ?? { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 }
          }
          reviews={reviewPage?.content ?? []}
          sort={reviewSort}
          onSortChange={setReviewSort}
          isLoading={reviewsLoading}
        />

        <RecommendRow
          title="함께 구매하면 좋아요"
          description="이 상품을 구매한 분들이 함께 구매한 아이템이에요."
          items={d.frequentlyBought}
        />

        <RecommendRow
          title="Jarvis 추천 대체 상품"
          description="비슷한 조건에서 다른 선택지를 찾고 계신다면요."
          items={d.alternatives}
          variant="reason"
        />

        {/* 브랜드 배너 */}
        <section className="flex items-center justify-between rounded-sm border bg-muted/30 p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {view.brandName.slice(0, 1)}
            </span>
            <div className="flex flex-col">
              <p className="text-sm font-bold">{view.brandName}</p>
              <p className="text-xs text-muted-foreground">
                컨템포러리 패션 브랜드
              </p>
            </div>
          </div>
          <Button variant="ghost" className="h-9">
            브랜드 홈
          </Button>
        </section>
      </main>
    </div>
  );
}
