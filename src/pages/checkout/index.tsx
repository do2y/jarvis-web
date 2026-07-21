import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { track } from "@/shared/analytics/track";
import { AppHeader } from "@/shared/ui/AppHeader";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/lib/utils";
import type { Address, AddressInput } from "@/shared/types/address";
import type {
  CheckoutState,
  CreateOrderRequest,
  OrderCompleteState,
  PaymentMethod,
} from "./types";
import { PAYMENT_METHODS } from "./placeholder";
import { useCreateOrder, useRetryPayment } from "./useCreateOrder";
import {
  useAddresses,
  useAddressMutations,
} from "@/shared/hooks/useAddresses";
import { OrderItems } from "./components/OrderItems";
import { ShippingSection } from "./components/ShippingSection";
import { AddressFormModal } from "@/shared/address/AddressFormModal";
import { PaymentSection } from "./components/PaymentSection";
import { OrderSummary } from "./components/OrderSummary";

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  // 상세 "바로 구매"에서 넘어온 주문 항목. 직접 진입/새로고침 시 없음.
  const state = location.state as CheckoutState | null;
  const items = useMemo(() => state?.items ?? [], [state]);

  const { data: addresses = [] } = useAddresses();
  const { add: createAddress, update: updateAddress } = useAddressMutations();

  // 선택된 배송지. null이면 기본 배송지(없으면 첫 항목)를 따른다 —
  // 목록 로딩 전에는 값을 정할 수 없어 사용자가 고르기 전까지 파생값을 쓴다.
  const [pickedId, setPickedId] = useState<number | null>(null);
  const addressId =
    pickedId ??
    addresses.find((a) => a.isDefault)?.addressId ??
    addresses[0]?.addressId ??
    null;
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  // 수정 대상. null이면 추가 모드.
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);
  // 배송 요청사항 — 주문 1회성이라 배송지가 아니라 주문 body로 보낸다.
  const [deliveryRequest, setDeliveryRequest] = useState("");
  const [method, setMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0].value);
  const [agreed, setAgreed] = useState(false);

  // 결제 실패(PAYMENT_FAILED)는 HTTP 200이라 mutation 에러가 아니다.
  // 요청 자체가 거부된 경우와 구분해 따로 안내한다.
  const [paymentFailed, setPaymentFailed] = useState(false);
  // 결제만 실패한 주문(PAYMENT_FAILED)의 id. 주문 자체는 서버에 남아 있으므로
  // 다시 시도할 때는 새 주문을 만들지 않고 이 주문의 결제만 재시도한다.
  const [failedOrderId, setFailedOrderId] = useState<number | null>(null);
  const createOrder = useCreateOrder();
  const retryPayment = useRetryPayment();

  // 추가·수정 겸용 — editingAddr 유무로 분기. 성공했을 때만 닫는다(실패 시 입력값 보존).
  const handleSubmitAddress = async (addr: AddressInput) => {
    try {
      if (editingAddr) {
        await updateAddress.mutateAsync({
          addressId: editingAddr.addressId,
          input: addr,
        });
      } else {
        const { addressId: newId } = await createAddress.mutateAsync(addr);
        setPickedId(newId); // 방금 추가한 배송지를 선택
      }
      setAddrModalOpen(false);
      setEditingAddr(null);
    } catch {
      // 실패 사유는 errorMessage로 모달에 노출된다
    }
  };

  const openAddAddress = () => {
    setEditingAddr(null);
    setAddrModalOpen(true);
  };

  const openEditAddress = (addr: Address) => {
    setEditingAddr(addr);
    setAddrModalOpen(true);
  };

  const { itemsTotal, discount } = useMemo(() => {
    const total = items.reduce(
      (sum, it) => sum + it.product.originalPrice * it.quantity,
      0,
    );
    const paid = items.reduce(
      (sum, it) => sum + it.product.price * it.quantity,
      0,
    );
    return { itemsTotal: total, discount: total - paid };
  }, [items]);

  // 주문서 진입 이벤트. 아래 조기 반환보다 위에 둬야 훅 순서가 깨지지 않는다.
  // 빈 주문서(직접 진입)는 결제 시작이 아니므로 제외한다.
  useEffect(() => {
    if (items.length === 0) return;
    track("checkout_start", {
      properties: {
        itemCount: items.length,
        amount: itemsTotal - discount,
      },
    });
    // 금액은 items에서 파생되므로 items 변경 시에만 재전송한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // 주문 항목 없이 진입 — 상세에서 다시 들어오도록 안내.
  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-lg font-semibold">주문할 상품이 없어요</p>
          <p className="text-sm text-muted-foreground">
            상품 상세 페이지에서 &lsquo;바로 구매&rsquo;를 눌러 주문을 시작해주세요.
          </p>
          <Link
            to="/"
            className={cn(buttonVariants(), "mt-2 h-11 rounded-full px-6")}
          >
            홈으로
          </Link>
        </main>
      </div>
    );
  }

  // 결제 성공 경로가 신규 주문·재결제 두 갈래라 양쪽에서 부른다
  // (한쪽만 넣으면 재결제로 성사된 주문이 집계에서 빠진다).
  const trackPurchase = (orderId: number) => {
    track("purchase_complete", {
      properties: {
        orderId,
        amount: itemsTotal - discount,
        itemCount: items.length,
        method,
      },
    });
  };

  const handleSubmit = async () => {
    const address = addresses.find((a) => a.addressId === addressId);
    if (!address || createOrder.isPending || retryPayment.isPending) return;

    setPaymentFailed(false);

    // 이미 만들어진 주문의 결제만 실패한 경우 — 새 주문을 만들면 실패 주문이 쌓이므로
    // 결제 수단만 바꿔 이 주문을 다시 결제한다.
    if (failedOrderId !== null) {
      try {
        const retried = await retryPayment.mutateAsync({
          orderId: failedOrderId,
          paymentMethod: method,
        });
        if (retried.status === "PAYMENT_FAILED") {
          setPaymentFailed(true);
          return;
        }
        trackPurchase(retried.orderId);
        navigate("/checkout/complete", {
          state: {
            order: {
              orderId: retried.orderId,
              orderNo: retried.orderNo,
              items,
              address,
              method,
              itemsTotal,
              discount,
              finalTotal: itemsTotal - discount,
            },
          },
          replace: true,
        });
      } catch {
        // 요청 거부(상태 전이 불가 등)는 retryPayment.errorMessage로 안내된다
      }
      return;
    }

    // 라인아이템 출처는 정확히 하나만 보낸다(둘 다 보내면 400).
    // 장바구니에서 넘어온 항목은 cartItemId를 갖고, 상세 "바로 구매"는 없다.
    const cartItemIds = items
      .map((it) => it.cartItemId)
      .filter((id): id is number => id != null);
    const fromCart = cartItemIds.length === items.length && items.length > 0;

    const body: CreateOrderRequest = {
      ...(fromCart
        ? { cartItemIds }
        : {
            items: items.map((it) => ({
              productId: it.product.productId,
              ...(it.optionId != null ? { optionId: it.optionId } : {}),
              quantity: it.quantity,
            })),
          }),
      // 배송지는 서버 목록에서만 고르므로 항상 addressId로 보낸다
      // (addressId와 address를 함께 보내면 400).
      addressId: address.addressId,
      // 빈 값은 보내지 않는다(선택 항목)
      ...(deliveryRequest.trim()
        ? { deliveryRequest: deliveryRequest.trim() }
        : {}),
      paymentMethod: method,
    };

    try {
      const result = await createOrder.mutateAsync(body);

      // 결제 실패도 200 — status로 구분한다. 자동 재시도하지 않고 안내만.
      if (result.status === "PAYMENT_FAILED") {
        setPaymentFailed(true);
        setFailedOrderId(result.orderId);
        return;
      }

      trackPurchase(result.orderId);

      const order: OrderCompleteState["order"] = {
        orderId: result.orderId,
        orderNo: result.orderNo,
        items,
        address,
        method,
        itemsTotal,
        discount,
        finalTotal: itemsTotal - discount,
      };

      // replace로 이동 — 뒤로가기로 결제 화면에 돌아와 중복 결제하는 것을 막는다.
      navigate("/checkout/complete", { state: { order }, replace: true });
    } catch {
      // 요청 거부(검증·권한 등)는 createOrder.errorMessage로 안내된다.
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl p-4 pb-20 sm:p-6">
        <h1 className="text-2xl font-bold sm:text-3xl">결제</h1>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          {/* 좌: 주문 정보 입력 */}
          <div className="flex flex-1 flex-col gap-6">
            <OrderItems items={items} />
            <ShippingSection
              addresses={addresses}
              selectedId={addressId}
              onSelect={setPickedId}
              onAddClick={openAddAddress}
              onEditClick={openEditAddress}
              deliveryRequest={deliveryRequest}
              onDeliveryRequestChange={setDeliveryRequest}
            />
            <PaymentSection
              method={method}
              onMethodChange={(m) => {
                setMethod(m);
                setPaymentFailed(false); // 수단 변경 시 이전 실패 안내 제거
                createOrder.reset();
              }}
            />

            {/* 동의 */}
            <section className="rounded-sm border bg-background p-5 sm:p-6">
              <button
                type="button"
                onClick={() => setAgreed((v) => !v)}
                className="flex w-full items-start gap-3 text-left"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                    agreed ? "border-primary bg-primary" : "border-input",
                  )}
                >
                  {agreed && (
                    <Check className="size-3 text-primary-foreground" />
                  )}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    주문 내용을 확인했으며, 결제에 동의합니다
                  </span>
                  <span className="text-xs text-muted-foreground">
                    개인정보 제3자 제공, 결제대행 서비스 이용약관에 동의합니다.
                  </span>
                </span>
              </button>
            </section>
          </div>

          {/* 우: 결제 금액 요약 */}
          <div className="lg:w-80 lg:shrink-0">
            <OrderSummary
              itemsTotal={itemsTotal}
              discount={discount}
              canSubmit={agreed}
              paying={createOrder.isPending || retryPayment.isPending}
              // 결제 승인 실패와 요청 거부를 각각 안내
              error={
                paymentFailed
                  ? "결제에 실패했어요. 결제 수단을 확인한 뒤 다시 시도해주세요."
                  : createOrder.errorMessage
              }
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </main>

      <AddressFormModal
        open={addrModalOpen}
        onOpenChange={(next) => {
          setAddrModalOpen(next);
          if (!next) {
            // 닫을 때 이전 실패 안내·수정 대상 제거
            createAddress.reset();
            updateAddress.reset();
            setEditingAddr(null);
          }
        }}
        editing={editingAddr}
        onSubmit={handleSubmitAddress}
        submitting={createAddress.isPending || updateAddress.isPending}
        error={createAddress.errorMessage ?? updateAddress.errorMessage}
      />
    </div>
  );
}
