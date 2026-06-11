import { http } from "@/lib/http";
import type { Cart, CartResponse, ShippingResponse } from "@/types/cart";

interface CreateCartInput {
  userId: string;
  products?: { id: string; quantity: number }[];
}

interface ProductQuantity {
  id: string;
  quantity: number;
}

/**
 * Encapsulates every cart HTTP call. Hooks and components depend on this
 * module, never on axios or the BFF response envelope, so the
 * `{ status, cart, message }` shape is unwrapped here in one place.
 */
export const cartService = {
  async create(input: CreateCartInput): Promise<Cart> {
    return unwrap(await http.post<CartResponse>("/cart/carts", input));
  },

  async getById(cartId: string): Promise<Cart> {
    return unwrap(await http.get<CartResponse>(`/cart/carts/${cartId}`));
  },

  async addItems(cartId: string, products: ProductQuantity[]): Promise<Cart> {
    return unwrap(await http.post<CartResponse>(`/cart/carts/${cartId}/items`, { products }));
  },

  async updateItemQuantity(cartId: string, itemId: string, quantity: number): Promise<Cart> {
    return unwrap(
      await http.patch<CartResponse>(`/cart/carts/${cartId}/items/${itemId}`, { quantity }),
    );
  },

  async removeItem(cartId: string, itemId: string): Promise<Cart> {
    return unwrap(await http.delete<CartResponse>(`/cart/carts/${cartId}/items/${itemId}`));
  },

  async applyCoupon(cartId: string, couponId: string): Promise<Cart> {
    return unwrap(await http.post<CartResponse>(`/cart/carts/${cartId}/coupons`, { couponId }));
  },

  async removeCoupon(cartId: string, couponId: string): Promise<Cart> {
    return unwrap(await http.delete<CartResponse>(`/cart/carts/${cartId}/coupons/${couponId}`));
  },

  async estimateShipping(cartId: string, distance: number): Promise<number> {
    const { data } = await http.get<ShippingResponse>(`/cart/carts/${cartId}/shipping`, {
      params: { distance },
    });
    if (data.status === "ERROR" || data.cost === undefined) {
      throw new Error(data.message ?? "Não foi possível calcular o frete");
    }
    return data.cost;
  },

  async checkout(cartId: string, shipping: number): Promise<Cart> {
    return unwrap(await http.post<CartResponse>(`/cart/carts/${cartId}/checkout`, { shipping }));
  },
};

function unwrap({ data }: { data: CartResponse }): Cart {
  if (data.status === "ERROR" || !data.cart) {
    throw new Error(data.message ?? "Não foi possível processar o carrinho");
  }
  return data.cart;
}
