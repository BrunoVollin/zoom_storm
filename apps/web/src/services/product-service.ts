import { http } from "@/lib/http";
import type { Product, ProductFilters, ProductWriteInput } from "@/types/product";

/**
 * Only place in the app allowed to know the products endpoint shape.
 * Mirrors the `Product` entity already used inside cart-service while the
 * dedicated catalog endpoints in products-service are still being built.
 */
export const productService = {
  async list(filters: ProductFilters = {}): Promise<Product[]> {
    const { data } = await http.get<{ products: Product[] }>("/products", {
      params: filters,
    });
    return data.products;
  },

  async getById(id: string): Promise<Product> {
    const { data } = await http.get<{ product: Product }>(`/products/${id}`);
    return data.product;
  },

  async create(input: ProductWriteInput): Promise<Product> {
    const { data } = await http.post<{ product: Product }>("/products", input);
    return data.product;
  },

  async update(id: string, input: ProductWriteInput): Promise<Product> {
    const { data } = await http.put<{ product: Product }>(`/products/${id}`, input);
    return data.product;
  },

  async listCategories(): Promise<string[]> {
    const { data } = await http.get<{ categories: string[] }>("/products/categories");
    return data.categories;
  },

  async remove(id: string): Promise<void> {
    await http.delete(`/products/${id}`);
  },
};
