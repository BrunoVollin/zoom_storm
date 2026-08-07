import { http } from "@/lib/http";
import type { Order, OrderListResponse, OrderResponse, PayOrderInput } from "@/types/order";

export const orderService = {
  async list(): Promise<Order[]> {
    const { data } = await http.get<OrderListResponse>("/cart/orders");
    if (data.status === "ERROR") {
      throw new Error(data.message ?? "Não foi possível carregar seus pedidos");
    }
    return data.orders ?? [];
  },

  async getById(orderId: string): Promise<Order> {
    const { data } = await http.get<OrderResponse>(`/cart/orders/${orderId}`);
    if (data.status === "ERROR" || !data.order) {
      throw new Error(data.message ?? "Pedido não encontrado");
    }
    return data.order;
  },

  async pay(orderId: string, input: PayOrderInput, idempotencyKey: string): Promise<Order> {
    const { data } = await http.post<OrderResponse>(`/cart/orders/${orderId}/pay`, input, {
      headers: { "Idempotency-Key": idempotencyKey },
    });
    if (data.status === "ERROR" || !data.order) {
      throw new Error(data.message ?? "Não foi possível processar o pagamento");
    }
    return data.order;
  },
};
