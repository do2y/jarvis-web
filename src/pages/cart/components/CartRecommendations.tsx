import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/shared/utils/formatPrice";
import { useCartRecommendations } from "../useCart";

export function CartRecommendations() {
  const { data: items } = useCartRecommendations();
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  // 추천 응답에는 평점·정가가 없어 시딩 계약(SeededProductCard)을 못 채운다.
  // 불완전 시딩은 상세 렌더를 깨뜨리므로 시딩 없이 이동만 한다(상세는 스켈레톤 표시).
  const goToDetail = (productId: number) => {
    navigate(`/products/${productId}`);
  };

  return (
    <section className="mt-6 rounded-sm border bg-background p-5 sm:p-6">
      <h2 className="text-base font-bold">함께 구매하면 좋은 상품</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.productId}
            type="button"
            onClick={() => goToDetail(item.productId)}
            aria-label={`${item.name} 상세 보기`}
            className="group flex flex-col text-left"
          >
            <div className="aspect-square overflow-hidden rounded-sm bg-muted">
              <img
                src={item.imageUrl}
                alt={item.name}
                loading="lazy"
                className="size-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{item.brand}</p>
            <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
            <p className="text-sm font-bold">{formatPrice(item.price)}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
