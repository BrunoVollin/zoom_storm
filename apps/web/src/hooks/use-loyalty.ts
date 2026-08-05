"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loyaltyService } from "@/services/loyalty-service";
import { queryKeys } from "@/constants/query-keys";
import { useCurrentUser } from "@/hooks/use-current-user";

export function useLoyaltyBalance() {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: queryKeys.loyalty.balance,
    queryFn: () => loyaltyService.getBalance(),
    enabled: Boolean(user),
  });
}

export function useRedeemLoyaltyPoints(cartId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (points: number) => {
      if (!cartId) throw new Error("Carrinho inexistente");
      return loyaltyService.redeem(cartId, points);
    },
    onSuccess: ({ cart, balance }) => {
      queryClient.setQueryData(queryKeys.cart.detail(cart.id), cart);
      queryClient.setQueryData(queryKeys.loyalty.balance, balance);
    },
  });
}
