import { http } from "@/lib/http";
import type { WishlistItem, WishlistItemResponse, WishlistListResponse } from "@/types/wishlist";

/**
 * Encapsulates every wishlist HTTP call, unwrapping the `{ status, ... }`
 * envelope in one place — mirrors `cart-service.ts`.
 */
export const wishlistService = {
  async list(): Promise<WishlistItem[]> {
    const { data } = await http.get<WishlistListResponse>("/cart/wishlist");
    if (data.status === "ERROR") {
      throw new Error(data.message ?? "Não foi possível carregar seus favoritos");
    }
    return data.items ?? [];
  },

  async add(productId: string): Promise<WishlistItem> {
    const { data } = await http.post<WishlistItemResponse>("/cart/wishlist", { productId });
    if (data.status === "ERROR" || !data.item) {
      throw new Error(data.message ?? "Não foi possível favoritar o produto");
    }
    return data.item;
  },

  async remove(productId: string): Promise<void> {
    await http.delete(`/cart/wishlist/${productId}`);
  },
};
