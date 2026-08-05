import type { OrderStatus } from "@/types/order";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  CREATED: "Pedido confirmado",
  PAID: "Pagamento aprovado",
  IN_TRANSIT: "Em trânsito",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  DELIVERED: "Entregue",
};

const STATUS_ORDER: OrderStatus[] = [
  "CREATED",
  "PAID",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export interface TrackingStep {
  status: OrderStatus;
  label: string;
  reached: boolean;
  current: boolean;
}

/** Builds the full 5-step timeline for the order tracking UI, marking which
 * steps have already been reached given the order's current status. */
export function buildTrackingSteps(currentStatus: OrderStatus): TrackingStep[] {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return STATUS_ORDER.map((status, index) => ({
    status,
    label: ORDER_STATUS_LABEL[status],
    reached: index <= currentIndex,
    current: index === currentIndex,
  }));
}
