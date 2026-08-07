export type OrderStatus =
  | "CREATED"
  | "PAID"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "EXPIRED";

export interface OrderAddressSnapshot {
  label: string;
  recipient: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
}

export interface OrderPaymentSnapshot {
  methodType: "SAVED_CARD" | "NEW_CARD";
  savedCardId: string | null;
  brand: string;
  lastFour: string;
  holderName: string;
  expiry: string;
  installments: number;
  paidAt?: string | null;
}

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
  expiresAt?: string;
  originCity: string | null;
  destinationCity: string | null;
  shippingAddress?: OrderAddressSnapshot | null;
  payment?: OrderPaymentSnapshot | null;
}

export type PaymentMethodRequest =
  | {
      type: "SAVED_CARD";
      savedCardId: string;
    }
  | {
      type: "NEW_CARD";
      token: string;
      brand: string;
      lastFour: string;
      holderName: string;
      expiry: string;
      saveCard: boolean;
    };

export interface PayOrderInput {
  installments: number;
  paymentMethod: PaymentMethodRequest;
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
