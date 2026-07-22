import { api } from "@/shared/api/client";
import type {
  SellerOrderPage,
  SellerOrderTab,
  SellerProductPage,
  SellerProductSort,
  SellerProductTab,
  SellerSummary,
  SellerSummaryParams,
} from "./types";

// 대시보드 전 블록을 한 번에 받는다. 파라미터는 전부 선택 —
// 생략 시 서버 기본값(기간=오늘, threshold=10, trendDays=7)이 적용된다.
export async function fetchSellerSummary(
  params: SellerSummaryParams = {},
): Promise<SellerSummary> {
  const { data } = await api.get<SellerSummary>("/api/seller/summary", {
    params,
  });
  return data;
}

// 주문 목록(주문 단위). page는 0-base. tab이 ALL이면 status를 보내지 않는다(생략=전체).
export async function fetchSellerOrders(params: {
  tab: SellerOrderTab;
  page: number;
  size?: number;
}): Promise<SellerOrderPage> {
  const { tab, page, size } = params;
  const { data } = await api.get<SellerOrderPage>("/api/seller/orders", {
    params: {
      ...(tab !== "ALL" && { status: tab }),
      page,
      ...(size && { size }),
    },
  });
  return data;
}

// 상품 목록. page는 0-base. tab이 ALL이면 status 미전송(생략=전체).
// sort는 latest 기본이라 생략 가능. (검색 q는 화면에서 제외 확정 — 2026-07-21)
export async function fetchSellerProducts(params: {
  tab: SellerProductTab;
  page: number;
  sort?: SellerProductSort;
  size?: number;
}): Promise<SellerProductPage> {
  const { tab, page, sort, size } = params;
  const { data } = await api.get<SellerProductPage>("/api/seller/products", {
    params: {
      ...(tab !== "ALL" && { status: tab }),
      page,
      ...(sort && { sort }),
      ...(size && { size }),
    },
  });
  return data;
}
