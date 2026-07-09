import { api } from "@/shared/api/client";
import type { Category, PopularProduct } from "./types";

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<{ categories: Category[] }>("/api/categories");
  return data.categories;
}

export async function fetchPopularProducts(): Promise<PopularProduct[]> {
  const { data } = await api.get<{ products: PopularProduct[] }>(
    "/api/products/popular",
  );
  return data.products;
}
