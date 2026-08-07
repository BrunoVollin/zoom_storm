"use client";

import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/services/order-service";
import { queryKeys } from "@/constants/query-keys";
import type { PayOrderInput } from "@/types/order";

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders.all,
    queryFn: () => orderService.list(),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => orderService.getById(id),
    enabled: Boolean(id),
    // Keeps the tracking timeline moving while the order hasn't been
    // delivered yet, without the user needing to manually refresh.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && status !== "DELIVERED" ? 15000 : false;
    },
  });
}

/** Post-delivery review gate: only lets a user review a product once they
 * have a DELIVERED order containing it. UX-only — enforced here on the
 * client since reviews live in products-service, which has no visibility
 * into cart-service's orders (no cross-service Kafka consumer for this yet;
 * flagged as a known follow-up rather than added speculatively). */
export function useHasDeliveredOrder(productId: string) {
  const { data: orders } = useOrders();

  return (orders ?? []).some(
    (order) =>
      order.status === "DELIVERED" &&
      order.items.some((item) => item.productId === productId),
  );
}

export function usePayOrder(orderId: string) {
  const queryClient = useQueryClient();
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);

  return useMutation({
    mutationFn: (input: PayOrderInput) => {
      const fingerprint = JSON.stringify(input);
      if (!attempt.current || attempt.current.fingerprint !== fingerprint) {
        attempt.current = {
          fingerprint,
          key: `payment-${orderId}-${crypto.randomUUID()}`,
        };
      }
      return orderService.pay(orderId, input, attempt.current.key);
    },
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(orderId), order);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
