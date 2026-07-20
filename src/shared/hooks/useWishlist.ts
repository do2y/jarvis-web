import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  addWishlistItem,
  fetchWishlist,
  removeWishlistItem,
} from "@/shared/api/wishlist";
import { ApiError } from "@/shared/api/client";
import { useAuthStore } from "@/shared/stores/authStore";
import type { WishlistProduct } from "@/shared/types/wishlist";

// 찜한 상품 — 서버 원본. 찜 추가·해제로 자주 바뀌어 staleTime 0.
// 게스트는 401이라 아예 호출하지 않는다(찜은 로그인 필요).
export function useWishlist() {
  const isAuthed = useAuthStore((s) => s.accessToken !== null);

  return useQuery({
    queryKey: ["wishlist"],
    queryFn: fetchWishlist,
    staleTime: 0,
    enabled: isAuthed,
  });
}

// 특정 상품이 찜 상태인지 — 목록에서 파생한다.
// 별도 조회 API가 없어 목록을 기준으로 삼는다(목록이 없으면 false).
export function useIsWished(productId: number): boolean {
  const { data } = useWishlist();
  return !!data?.some((p) => p.productId === productId);
}

// 찜 추가·해제 토글.
// 게스트가 누르면 로그인으로 보낸다(returnUrl로 복귀).
// 낙관적 업데이트 — 하트가 즉시 반응해야 하므로. 실패 시 롤백.
export function useToggleWishlist() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isAuthed = useAuthStore((s) => s.accessToken !== null);

  const mutation = useMutation({
    mutationFn: ({ productId, wished }: { productId: number; wished: boolean }) =>
      wished ? removeWishlistItem(productId) : addWishlistItem(productId),

    onMutate: async ({ productId, wished }) => {
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });
      const previous = queryClient.getQueryData<WishlistProduct[]>(["wishlist"]);
      // 해제는 목록에서 제거. 추가는 카드 데이터를 모를 수 있어 목록을 건드리지 않고
      // onSettled의 재조회에 맡긴다(하트 상태는 서버 응답 후 확정).
      if (wished) {
        queryClient.setQueryData<WishlistProduct[]>(["wishlist"], (old) =>
          old?.filter((p) => p.productId !== productId),
        );
      }
      return { previous };
    },

    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["wishlist"], context.previous);
      }
      // 이미 찜함(409)·이미 해제됨(404)은 사용자 입장에선 실패가 아니다.
      // 원하는 상태에 이미 도달해 있으므로 롤백을 되돌리고 서버 기준으로 맞춘다.
      // (onSettled가 어차피 재조회하지만, 롤백된 하트가 잠깐 보이는 것을 막는다)
      if (
        error instanceof ApiError &&
        (error.code === "WISHLIST_DUPLICATE" || error.status === 404)
      ) {
        queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const toggle = (productId: number, wished: boolean) => {
    if (!isAuthed) {
      const returnUrl = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }
    mutation.mutate({ productId, wished });
  };

  return { toggle, isPending: mutation.isPending };
}