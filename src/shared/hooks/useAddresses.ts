import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  updateAddress,
} from "@/shared/api/address";
import { ApiError } from "@/shared/api/client";
import { useAuthStore } from "@/shared/stores/authStore";
import type {
  Address,
  AddressInput,
  AddressPatch,
} from "@/shared/types/address";

// 배송지 — 결제(주문서)·마이페이지가 같은 /api/addresses를 쓰므로 shared에 둔다.
// 예전에는 페이지별 키(["addresses","checkout",userId] / ["addresses","mypage"])로
// 같은 자원을 이중 캐시했으나, 단일 키로 합쳐 접두 무효화 우회를 없앴다.
// (사용자 전환 시 캐시 격리는 useLogout의 queryClient.clear()가 담당)
// 로그인 필요 자원이라 게스트는 401 — enabled로 호출 자체를 막는다.
// 추가/수정/삭제 직후 반영돼야 하므로 staleTime 0.
export function useAddresses() {
  const isAuthed = useAuthStore((s) => s.accessToken !== null);

  return useQuery({
    queryKey: ["addresses"],
    queryFn: fetchAddresses,
    enabled: isAuthed,
    staleTime: 0,
  });
}

// 배송지 변경 실패 메시지 — 서버가 사유를 구체적으로 주므로 그대로 노출하고,
// 삭제 제약(유일한 배송지)·이미 삭제됨만 따로 문구를 맞춘다.
function toAddressErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "ADDRESS_LAST_UNDELETABLE")
      return "배송지가 1개일 때는 삭제할 수 없어요.";
    if (error.code === "ADDRESS_NOT_FOUND") return "이미 삭제된 배송지예요.";
    if (error.displayMessage) return error.displayMessage;
  }
  return "배송지를 저장하지 못했어요. 잠시 후 다시 시도해주세요.";
}

// 뮤테이션 결과에 사용자 안내 문구를 얹는다. 호출부는 mutation API 그대로 쓰면 된다.
function withErrorMessage<TData, TVariables>(
  mutation: UseMutationResult<TData, unknown, TVariables>,
) {
  return {
    ...mutation,
    errorMessage: mutation.error ? toAddressErrorMessage(mutation.error) : null,
  };
}

// 배송지 변경 뮤테이션 — 성공 시 목록 무효화로 재동기화. 자동 재시도 없음.
// 마이페이지에서 고치면 주문서에도 즉시 반영된다(같은 ["addresses"] 캐시).
export function useAddressMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["addresses"] });

  const add = useMutation<Address, unknown, AddressInput>({
    mutationFn: createAddress,
    retry: false,
    // 기본 배송지 지정 시 다른 항목의 isDefault도 서버에서 바뀌므로 목록 전체를 갱신
    onSuccess: invalidate,
  });

  const update = useMutation<
    Address,
    unknown,
    { addressId: number; input: AddressPatch }
  >({
    mutationFn: (args) => updateAddress(args.addressId, args.input),
    retry: false,
    onSuccess: invalidate,
  });

  const remove = useMutation<void, unknown, number>({
    mutationFn: (addressId) => deleteAddress(addressId),
    retry: false,
    onSuccess: invalidate,
  });

  // 기본 배송지 지정은 별도 API가 없다 — 수정 API에 isDefault만 부분 전송한다.
  // 기존 기본은 서버가 같은 트랜잭션에서 해제.
  const setDefault = useMutation<Address, unknown, number>({
    mutationFn: (addressId) => updateAddress(addressId, { isDefault: true }),
    retry: false,
    onSuccess: invalidate,
  });

  return {
    add: withErrorMessage(add),
    update: withErrorMessage(update),
    remove: withErrorMessage(remove),
    setDefault: withErrorMessage(setDefault),
  };
}
