import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "../utils/formatPrice";
import { useCartRecommendations } from "../useCart";

export function CartRecommendations() {
  const { data: items } = useCartRecommendations();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!items || items.length === 0) return null;

  const goToDetail = (productId: number, seed: (typeof items)[number]) => {
    // 캐시 승계: 카드 데이터를 상세 캐시에 부분 시딩 → 부족분은 상세 API가 채움.
    queryClient.setQueryData(["products", productId], {
      productId,
      name: seed.name,
      brandName: seed.brand,
      price: seed.price,
      imageUrl: seed.imageUrl,
    });
    navigate(`/products/${productId}`);
  };

  return (
    <section className="mt-6 rounded-xl border bg-background p-5 sm:p-6">
      <h2 className="text-base font-bold">함께 구매하면 좋은 상품</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.productId}
            type="button"
            onClick={() => goToDetail(item.productId, item)}
            aria-label={`${item.name} 상세 보기`}
            className="group flex flex-col text-left"
          >
            <div className="aspect-square overflow-hidden rounded-xl bg-muted">
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
