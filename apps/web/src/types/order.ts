export type OrderStatus = "CREATED" | "PAID" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  cartId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  createdAt: string;
  originCity: string | null;
  destinationCity: string | null;
}

export interface OrderResponse {
  status: "SUCCESS" | "ERROR";
  order?: Order;
  message?: string;
}

export interface OrderListResponse {
  status: "SUCCESS" | "ERROR";
  orders?: Order[];
  message?: string;
}
