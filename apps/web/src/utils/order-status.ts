import type { OrderStatus } from "@/types/order";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  CREATED: "Order confirmed",
  PAID: "Payment approved",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
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
