import { http } from "@/lib/http";
import type { Product } from "@/types/product";

/**
 * Only place in the app allowed to know the products endpoint shape.
 * Mirrors the `Product` entity already used inside cart-service while the
 * dedicated catalog endpoints in products-service are still being built.
 */
export const productService = {
  async list(): Promise<Product[]> {
    const { data } = await http.get<Product[]>("/products");
    return data;
  },

  async getById(id: string): Promise<Product> {
    const { data } = await http.get<Product>(`/products/${id}`);
    return data;
  },
};
