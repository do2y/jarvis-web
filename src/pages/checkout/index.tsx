import { useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { AppHeader } from "@/shared/ui/AppHeader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Address, CheckoutState } from "./types";
import { PAYMENT_METHODS, PLACEHOLDER_ADDRESSES } from "./placeholder";
import { OrderItems } from "./components/OrderItems";
import { ShippingSection } from "./components/ShippingSection";
import { AddressFormModal } from "./components/AddressFormModal";
import { PaymentSection } from "./components/PaymentSection";
import { OrderSummary } from "./components/OrderSummary";

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  // 상세 "바로 구매"에서 넘어온 주문 항목. 직접 진입/새로고침 시 없음.
  const state = location.state as CheckoutState | null;
  const items = useMemo(() => state?.items ?? [], [state]);

  const defaultAddressId =
    PLACEHOLDER_ADDRESSES.find((a) => a.isDefault)?.id ??
    PLACEHOLDER_ADDRESSES[0]?.id ??
    "";
  // 배송지 목록은 로컬 소유(추가분 반영). 계약 후 배송지 조회 API로 대체.
  const [addresses, setAddresses] = useState<Address[]>(PLACEHOLDER_ADDRESSES);
  const [addressId, setAddressId] = useState(defaultAddressId);
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [agreed, setAgreed] = useState(false);

  // 새 배송지 임시 id 카운터 — 서버 id 부여 전 로컬 구분용.
  const nextIdRef = useRef(1);

  const handleAddAddress = (addr: Omit<Address, "id">) => {
    const id = `new-${nextIdRef.current++}`;
    setAddresses((prev) => [...prev, { ...addr, id }]);
    setAddressId(id); // 방금 추가한 배송지를 선택
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

  // 결제대행 계약 전 — 실제 결제는 목. 동의 시에만 활성화.
  const handleSubmit = () => {
    // TODO: 주문 생성 API 연결 후 주문 완료 화면으로 이동.
    navigate("/");
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
              onSelect={setAddressId}
              onAddClick={() => setAddrModalOpen(true)}
            />
            <PaymentSection method={method} onMethodChange={setMethod} />

            {/* 동의 */}
            <section className="rounded-xl border bg-background p-5 sm:p-6">
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
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </main>

      <AddressFormModal
        open={addrModalOpen}
        onOpenChange={setAddrModalOpen}
        onSubmit={handleAddAddress}
      />
    </div>
  );
}
