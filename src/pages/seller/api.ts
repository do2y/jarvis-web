import { api } from "@/shared/api/client";
import type { SellerMetric, SellerProductStat } from "@/shared/types/chat";
import type {
  SellerDashboard,
  SellerOrder,
  SellerOrderPage,
  SellerOrderStatus,
  SellerProduct,
  SellerProductPage,
  SellerProductTab,
} from "./types";

interface SellerSummaryWire {
  to: string;
  sales: number;
  orderCount: number;
  salesCount: number;
}

interface SellerOrderWire {
  orderItemId: number;
  orderId: number;
  orderNo: string;
  orderedAt: string;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  status: string;
}

interface SellerProductWire {
  productId: number;
  name: string;
  price: number;
  originalPrice: number;
  stockQuantity: number;
  status: "ON_SALE" | "SOLD_OUT" | "HIDDEN";
  displayedSalesCount: number;
  category: string;
  imageUrl: string;
  updatedAt: string;
}

interface PageWire<T> {
  content: T[];
  totalPages: number;
}

const PAGE_SIZE = 10;

function toOrderStatus(status: string): SellerOrderStatus {
  if (status === "PENDING" || status === "ORDERED") return "NEW";
  if (status === "SHIPPING") return "SHIPPING";
  if (status === "DELIVERED" || status === "CONFIRMED") return "DELIVERED";
  if (status.includes("CANCEL") || status.includes("RETURN")) return "CLAIM";
  return "PREPARING";
}

async function fetchAllOrders(): Promise<SellerOrderWire[]> {
  const { data } = await api.get<PageWire<SellerOrderWire>>("/api/seller/orders", {
    params: { page: 0, size: 50 },
  });
  return data.content;
}

async function fetchAllProducts(): Promise<SellerProductWire[]> {
  const { data } = await api.get<PageWire<SellerProductWire>>("/api/seller/products", {
    params: { page: 0, size: 50 },
  });
  return data.content;
}

function toProduct(product: SellerProductWire): SellerProduct {
  return {
    productId: product.productId,
    name: product.name,
    imageUrl: product.imageUrl,
    code: `P-${product.productId}`,
    price: product.price,
    stock: product.stockQuantity,
    salesCount: product.displayedSalesCount,
    status: product.status,
    categoryName: product.category,
    createdAt: product.updatedAt.slice(0, 10),
  };
}

export async function fetchSellerDashboard(): Promise<SellerDashboard> {
  const [{ data: summary }, orders, productWires] = await Promise.all([
    api.get<SellerSummaryWire>("/api/seller/summary"),
    fetchAllOrders(),
    fetchAllProducts(),
  ]);
  const products = productWires.map(toProduct);
  const statusCounts = orders.reduce<Record<SellerOrderStatus, number>>(
    (counts, order) => {
      counts[toOrderStatus(order.status)] += 1;
      return counts;
    },
    { NEW: 0, PREPARING: 0, SHIPPING: 0, DELIVERED: 0, CLAIM: 0 },
  );
  const orderSummaries = [
    { status: "NEW" as const, label: "새 주문", caption: "확인 필요", primary: true },
    { status: "PREPARING" as const, label: "상품 준비", caption: "출고 준비" },
    { status: "SHIPPING" as const, label: "배송 중", caption: "배송 진행" },
    { status: "CLAIM" as const, label: "취소·반품", caption: "처리 필요" },
  ].map((item) => ({ ...item, count: statusCounts[item.status] }));
  const metrics: SellerMetric[] = [
    { key: "revenue", label: "기간 매출", value: summary.sales, unit: "KRW" },
    { key: "orders", label: "주문", value: summary.orderCount, unit: "COUNT" },
    { key: "sales", label: "판매 수량", value: summary.salesCount, unit: "COUNT" },
    { key: "products", label: "등록 상품", value: products.length, unit: "COUNT" },
  ];
  const lowStock: SellerProductStat[] = products.filter((product) => product.stock <= 10);

  return {
    todo: {
      totalCount: orderSummaries.reduce((sum, item) => sum + item.count, 0),
      orderSummaries,
      lowStock,
    },
    metrics,
    revenueTrend: [{ x: summary.to, y: summary.sales }],
    aiRevenue: { amount: 0, deltaRate: 0, contributionRate: 0 },
  };
}

export async function fetchSellerOrders(params: {
  status: SellerOrderStatus | "ALL";
  page: number;
}): Promise<SellerOrderPage> {
  const [rows, products] = await Promise.all([fetchAllOrders(), fetchAllProducts()]);
  const imageByProduct = new Map(products.map((product) => [product.productId, product.imageUrl]));
  const orders: SellerOrder[] = rows.map((row) => ({
    orderId: row.orderNo,
    productName: row.productName,
    productImageUrl: imageByProduct.get(row.productId) ?? "",
    extraItemCount: 0,
    ordererName: "구매자",
    amount: row.price * row.quantity,
    payMethod: "-",
    orderedAt: row.orderedAt,
    status: toOrderStatus(row.status),
  }));
  const counts = orders.reduce<Record<SellerOrderStatus | "ALL", number>>(
    (result, order) => {
      result.ALL += 1;
      result[order.status] += 1;
      return result;
    },
    { ALL: 0, NEW: 0, PREPARING: 0, SHIPPING: 0, DELIVERED: 0, CLAIM: 0 },
  );
  const filtered = params.status === "ALL" ? orders : orders.filter((order) => order.status === params.status);
  const start = (params.page - 1) * PAGE_SIZE;
  return {
    orders: filtered.slice(start, start + PAGE_SIZE),
    page: params.page,
    totalPages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    counts,
  };
}

export async function fetchSellerProducts(params: {
  tab: SellerProductTab;
  page: number;
}): Promise<SellerProductPage> {
  const products = (await fetchAllProducts()).map(toProduct);
  const counts = products.reduce<Record<SellerProductTab, number>>(
    (result, product) => {
      result.ALL += 1;
      result[product.status] += 1;
      return result;
    },
    { ALL: 0, ON_SALE: 0, SOLD_OUT: 0, HIDDEN: 0 },
  );
  const filtered = params.tab === "ALL" ? products : products.filter((product) => product.status === params.tab);
  const start = (params.page - 1) * PAGE_SIZE;
  return {
    products: filtered.slice(start, start + PAGE_SIZE),
    page: params.page,
    totalPages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    counts,
  };
}
