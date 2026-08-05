import { http } from "@/lib/http";
import type { CartResponse, Cart } from "@/types/cart";
import type { LoyaltyBalanceResponse } from "@/types/loyalty";

export const loyaltyService = {
  async getBalance(): Promise<number> {
    const { data } = await http.get<LoyaltyBalanceResponse>("/cart/loyalty/balance");
    if (data.status === "ERROR" || data.balance === undefined) {
      throw new Error(data.message ?? "Não foi possível carregar seu saldo de pontos");
    }
    return data.balance;
  },

  async redeem(cartId: string, points: number): Promise<{ cart: Cart; balance: number }> {
    const { data } = await http.post<CartResponse & { balance?: number }>(
      `/cart/carts/${cartId}/loyalty/redeem`,
      { points },
    );
    if (data.status === "ERROR" || !data.cart || data.balance === undefined) {
      throw new Error(data.message ?? "Não foi possível resgatar seus pontos");
    }
    return { cart: data.cart, balance: data.balance };
  },
};
