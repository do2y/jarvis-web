// 찜은 상품 상세·챗봇 카드와 함께 쓰므로 shared/hooks로 승격됨.
// 마이페이지 호출부 호환을 위해 여기서 재export한다.
export { useWishlist } from "@/shared/hooks/useWishlist";

import { useToggleWishlist } from "@/shared/hooks/useWishlist";

// 찜 목록에서는 해제만 하므로 토글을 해제 전용으로 감싼다.
export function useRemoveWishlistItem() {
  const { toggle, isPending } = useToggleWishlist();
  return {
    mutate: (productId: number) => toggle(productId, true),
    isPending,
  };
}
