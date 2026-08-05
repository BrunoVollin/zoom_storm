import { http } from "@/lib/http";
import type {
  Cart,
  CartResponse,
  CheckoutResponse,
  ShippingEstimate,
  ShippingResponse,
} from "@/types/cart";
import type { Order } from "@/types/order";

interface CreateCartInput {
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

  async estimateShipping(cartId: string, cep: string): Promise<ShippingEstimate> {
    const { data } = await http.get<ShippingResponse>(`/cart/carts/${cartId}/shipping`, {
      params: { cep },
    });
    if (
      data.status === "ERROR" ||
      data.shipping === undefined ||
      data.estimatedDays === undefined ||
      !data.city ||
      !data.state
    ) {
      throw new Error(data.message ?? "Não foi possível calcular o frete");
    }
    return {
      shipping: data.shipping,
      estimatedDays: data.estimatedDays,
      city: data.city,
      state: data.state,
    };
  },

  async checkout(cartId: string, shipping: number, cep?: string): Promise<{ cart: Cart; order: Order }> {
    const { data } = await http.post<CheckoutResponse>(`/cart/carts/${cartId}/checkout`, {
      shipping,
      cep,
    });
    if (data.status === "ERROR" || !data.cart || !data.order) {
      throw new Error(data.message ?? "Não foi possível finalizar a compra");
    }
    return { cart: data.cart, order: data.order };
  },
};

function unwrap({ data }: { data: CartResponse }): Cart {
  if (data.status === "ERROR" || !data.cart) {
    throw new Error(data.message ?? "Não foi possível processar o carrinho");
  }
  return data.cart;
}
